/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { Printer, FileSpreadsheet, AlertCircle } from "lucide-react";
import { BkpRow, ProfilLembaga } from "../../types";
import { cleanKabupatenName } from "../../services/db";

interface BkpTabProps {
  profil: ProfilLembaga;
  tahun: string;
  bkpData: {
    rows: BkpRow[];
    totalPenerimaan: number;
    totalPengeluaran: number;
    saldoAkhir: number;
  };
  onNavigateToPenerimaan: () => void;
  onNavigateToKwitansi: () => void;
}

export default function BkpTab({
  profil,
  tahun,
  bkpData,
  onNavigateToPenerimaan,
  onNavigateToKwitansi
}: BkpTabProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Helper pembersihan nama madin
  const cleanMadinUpper = (name?: string) => {
    if (!name) return "BAITURROHMAN";
    return name
      .replace(/^(madrasah diniyah|madin|md\.?)\s+/i, "")
      .replace(/^["'“'”’‘]+|["'“'”’‘]+$/g, "")
      .trim()
      .toUpperCase();
  };

  const cleanMadinTitle = (name?: string) => {
    if (!name) return "Baiturrohman";
    const cleaned = name
      .replace(/^(madrasah diniyah|madin|md\.?)\s+/i, "")
      .replace(/^["'“'”’‘]+|["'“'”’‘]+$/g, "")
      .trim();
    return cleaned
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper ekstraksi Nama Desa dari profil madrasah
  const getNamaDesaUpper = (prof: ProfilLembaga) => {
    if (prof.desa && prof.desa.trim() && !/^(desa|kelurahan)$/i.test(prof.desa.trim())) {
      return prof.desa
        .replace(/^(desa|kelurahan|ds\.|kel\.)\s+/i, "")
        .trim()
        .toUpperCase();
    }

    const raw = (prof.alamat || "").trim();
    if (!raw) return (prof.kecamatan || "PONCOL").toUpperCase();

    const matchExplicit = raw.match(/(?:desa|ds\.|kelurahan|kel\.)\s+([a-zA-Z\d\s]+?)(?:,|\s+kec\.|\s+kecamatan|\s+kab\.|\s+kabupaten|\s+rt\s|\s+rw\s|$)/i);
    if (matchExplicit && matchExplicit[1] && matchExplicit[1].trim()) {
      return matchExplicit[1].trim().toUpperCase();
    }

    const parts = raw.split(",").map(p => p.trim());
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i].replace(/^(desa|kelurahan|ds\.|kel\.|kec\.|kecamatan|kab\.|kabupaten)\s+/i, "").trim();
        if (prof.kecamatan && p.toLowerCase() === prof.kecamatan.toLowerCase()) continue;
        if (prof.kabupaten && p.toLowerCase() === prof.kabupaten.toLowerCase()) continue;
        if (/^(rt|rw)\s*\d+/i.test(p)) continue;
        if (p.length > 2) {
          return p.toUpperCase();
        }
      }
    }

    if (/wonosari/i.test(raw)) return "WONOSARI";
    if (/poncol/i.test(raw)) return "PONCOL";
    if (/sukomaju/i.test(raw)) return "SUKOMAJU";
    if (/bogem/i.test(raw)) return "BOGEM";

    const locWords = raw
      .replace(/(jln\.|jalan|jl\.|rt\s*\d+|rw\s*\d+|no\.|nomor\s*\d+|sekretariat|sekreariat|:\s*)/gi, " ")
      .replace(/[^a-zA-Z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(w => {
        const lw = w.toLowerCase();
        const stop = ["desa", "kelurahan", "ds", "kel", "kec", "kecamatan", "kab", "kabupaten", "prov", "provinsi"];
        if (stop.includes(lw)) return false;
        if (prof.kecamatan && lw === prof.kecamatan.toLowerCase()) return false;
        if (prof.kabupaten && lw === prof.kabupaten.toLowerCase()) return false;
        return w.length > 2;
      });

    if (locWords.length > 0) {
      return locWords[locWords.length - 1].toUpperCase();
    }

    return (prof.kecamatan || "PONCOL").toUpperCase();
  };

  const getNamaDesaTitle = (prof: ProfilLembaga) => {
    const upper = getNamaDesaUpper(prof);
    return upper
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getTitimangsaBkp = () => {
    const tempat = getNamaDesaTitle(profil) || (profil.kecamatan || "Poncol");
    return `${tempat}, 31 Desember ${tahun}`;
  };

  const formatUraian = (text: string) => {
    if (!text) return "";
    return text
      .replace(/,([^\s])/g, ", $1")
      .replace(/\s+/g, " ")
      .trim();
  };

  const formatTanggalIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const generatePrintableHtml = () => {
    const namaMadin = cleanMadinUpper(profil.namaLembaga);
    const namaDesa = getNamaDesaUpper(profil);
    const kecamatan = (profil.kecamatan || "PONCOL").replace(/^(kec\.?|kecamatan)\s+/i, "").trim().toUpperCase();
    const kabupaten = cleanKabupatenName(profil.kabupaten || "MAGETAN").toUpperCase();
    const titimangsa = getTitimangsaBkp();
    const namaKepala = (profil.namaKepala || "").toUpperCase();
    const namaBendahara = (profil.namaBendahara || "").toUpperCase();
    const namaMadinTitle = cleanMadinTitle(profil.namaLembaga);

    const rowsHtml = bkpData.rows.length === 0 
      ? `<tr><td colspan="5" style="border: 1px solid #000; padding: 14px; text-align: center; font-style: italic;">Belum ada transaksi tercatat untuk Buku Kas Pembantu.</td></tr>`
      : bkpData.rows.map((row) => `
        <tr>
          <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; white-space: nowrap;">${formatTanggalIndo(row.tanggal)}</td>
          <td style="border: 1px solid #000; padding: 6px 8px; text-align: left;">${row.uraian}</td>
          <td style="border: 1px solid #000; padding: 6px 8px;">
            ${row.penerimaan > 0 ? `<div class="currency-box"><span>Rp</span><span>${row.penerimaan.toLocaleString('id-ID')}</span></div>` : ''}
          </td>
          <td style="border: 1px solid #000; padding: 6px 8px;">
            ${row.pengeluaran > 0 ? `<div class="currency-box"><span>Rp</span><span>${row.pengeluaran.toLocaleString('id-ID')}</span></div>` : ''}
          </td>
          <td style="border: 1px solid #000; padding: 6px 8px;">
            <div class="currency-box">
              <span>Rp</span>
              <span>${row.saldo === 0 ? '-' : row.saldo.toLocaleString('id-ID')}</span>
            </div>
          </td>
        </tr>
      `).join('');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Kas Pembantu - ${namaMadin}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #f8fafc;
      padding: 24px;
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
      }
      .no-print {
        display: none !important;
      }
      .print-page-wrapper {
        width: 210mm !important;
        min-height: 297mm !important;
        padding: 18mm 20mm 14mm 20mm !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      .footer-printed-by {
        position: fixed !important;
        bottom: 8mm !important;
        left: 20mm !important;
        font-size: 9.5px !important;
        color: #64748b !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    }
    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      margin-bottom: 24px;
      border-radius: 8px;
      font-size: 13px;
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn-action-print {
      background: #059669;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-action-close {
      background: #475569;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      margin-left: 8px;
      cursor: pointer;
    }
    .print-page-wrapper {
      max-width: 820px;
      min-height: 1050px;
      margin: 0 auto;
      background: #fff;
      padding: 36px 40px 24px 40px;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header-bku-pembantu {
      text-align: center;
      margin-bottom: 22px;
    }
    .header-bku-pembantu h1 {
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000;
      margin: 0;
    }
    .meta-table {
      margin-bottom: 14px;
      font-size: 12px;
      font-weight: bold;
      color: #000;
    }
    .meta-table table {
      border-collapse: collapse;
      border: none !important;
    }
    .meta-table td {
      border: none !important;
      padding: 2px 4px 2px 0;
      vertical-align: top;
      color: #000;
    }
    table.bkp-main-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      border: 1.5px solid #000;
      color: #000;
    }
    table.bkp-main-table th {
      background-color: #d1d5db; /* Abu-abu persis gambar referensi */
      border: 1px solid #000;
      padding: 7px 6px;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      color: #000;
    }
    table.bkp-main-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      color: #000;
    }
    .currency-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-variant-numeric: tabular-nums;
    }
    .footer-total-row td {
      background-color: #d1d5db !important;
      font-weight: bold;
      border: 1px solid #000;
      padding: 7px 8px;
      color: #000;
    }
    .sig-section {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #000;
      padding: 0 10px;
    }
    .sig-box {
      width: 260px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 105px;
    }
    .sig-box p {
      margin: 0;
      color: #000;
    }
    .sig-name {
      font-weight: bold;
      text-transform: uppercase;
      color: #000;
    }
    .footer-printed-by {
      font-size: 10px;
      color: #64748b;
      text-align: left;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="no-print no-print-bar">
    <span>Buku Kas Pembantu (BKP) — <strong>${namaMadin}</strong></span>
    <div>
      <button class="btn-action-print" onclick="window.print()">Cetak Dokumen</button>
      <button class="btn-action-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="print-page-wrapper">
    <div>
      <!-- Judul Tengah Sesuai Gambar -->
      <div class="header-bku-pembantu">
        <h1>BUKU KAS PEMBANTU</h1>
      </div>

      <!-- Metadata Kiri Atas Sesuai Gambar -->
      <div class="meta-table">
        <table>
          <tbody>
            <tr>
              <td style="width: 110px;">NAMA MADIN</td>
              <td style="width: 15px; text-align: center;">:</td>
              <td>${namaMadin}</td>
            </tr>
            <tr>
              <td>ALAMAT</td>
              <td style="text-align: center;">:</td>
              <td>${namaDesa}</td>
            </tr>
            <tr>
              <td>KECAMATAN</td>
              <td style="text-align: center;">:</td>
              <td>${kecamatan}</td>
            </tr>
            <tr>
              <td>KABUPATEN</td>
              <td style="text-align: center;">:</td>
              <td>${kabupaten}</td>
            </tr>
            <tr>
              <td>BULAN</td>
              <td style="text-align: center;">:</td>
              <td>JANUARI S/D DESEMBER</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabel 5 Kolom Sesuai Gambar -->
      <table class="bkp-main-table">
        <thead>
          <tr>
            <th style="width: 100px;">TANGGAL</th>
            <th>URAIAN</th>
            <th style="width: 125px;">PENERIMAAN</th>
            <th style="width: 125px;">PENGELUARAN</th>
            <th style="width: 125px;">SALDO</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr class="footer-total-row">
            <td colspan="2" style="text-align: center;">Jumlah</td>
            <td>
              <div class="currency-box">
                <span>Rp</span>
                <span>${bkpData.totalPenerimaan.toLocaleString('id-ID')}</span>
              </div>
            </td>
            <td>
              <div class="currency-box">
                <span>Rp</span>
                <span>${bkpData.totalPengeluaran.toLocaleString('id-ID')}</span>
              </div>
            </td>
            <td>
              <div class="currency-box">
                <span>Rp</span>
                <span>${bkpData.saldoAkhir === 0 ? '-' : bkpData.saldoAkhir.toLocaleString('id-ID')}</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Tanda Tangan Sesuai Format Gambar -->
      <div class="sig-section">
        <div class="sig-box">
          <div>
            <p>Mengetahui,</p>
            <p>Kepala MD ${namaMadinTitle}</p>
          </div>
          <div>
            <p class="sig-name">${namaKepala}</p>
          </div>
        </div>

        <div class="sig-box">
          <div>
            <p>${titimangsa}</p>
            <p>Bendahara</p>
          </div>
          <div>
            <p class="sig-name">${namaBendahara}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-printed-by">
      printed by Santri
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = generatePrintableHtml();
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      iframe.contentWindow?.document.open();
      iframe.contentWindow?.document.write(html);
      iframe.contentWindow?.document.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const namaMadinUpper = cleanMadinUpper(profil.namaLembaga);
  const namaMadinTitle = cleanMadinTitle(profil.namaLembaga);
  const desaUpper = getNamaDesaUpper(profil);
  const kecamatanUpper = (profil.kecamatan || "PONCOL").replace(/^(kec\.?|kecamatan)\s+/i, "").trim().toUpperCase();
  const kabupatenUpper = cleanKabupatenName(profil.kabupaten || "MAGETAN").toUpperCase();
  const titimangsa = getTitimangsaBkp();

  return (
    <div className="space-y-6">
      
      {/* Top Banner Toolbar (Hidden on print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Buku Kas Pembantu
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Pembukuan realisasi kas pembantu 5 kolom per transaksi pencairan dan kwitansi belanja TA {tahun}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Buka jendela cetak A4 atau pilih opsi 'Simpan sebagai PDF' di browser"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen BKP
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Hidden on print) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Penerimaan (Dana Hibah)</p>
          <p className="text-lg font-black text-emerald-700 mt-1">
            Rp {bkpData.totalPenerimaan.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran (Belanja Realisasi)</p>
          <p className="text-lg font-black text-amber-700 mt-1">
            Rp {bkpData.totalPengeluaran.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saldo Kas Akhir</p>
          <p className="text-lg font-black text-blue-700 mt-1">
            Rp {bkpData.saldoAkhir.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Outer Preview Card (Screen only) */}
      <div className="bg-white p-4 sm:p-6 md:p-10 rounded-2xl border border-slate-200/80 shadow-xs print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto">
        {/* BKP Printable Sheet - strictly borderless and standard A4 proportions */}
        <div 
          ref={printRef}
          className="dokumen-cetak-resmi bg-white text-black font-sans w-full border-none p-0 m-0"
        >
          {/* Judul Dokumen */}
          <div className="text-center mb-6 text-black">
            <h2 className="text-base md:text-lg font-bold tracking-wide uppercase text-black">
              BUKU KAS PEMBANTU
            </h2>
          </div>

        {/* Informasi Metadata Lembaga Sesuai Gambar */}
        <div className="mb-4 text-xs font-bold text-black">
          <table className="border-none text-xs font-bold text-black">
            <tbody>
              <tr>
                <td className="w-28 py-0.5 border-none font-bold">NAMA MADIN</td>
                <td className="w-4 text-center py-0.5 border-none font-bold">:</td>
                <td className="py-0.5 border-none font-bold uppercase">{namaMadinUpper}</td>
              </tr>
              <tr>
                <td className="py-0.5 border-none font-bold">ALAMAT</td>
                <td className="text-center py-0.5 border-none font-bold">:</td>
                <td className="py-0.5 border-none font-bold uppercase">{desaUpper}</td>
              </tr>
              <tr>
                <td className="py-0.5 border-none font-bold">KECAMATAN</td>
                <td className="text-center py-0.5 border-none font-bold">:</td>
                <td className="py-0.5 border-none font-bold uppercase">{kecamatanUpper}</td>
              </tr>
              <tr>
                <td className="py-0.5 border-none font-bold">KABUPATEN</td>
                <td className="text-center py-0.5 border-none font-bold">:</td>
                <td className="py-0.5 border-none font-bold uppercase">{kabupatenUpper}</td>
              </tr>
              <tr>
                <td className="py-0.5 border-none font-bold">BULAN</td>
                <td className="text-center py-0.5 border-none font-bold">:</td>
                <td className="py-0.5 border-none font-bold uppercase">JANUARI S/D DESEMBER</td>
              </tr>
            </tbody>
          </table>
        </div>

        {bkpData.rows.length === 0 ? (
          <div className="p-12 text-center space-y-3 print:hidden">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Transaksi Tercatat untuk Buku Kas Pembantu</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan input Penerimaan Dana Hibah dan buat Kwitansi Belanja. Data akan otomatis masuk ke Buku Kas Pembantu ini.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={onNavigateToPenerimaan}
                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                Input Penerimaan Dana
              </button>
              <button
                onClick={onNavigateToKwitansi}
                className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                Buat Kwitansi Belanja
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs border border-black text-black">
              <thead>
                <tr className="bg-[#d1d5db] text-black font-bold text-center border-b border-black">
                  <th className="border border-black p-2 w-28 text-center text-black">TANGGAL</th>
                  <th className="border border-black p-2 text-center text-black">URAIAN</th>
                  <th className="border border-black p-2 w-32 text-center text-black">PENERIMAAN</th>
                  <th className="border border-black p-2 w-32 text-center text-black">PENGELUARAN</th>
                  <th className="border border-black p-2 w-32 text-center text-black">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {bkpData.rows.map((row, idx) => (
                  <tr 
                    key={row.id || idx}
                    className="border-b border-black text-black"
                  >
                    <td className="border border-black p-2 text-center text-black whitespace-nowrap">
                      {formatTanggalIndo(row.tanggal)}
                    </td>
                    <td 
                      className="border border-black p-2 text-black text-left text-xs leading-relaxed"
                      style={{ wordSpacing: "0.08em" }}
                    >
                      {formatUraian(row.uraian)}
                    </td>
                    <td className="border border-black p-2 text-black">
                      {row.penerimaan > 0 ? (
                        <div className="flex justify-between items-center w-full">
                          <span>Rp</span>
                          <span>{row.penerimaan.toLocaleString("id-ID")}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="border border-black p-2 text-black">
                      {row.pengeluaran > 0 ? (
                        <div className="flex justify-between items-center w-full">
                          <span>Rp</span>
                          <span>{row.pengeluaran.toLocaleString("id-ID")}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="border border-black p-2 text-black">
                      <div className="flex justify-between items-center w-full">
                        <span>Rp</span>
                        <span>{row.saldo === 0 ? "-" : row.saldo.toLocaleString("id-ID")}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#d1d5db] font-bold border-t border-black text-black">
                  <td colSpan={2} className="border border-black p-2 text-center text-black font-bold">
                    Jumlah
                  </td>
                  <td className="border border-black p-2 text-black font-bold">
                    <div className="flex justify-between items-center w-full font-bold">
                      <span>Rp</span>
                      <span>{bkpData.totalPenerimaan.toLocaleString("id-ID")}</span>
                    </div>
                  </td>
                  <td className="border border-black p-2 text-black font-bold">
                    <div className="flex justify-between items-center w-full font-bold">
                      <span>Rp</span>
                      <span>{bkpData.totalPengeluaran.toLocaleString("id-ID")}</span>
                    </div>
                  </td>
                  <td className="border border-black p-2 text-black font-bold">
                    <div className="flex justify-between items-center w-full font-bold">
                      <span>Rp</span>
                      <span>{bkpData.saldoAkhir === 0 ? "-" : bkpData.saldoAkhir.toLocaleString("id-ID")}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tanda Tangan Blok Sesuai Gambar */}
        <div className="mt-8 pt-4 flex justify-between items-start text-xs font-sans text-black">
          
          {/* Mengetahui Kepala MD */}
          <div className="text-center w-64 flex flex-col justify-between h-28">
            <div>
              <p className="text-black">Mengetahui,</p>
              <p className="text-black">Kepala MD&nbsp;{namaMadinTitle}</p>
            </div>
            <div>
              <p className="font-bold text-black uppercase">{profil.namaKepala}</p>
            </div>
          </div>

          {/* Titimangsa & Bendahara */}
          <div className="text-center w-64 flex flex-col justify-between h-28">
            <div>
              <p className="text-black">{titimangsa}</p>
              <p className="text-black">Bendahara</p>
            </div>
            <div>
              <p className="font-bold text-black uppercase">{profil.namaBendahara}</p>
            </div>
          </div>

        </div>

        {/* Footer printed by Santri */}
        <div className="mt-8 pt-4 text-[11px] text-slate-500 font-sans text-left print:fixed print:bottom-[8mm] print:left-[20mm] print:m-0 print:p-0 print:text-slate-600">
          printed by Santri
        </div>

        </div>

      </div>

    </div>
  );
}
