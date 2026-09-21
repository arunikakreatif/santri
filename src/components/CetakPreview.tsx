/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Printer, 
  ArrowLeft, 
  Building,
  Info,
  FileText,
  CheckCircle
} from "lucide-react";
import { RABData, ProfilLembaga } from "../types";
import { cleanKabupatenName } from "../services/db";
import { formatLppKomponenNama, getCleanMadinName, getDesaOrAlamatSingkat } from "./belanja/LppTab";

interface CetakPreviewProps {
  rab: RABData;
  profil: ProfilLembaga;
  initialDocType?: "rab" | "lpp";
  onBack: () => void;
}

export default function CetakPreview({ 
  rab, 
  profil, 
  initialDocType = "rab",
  onBack 
}: CetakPreviewProps) {
  const [activeDoc, setActiveDoc] = useState<"rab" | "lpp">(initialDocType);

  // Parse Kop Surat details based on the exact style in Gambar 1
  const cleanNamaLembaga = (profil.namaLembaga || 'MADRASAH DINIYAH "BAITURROHMAN"').trim();
  
  // Pisahkan "MADRASAH DINIYAH" dan nama lembaga
  const hasMadrasahDiniyah = /MADRASAH\s+DINIYAH/i.test(cleanNamaLembaga);
  let line1Text = "MADRASAH   DINIYAH";
  let line2Text = "BAITURROHMAN";
  
  if (hasMadrasahDiniyah) {
    const rawBrand = cleanNamaLembaga.replace(/MADRASAH\s+DINIYAH/i, "").trim();
    const brandName = rawBrand.replace(/^["'“'”’‘]+|["'“'”’‘]+$/g, "").trim();
    if (brandName) {
      line2Text = brandName.toUpperCase();
    }
  } else {
    const brandName = cleanNamaLembaga.replace(/^["'“'”’‘]+|["'“'”’‘]+$/g, "").trim();
    line2Text = brandName.toUpperCase();
  }

  // Address parsing
  const rawAlamat = (profil.alamat || "").trim();
  
  // Get Desa name for signature
  const getDesaName = (alamatText: string): string => {
    const matchDesa = alamatText.match(/(?:desa|ds\.|kelurahan|kel\.)\s+([a-zA-Z\d\s]+?)(?:,|\s+kec\.|\s+kecamatan|\s+kab\.|\s+kabupaten|\s+rt\s|\s+rw\s|$)/i);
    if (matchDesa && matchDesa[1]) {
      const dName = matchDesa[1].trim();
      return dName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
    const addressParts = alamatText.split(",");
    for (const part of addressParts) {
      if (/poncol/i.test(part)) return "Poncol";
      if (/wonosari/i.test(part)) return "Wonosari";
    }
    return "Poncol";
  };

  const desaName = profil.desa 
    ? profil.desa.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : getDesaName(rawAlamat || "Poncol");

  // Baris 4 Kop: Susunan Wilayah (Contoh: WONOSARI PONCOL PONCOL MAGETAN)
  // HARUS BERSIH dari tanggal, tahun, nomor, ataupun koma
  const getKopLine4 = (): string => {
    // 1. Bersihkan Kabupaten dari embel-embel tanggal dan angka
    let cleanKab = cleanKabupatenName(profil.kabupaten || "Magetan").toUpperCase();
    cleanKab = cleanKab.replace(/,\s*\d+.*$/i, "").replace(/\d+/g, "").trim();

    // 2. Bersihkan Kecamatan
    let cleanKec = (profil.kecamatan || "Poncol")
      .replace(/^(kec\.?|kecamatan)\s+/i, "")
      .split(",")[0]
      .replace(/\d+/g, "")
      .trim()
      .toUpperCase();

    // 3. Bersihkan Desa
    let cleanDesa = (profil.desa || "")
      .replace(/^(desa|kelurahan|ds\.|kel\.)\s+/i, "")
      .split(",")[0]
      .replace(/\d+/g, "")
      .trim()
      .toUpperCase();

    // 4. Deteksi apakah alamat mengandung Wonosari dan Poncol (seperti pada Gambar 1)
    const upperAddr = rawAlamat.toUpperCase();
    const hasWonosari = /WONOSARI/i.test(upperAddr) || cleanDesa === "WONOSARI";
    const hasPoncolDesa = /DESA\s+PONCOL|DS\.?\s*PONCOL/i.test(upperAddr) || cleanDesa === "PONCOL";

    // Jika Wonosari & Poncol tertera (sesuai Gambar 1):
    if (hasWonosari && (hasPoncolDesa || cleanKec === "PONCOL")) {
      return `WONOSARI   PONCOL   ${cleanKec || "PONCOL"}   ${cleanKab || "MAGETAN"}`;
    }

    const parts: string[] = [];
    if (cleanDesa) parts.push(cleanDesa);
    if (cleanKec) parts.push(cleanKec);
    if (cleanKab) parts.push(cleanKab);

    if (parts.length > 0) {
      return parts.join("   ");
    }

    return "WONOSARI   PONCOL   PONCOL   MAGETAN";
  };

  const line4Text = getKopLine4();

  // Baris 5 Kop: Alamat lengkap satu baris (Bukan italic, lurus rapi di atas garis kop)
  const getKopLine5 = (): string => {
    let addr = rawAlamat;

    if (!addr) {
      return "Sekreariat : Jln.Basuki Rahmat  RT 20 RW 06 Wonosari, Desa Poncol Kec.Poncol Kab Magetan";
    }

    // Bersihkan tanggal jika pernah tersimpan di field alamat
    addr = addr.replace(/,\s*\d+\s+[A-Za-z]+\s+\d{4}.*$/i, "").trim();

    // Cek awalan Sekreariat / Sekretariat
    const prefixMatch = addr.match(/^(sekreariat|sekretariat)\s*:\s*/i);
    let prefix = "Sekreariat : ";
    if (prefixMatch) {
      prefix = prefixMatch[0].replace(/\s*:\s*/, " : ");
      addr = addr.slice(prefixMatch[0].length).trim();
    }

    // Rapikan spasi dan koma
    addr = addr.replace(/,\s*,+/g, ",").replace(/\s+/g, " ").trim();

    return `${prefix}${addr}`;
  };

  const line5Text = getKopLine5();

  const dateMatch = (profil.kotaTanggal || "").match(/\d+\s+[a-zA-Z]+\s+\d+/);
  const dateStr = dateMatch ? dateMatch[0] : `31 Desember ${rab.tahun || "2026"}`;
  const signaturePlaceDate = `${desaName}, ${dateStr}`;

  // Format IDR Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper to convert index to alphabet label (a., b., c...)
  const getAlphabetLabel = (index: number): string => {
    let label = "";
    let temp = index;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 97) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  };

  // Generate complete, pristine standalone HTML for printing
  const generatePrintableHtml = () => {
    let rowsHtml = "";

    rab.komponenList.forEach((komponen, compIdx) => {
      const compNo = compIdx + 1;
      // Header Komponen Row
      rowsHtml += `
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: center; font-weight: bold;">${compNo}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-transform: uppercase; font-weight: bold;" colspan="5">
            ${komponen.nama}
          </td>
        </tr>
      `;

      komponen.items.forEach((item, itemIdx) => {
        const computedVolume = item.jumlah * item.volume;
        const displaySatuan = item.satuanVolume && item.satuanVolume.trim() !== ""
          ? `${item.satuan}/${item.satuanVolume}`
          : item.satuan;
        const hargaSatuanFormatted = formatIDR(item.satuanHarga).replace("Rp", "").trim();
        const totalFormatted = formatIDR(item.total).replace("Rp", "").trim();

        rowsHtml += `
          <tr>
            <td style="border: 1px solid #000; padding: 2.5px 5px; text-align: center;">
              ${getAlphabetLabel(itemIdx)}.
            </td>
            <td style="border: 1px solid #000; padding: 2.5px 5px; padding-left: 10px; font-size: 8.5pt;">
              ${item.uraian}
            </td>
            <td style="border: 1px solid #000; padding: 2.5px 5px; text-align: center;">
              ${computedVolume}
            </td>
            <td style="border: 1px solid #000; padding: 2.5px 5px; text-align: center;">
              ${displaySatuan}
            </td>
            <td style="border: 1px solid #000; padding: 2.5px 5px; text-align: right;">
              ${hargaSatuanFormatted}
            </td>
            <td style="border: 1px solid #000; padding: 2.5px 5px; text-align: right; font-weight: bold;">
              ${totalFormatted}
            </td>
          </tr>
        `;
      });
    });

    const totalAnggaranFormatted = formatIDR(rab.totalAnggaran);
    const kepalaMadin = profil.namaKepala || "KH. MUHAMMAD SYAFII, S.Pd.I.";

    const logoHtml = profil.logo
      ? `<img src="${profil.logo}" alt="Logo Lembaga" style="width: 75px; height: 75px; object-fit: contain;" />`
      : `<div style="width: 75px; height: 75px; border-radius: 50%; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 26px;">🏛</div>`;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>printed by santri</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 8.5pt;
      line-height: 1.25;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .container {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 15mm 8mm 15mm;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .kop-header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-logo {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 75px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kop-text {
      width: 100%;
      text-align: center;
      padding: 0 85px;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-text h2 {
      margin: 0;
      padding: 0;
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      line-height: 1.1;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-text h1 {
      margin: 2px 0;
      padding: 0;
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: normal;
      text-transform: uppercase;
      line-height: 1.1;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-text .nsm {
      margin: 0;
      padding: 0;
      font-size: 8.5pt;
      font-weight: bold;
      line-height: 1.2;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-text .wilayah {
      margin: 2px 0 0 0;
      padding: 0;
      font-size: 8.5pt;
      font-weight: bold;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      line-height: 1.2;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-text .alamat {
      margin: 2px 0 0 0;
      padding: 0;
      font-size: 8pt;
      font-weight: normal;
      line-height: 1.2;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .kop-double-line {
      margin-top: 5px;
      margin-bottom: 12px;
    }
    .kop-line-thick {
      border-top: 3px solid #000;
      margin-bottom: 2px;
    }
    .kop-line-thin {
      border-top: 1px solid #000;
    }
    .doc-title {
      text-align: center;
      margin-bottom: 12px;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .doc-title h1 {
      margin: 0;
      padding: 0;
      font-size: 12pt;
      font-weight: 900;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .doc-title h2 {
      margin: 2px 0;
      padding: 0;
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .doc-title .sumber-dana {
      margin: 2px 0 0 0;
      padding: 0;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      font-family: Arial, Helvetica, sans-serif !important;
      margin: 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 2.5px 5px;
      vertical-align: middle;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      padding: 4px 4px;
      font-size: 8.5pt;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .total-row {
      font-weight: bold;
      background-color: #f1f5f9;
      font-size: 9pt;
    }
    .total-value {
      font-size: 9.5pt;
      font-weight: bold;
      text-align: right;
    }
    .signature-container {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
      break-inside: avoid;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .signature-box {
      width: 280px;
      text-align: center;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .signature-date {
      font-size: 8.5pt;
      margin-bottom: 2px;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .signature-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9pt;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .signature-space {
      height: 46px;
    }
    .signature-name {
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
      font-size: 9pt;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .footer-printed-by {
      margin-top: 12px;
      text-align: left;
      font-size: 8pt;
      color: #000;
      font-family: Arial, Helvetica, sans-serif !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <!-- Kop Surat (Gambar 1) -->
      <div class="kop-header">
        <div class="kop-logo">
          ${logoHtml}
        </div>
        <div class="kop-text">
          <h2>${line1Text}</h2>
          <h1>“ ${line2Text} ”</h1>
          <p class="nsm">NSM : ${profil.nsm || "311235200122"}</p>
          <p class="wilayah">${line4Text}</p>
          <p class="alamat">${line5Text}</p>
        </div>
      </div>

      <div class="kop-double-line">
        <div class="kop-line-thick"></div>
        <div class="kop-line-thin"></div>
      </div>

      <!-- Judul Dokumen -->
      <div class="doc-title">
        <h1>RENCANA ANGGARAN BIAYA (RAB)</h1>
        <h2>DANA HIBAH BPPDGS TAHUN ANGGARAN ${rab.tahun}</h2>
        <div class="sumber-dana">SUMBER DANA: ${rab.sumberDana}</div>
      </div>

      <!-- Tabel Data Utama -->
      <table>
        <thead>
          <tr>
            <th style="width: 28px;">No</th>
            <th>Uraian Kegiatan</th>
            <th style="width: 48px;">Volume</th>
            <th style="width: 65px;">Satuan</th>
            <th style="width: 90px;">Harga Satuan (Rp)</th>
            <th style="width: 100px;">Jumlah Biaya (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">
            <td colspan="2" style="border: 1px solid #000; text-align: center; padding: 4px 6px;">
              TOTAL ANGGARAN KESELURUHAN (RAB)
            </td>
            <td colspan="4" class="total-value" style="border: 1px solid #000; padding: 4px 6px;">
              ${totalAnggaranFormatted}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Tanda Tangan -->
      <div class="signature-container">
        <div class="signature-box">
          <div class="signature-date">${signaturePlaceDate}</div>
          <div class="signature-title">Kepala Madrasah Diniyah</div>
          <div class="signature-space"></div>
          <div class="signature-name">${kepalaMadin}</div>
        </div>
      </div>
    </div>

    <!-- Footer 'printed by santri' menggantikan about:blank -->
    <div class="footer-printed-by">
      printed by santri
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  // Generate complete, pristine standalone HTML untuk LPP (Laporan Program Pelaksanaan)
  const generatePrintableLppHtml = () => {
    let rowsHtml = "";
    const namaMadinLpp = getCleanMadinName(profil.namaLembaga);
    const alamatMadinLpp = getDesaOrAlamatSingkat(profil);
    const kecamatanMadinLpp = (profil.kecamatan || "PONCOL").replace(/^(kec\.?|kecamatan)\s+/i, "").trim().toUpperCase();
    const kabupatenMadinLpp = cleanKabupatenName(profil.kabupaten || "MAGETAN").toUpperCase();
    const signatureDateLpp = `${desaName}, ${dateStr}`;
    const namaKepalaLpp = (profil.namaKepala || "SARNI BASORI").toUpperCase();

    rab.komponenList.forEach((komponen, compIdx) => {
      const compNo = compIdx + 1;
      const compNama = formatLppKomponenNama(komponen.nama);
      const items = komponen.items && komponen.items.length > 0 ? komponen.items : [{ id: `empty-${compIdx}`, uraian: "-", jumlah: 0, satuan: "", volume: 0, satuanVolume: "", satuanHarga: 0, total: 0 }];

      items.forEach((item, itemIdx) => {
        const isFirst = itemIdx === 0;
        rowsHtml += `
          <tr>
            <td style="border: 1px solid #000; padding: 4px 4px; text-align: center; font-size: 8.5pt; font-weight: ${isFirst ? "bold" : "normal"}; vertical-align: middle;">
              ${isFirst ? compNo : ""}
            </td>
            <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: ${isFirst ? "500" : "normal"}; vertical-align: middle;">
              ${isFirst ? compNama : ""}
            </td>
            <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: middle;">
              ${item.uraian}
            </td>
            <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 8.5pt; vertical-align: middle;">
              Tercapai
            </td>
            <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: middle;"></td>
            <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: middle;"></td>
          </tr>
        `;
      });
    });

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>printed by santri</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 8.5pt;
      line-height: 1.25;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .container {
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 15mm 10mm 15mm;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .content-area {
      flex: 1;
    }
    .header-lpp {
      text-align: center;
      margin-bottom: 14px;
    }
    .header-lpp h1 {
      font-size: 11.5pt;
      font-weight: bold;
      margin: 0 0 3px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-lpp h2 {
      font-size: 10.5pt;
      font-weight: bold;
      margin: 0 0 3px 0;
      text-transform: uppercase;
    }
    .header-lpp h3 {
      font-size: 10.5pt;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
    }
    .meta-table {
      margin-bottom: 12px;
      font-size: 8.5pt;
      font-weight: bold;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .meta-table td {
      padding: 1.5px 0;
      vertical-align: top;
    }
    .meta-label { width: 130px; }
    .meta-colon { width: 14px; text-align: center; }
    .meta-value { text-transform: uppercase; }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 8.5pt;
    }
    table.data-table th {
      border: 1.5px solid #000;
      background-color: #f8fafc;
      padding: 5px 4px;
      text-align: center;
      font-weight: bold;
      font-size: 8.5pt;
    }
    table.data-table td {
      border: 1px solid #000;
      padding: 4px 6px;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    .signature-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-box {
      width: 250px;
      text-align: center;
      font-size: 8.5pt;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .signature-date { margin-bottom: 3px; }
    .signature-role { font-weight: normal; margin-bottom: 2px; }
    .signature-madin { font-weight: normal; margin-bottom: 50px; }
    .signature-name { font-weight: bold; text-decoration: none; text-transform: uppercase; }
    .signature-nip { font-size: 8pt; margin-top: 2px; }
    .footer-printed-by {
      font-size: 8pt;
      font-family: Arial, Helvetica, sans-serif !important;
      color: #000000;
      text-align: left;
      margin-top: 12px;
      padding-top: 4px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content-area">
      <div class="header-lpp">
        <h1>LAPORAN PROGRAM PELAKSANAAN</h1>
        <h2>PROGRAM BANTUAN PENYELENGGARAAN PENDIDIKAN DINIYAH DAN GURU SWASTA (BPPDGS)</h2>
        <h3>TAHUN ${rab.tahun}</h3>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">NAMA MADIN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${namaMadinLpp}</td>
        </tr>
        <tr>
          <td class="meta-label">ALAMAT</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${alamatMadinLpp}</td>
        </tr>
        <tr>
          <td class="meta-label">KECAMATAN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${kecamatanMadinLpp}</td>
        </tr>
        <tr>
          <td class="meta-label">KABUPATEN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${kabupatenMadinLpp}</td>
        </tr>
        <tr>
          <td class="meta-label">BULAN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">JANUARI S/D DESEMBER</td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 32px;">No</th>
            <th style="width: 170px;">Komponen Kegiatan</th>
            <th>Rincian Kegiatan</th>
            <th style="width: 85px;">Hasil yang dicapai</th>
            <th style="width: 120px;">Permasalahn yang dihadapi</th>
            <th style="width: 130px;">Upaya Pemecahan Masalah</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signature-container">
        <div class="signature-box">
          <div class="signature-date">${signatureDateLpp}</div>
          <div class="signature-role">Mengetahui,</div>
          <div class="signature-madin">Kepala MD ${namaMadinLpp}</div>
          <div class="signature-name">${namaKepalaLpp}</div>
          ${profil.nipKepala ? `<div class="signature-nip">NIP. ${profil.nipKepala}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- Footer 'printed by santri' menggantikan about:blank -->
    <div class="footer-printed-by">
      printed by santri
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  // Trigger Print dengan isolasi cetak sempurna (mendukung popup & iframe fallback)
  const handlePrint = () => {
    const html = activeDoc === "lpp" ? generatePrintableLppHtml() : generatePrintableHtml();

    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch {
      printWindow = null;
    }

    if (!printWindow) {
      // Fallback untuk browser/iframe yang memblokir window.open
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }, 400);
      }
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="print-preview-container">
      {/* Action Bar (Hidden on Print) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            id="btn-print-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Arsip
          </button>

          {/* Document Switcher Tab */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveDoc("rab")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeDoc === "rab" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen 1: RAB</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("lpp")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeDoc === "lpp" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Dokumen 2: LPP (Program Pelaksanaan)</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            id="btn-print-action"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak {activeDoc === "lpp" ? "LPP" : "RAB"} Sekarang</span>
          </button>
        </div>
      </div>

      {/* Info Warning (Hidden on Print) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-800 print:hidden">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">
            Panduan Mencetak / Menyimpan PDF {activeDoc === "lpp" ? "Dokumen Laporan Program Pelaksanaan (LPP)" : "Dokumen Rencana Anggaran Biaya (RAB)"}:
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700/90 leading-relaxed">
            <li>Klik tombol <strong>Cetak {activeDoc === "lpp" ? "LPP" : "RAB"} Sekarang</strong> untuk membuka jendela cetak resmi browser (A4 Portrait).</li>
            <li>Untuk menyimpannya sebagai berkas PDF resmi, pilih opsi <strong>Simpan sebagai PDF (Save as PDF)</strong> pada tujuan pencetakan.</li>
            <li>Pastikan mencentang opsi <strong>Cetak Gambar Latar (Print Background Graphics)</strong> di setelan tambahan agar garis dan warna tabel tetap tercetak presisi.</li>
          </ul>
        </div>
      </div>

      {/* Document Page Canvas (A4 Styled representation in Web, pure page layout in print) */}
      <div 
        className="bg-white rounded-xl shadow-md border border-slate-200 mx-auto max-w-[21cm] p-[1.2cm] text-black text-xs print:shadow-none print:border-none print:p-0 print:mx-0 print:max-w-none print:bg-white"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        id="print-sheet-canvas"
      >
        {/* PRINT MEDIA CSS INJECTOR */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            /* Hide unnecessary UI elements */
            #sidebar-nav,
            header,
            .print\\:hidden,
            #btn-print-back,
            #btn-print-action,
            #btn-csv-export,
            .bg-blue-50 {
              display: none !important;
            }

            /* Reset HTML, body, and major elements */
            html, body {
              background-color: white !important;
              background: white !important;
              color: black !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            #root,
            .min-h-screen,
            #main-content-wrapper,
            main,
            #print-preview-container {
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: none !important;
              min-width: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: transparent !important;
            }

            /* Make canvas fill full sheet with 0 margin from browser */
            #print-sheet-canvas {
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              width: 210mm !important;
              min-height: 297mm !important;
              max-width: none !important;
              margin: 0 auto !important;
              padding: 10mm 15mm 8mm 15mm !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            @page {
              size: A4 portrait;
              margin: 0;
            }

            /* Prevent table rows from splitting mid-page */
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Prevent component headings or signatures from splitting */
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Keep table header visible on each printed page */
            thead {
              display: table-header-group !important;
            }

            /* Preserve exact background colors and styles */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        {activeDoc === "rab" ? (
          <>
            {/* 1. KOP SURAT (PERSIS GAMBAR 1, FONT ARIAL) */}
            <div 
              className="relative w-full pb-1 flex items-center justify-center min-h-[95px]" 
              id="kop-surat-header" 
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {/* Logo Lembaga di sisi kiri */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center justify-center">
                {profil.logo ? (
                  <img 
                    src={profil.logo} 
                    alt="Logo Lembaga" 
                    className="w-18 h-18 sm:w-20 sm:h-20 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center border border-black shrink-0">
                    <Building className="w-9 h-9 sm:w-10 sm:h-10 text-black" />
                  </div>
                )}
              </div>
              
              {/* Teks Kop Tengah Simetris (Persis Susunan Gambar 1) */}
              <div className="w-full text-center px-18 sm:px-24 space-y-0.5">
                <h2 className="text-[14px] sm:text-[16px] font-bold tracking-[0.22em] text-black uppercase leading-tight m-0 p-0">
                  {line1Text}
                </h2>
                <h1 className="text-lg sm:text-[23px] font-black tracking-normal text-black uppercase leading-tight my-0.5 p-0">
                  “ {line2Text} ”
                </h1>
                <p className="text-[11px] sm:text-[11.5px] font-bold text-black leading-tight m-0 p-0">
                  NSM : {profil.nsm || "311235200122"}
                </p>
                <p className="text-[11px] sm:text-[11.5px] font-bold text-black uppercase leading-tight mt-0.5 tracking-wider p-0">
                  {line4Text}
                </p>
                <p className="text-[9.5px] sm:text-[10.5px] font-normal text-black mt-0.5 leading-normal m-0 p-0">
                  {line5Text}
                </p>
              </div>
            </div>

            {/* DOUBLE HORIZONTAL LINE (GARIS KOP TEBAL-TIPIS SESUAI GAMBAR 1) */}
            <div className="w-full flex flex-col gap-[2px] mt-1 mb-4" id="kop-double-line">
              <div className="h-[3px] bg-black w-full" />
              <div className="h-[1px] bg-black w-full" />
            </div>

            {/* 2. JUDUL DOKUMEN */}
            <div className="text-center space-y-0.5 mb-4" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              <h1 className="text-base font-black tracking-tight text-black uppercase">
                RENCANA ANGGARAN BIAYA (RAB)
              </h1>
              <h2 className="text-xs font-bold text-black uppercase">
                DANA HIBAH BPPDGS TAHUN ANGGARAN {rab.tahun}
              </h2>
              <div className="text-[11px] font-bold text-black uppercase">
                SUMBER DANA: {rab.sumberDana}
              </div>
            </div>

            {/* 3. TABEL DATA UTAMA (TIDAK TERLALU RENGGANG, SESUAI TEKS ISI) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-black text-xs text-black" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                <thead>
                  <tr className="bg-slate-100/60 text-black">
                    <th className="border border-black px-1.5 py-1 text-center font-bold w-9">No</th>
                    <th className="border border-black px-2 py-1 text-center font-bold">Uraian Kegiatan</th>
                    <th className="border border-black px-1.5 py-1 text-center font-bold w-14">Volume</th>
                    <th className="border border-black px-1.5 py-1 text-center font-bold w-18">Satuan</th>
                    <th className="border border-black px-2 py-1 text-center font-bold w-24">Harga Satuan (Rp)</th>
                    <th className="border border-black px-2 py-1 text-center font-bold w-28">Jumlah Biaya (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {rab.komponenList.map((komponen, compIdx) => {
                    const compNo = compIdx + 1;

                    return (
                      <React.Fragment key={komponen.nama}>
                        {/* Header Komponen Row */}
                        <tr className="font-bold text-black bg-slate-50/70">
                          <td className="border border-black px-1.5 py-0.5 text-center">{compNo}</td>
                          <td className="border border-black px-2 py-0.5 uppercase font-bold" colSpan={5}>
                            {komponen.nama}
                          </td>
                        </tr>

                        {/* Sub-item Rows */}
                        {komponen.items.map((item, itemIdx) => {
                          const computedVolume = item.jumlah * item.volume;
                          const displaySatuan = item.satuanVolume && item.satuanVolume.trim() !== ""
                            ? `${item.satuan}/${item.satuanVolume}`
                            : item.satuan;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/40">
                              <td className="border border-black px-1.5 py-0.5 text-center text-black font-medium">
                                {getAlphabetLabel(itemIdx)}.
                              </td>
                              <td className="border border-black px-2 py-0.5 pl-3 text-black text-[11px]">
                                {item.uraian}
                              </td>
                              <td className="border border-black px-1.5 py-0.5 text-center text-black">
                                {computedVolume}
                              </td>
                              <td className="border border-black px-1.5 py-0.5 text-center text-black">
                                {displaySatuan}
                              </td>
                              <td className="border border-black px-2 py-0.5 text-right text-black">
                                {formatIDR(item.satuanHarga).replace("Rp", "").trim()}
                              </td>
                              <td className="border border-black px-2 py-0.5 text-right font-bold text-black">
                                {formatIDR(item.total).replace("Rp", "").trim()}
                              </td>
                            </tr>
                          );
                        })}

                      </React.Fragment>
                    );
                  })}

                  {/* Total Row */}
                  <tr className="font-bold text-black text-xs bg-slate-100/60">
                    <td className="border border-black px-2 py-1.5 text-center" colSpan={2}>
                      TOTAL ANGGARAN KESELURUHAN (RAB)
                    </td>
                    <td className="border border-black px-2 py-1.5 text-right font-bold text-xs text-black" colSpan={4}>
                      {formatIDR(rab.totalAnggaran)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. TANDA TANGAN (SIGNATURE BLOCK) */}
            <div className="mt-8 flex justify-end page-break-avoid" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              <div className="w-[7.5cm] text-center space-y-12">
                <div className="space-y-1">
                  <p className="text-xs text-black">
                    {signaturePlaceDate}
                  </p>
                  <p className="font-bold text-black uppercase leading-tight text-xs">
                    Kepala Madrasah Diniyah
                  </p>
                </div>
                
                <div className="space-y-0.5">
                  <p className="font-bold text-black underline uppercase text-xs">
                    {profil.namaKepala || "KH. MUHAMMAD SYAFII, S.Pd.I."}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6 text-black" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
            {/* 1. JUDUL LAPORAN LPP */}
            <div className="text-center space-y-0.5">
              <h1 className="text-sm sm:text-base font-bold text-black uppercase tracking-tight">
                LAPORAN PROGRAM PELAKSANAAN
              </h1>
              <h2 className="text-xs sm:text-sm font-bold text-black uppercase">
                PROGRAM BANTUAN PENYELENGGARAAN PENDIDIKAN DINIYAH DAN GURU SWASTA (BPPDGS)
              </h2>
              <h3 className="text-xs sm:text-sm font-bold text-black uppercase">
                TAHUN {rab.tahun}
              </h3>
            </div>

            {/* 2. METADATA LEMBAGA */}
            <div className="text-xs font-bold leading-relaxed space-y-0.5 text-black">
              <div className="flex">
                <span className="w-36">NAMA MADIN</span>
                <span className="w-4 text-center">:</span>
                <span className="uppercase">{getCleanMadinName(profil.namaLembaga)}</span>
              </div>
              <div className="flex">
                <span className="w-36">ALAMAT</span>
                <span className="w-4 text-center">:</span>
                <span className="uppercase">{getDesaOrAlamatSingkat(profil)}</span>
              </div>
              <div className="flex">
                <span className="w-36">KECAMATAN</span>
                <span className="w-4 text-center">:</span>
                <span className="uppercase">{(profil.kecamatan || "PONCOL").replace(/^(kec\.?|kecamatan)\s+/i, "").trim().toUpperCase()}</span>
              </div>
              <div className="flex">
                <span className="w-36">KABUPATEN</span>
                <span className="w-4 text-center">:</span>
                <span className="uppercase">{cleanKabupatenName(profil.kabupaten || "MAGETAN").toUpperCase()}</span>
              </div>
              <div className="flex">
                <span className="w-36">BULAN</span>
                <span className="w-4 text-center">:</span>
                <span className="uppercase">JANUARI S/D DESEMBER</span>
              </div>
            </div>

            {/* 3. TABEL DATA LPP */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[11px] sm:text-xs text-black">
                <thead>
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="border border-black px-1.5 py-1.5 w-9">No</th>
                    <th className="border border-black px-2 py-1.5 w-44 text-center">Komponen Kegiatan</th>
                    <th className="border border-black px-2 py-1.5 text-center">Rincian Kegiatan</th>
                    <th className="border border-black px-1.5 py-1.5 w-24 text-center">Hasil yang dicapai</th>
                    <th className="border border-black px-2 py-1.5 w-36 text-center">Permasalahn yang dihadapi</th>
                    <th className="border border-black px-2 py-1.5 w-36 text-center">Upaya Pemecahan Masalah</th>
                  </tr>
                </thead>
                <tbody>
                  {rab.komponenList.map((komponen, compIdx) => {
                    const compNo = compIdx + 1;
                    const compNama = formatLppKomponenNama(komponen.nama);
                    const items = komponen.items && komponen.items.length > 0 ? komponen.items : [{ id: `empty-${compIdx}`, uraian: "-", jumlah: 0, satuan: "", volume: 0, satuanVolume: "", satuanHarga: 0, total: 0 }];

                    return items.map((item, itemIdx) => {
                      const isFirst = itemIdx === 0;
                      return (
                        <tr key={`${compIdx}-${item.id || itemIdx}`}>
                          <td className={`border border-black px-1.5 py-1 text-center ${isFirst ? "font-bold" : ""}`}>
                            {isFirst ? compNo : ""}
                          </td>
                          <td className={`border border-black px-2 py-1 text-left ${isFirst ? "font-medium" : ""}`}>
                            {isFirst ? compNama : ""}
                          </td>
                          <td className="border border-black px-2 py-1 text-left">
                            {item.uraian}
                          </td>
                          <td className="border border-black px-1.5 py-1 text-center">
                            Tercapai
                          </td>
                          <td className="border border-black px-2 py-1 text-left"></td>
                          <td className="border border-black px-2 py-1 text-left"></td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. TANDA TANGAN LPP */}
            <div className="mt-8 flex justify-end page-break-avoid text-xs text-black">
              <div className="w-64 text-center space-y-0.5">
                <div>{signaturePlaceDate}</div>
                <div>Mengetahui,</div>
                <div className="mb-14">Kepala MD {getCleanMadinName(profil.namaLembaga)}</div>
                <div className="font-bold uppercase">{profil.namaKepala || "SARNI BASORI"}</div>
                {profil.nipKepala && (
                  <div className="text-[10px] text-slate-700">NIP. {profil.nipKepala}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. FOOTER 'printed by santri' PENGGANTI about:blank */}
        <div 
          className="mt-6 text-left text-[10px] text-black" 
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          printed by santri
        </div>

      </div>
    </div>
  );
}
