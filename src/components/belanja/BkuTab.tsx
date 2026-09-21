/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import { 
  Printer, 
  Calendar, 
  Building2, 
  FileText, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertCircle
} from "lucide-react";
import { BkuBulanData, ProfilLembaga } from "../../types";
import { calculateBkuMonth, formatAlamatKop, getTanggalPenutupanBuku } from "../../services/db";

interface BkuTabProps {
  profil: ProfilLembaga;
  tahun: string;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function BkuTab({ profil, tahun }: BkuTabProps) {
  const [selectedBulan, setSelectedBulan] = useState<number>(1);
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate BKU for current selected month
  const bkuData: BkuBulanData = useMemo(() => {
    return calculateBkuMonth(profil.id || "madin-baiturrohman", tahun, selectedBulan);
  }, [profil.id, tahun, selectedBulan]);

  const formatTanggalIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const cleanMadinUpper = (name?: string) => {
    if (!name) return "BAITURROHMAN";
    return name.replace(/^(madrasah diniyah|madin|md\.?)\s+/i, "").trim().toUpperCase();
  };

  const cleanMadinTitle = (name?: string) => {
    if (!name) return "Baiturrohman";
    return name.replace(/^(madrasah diniyah|madin|md\.?)\s+/i, "").trim();
  };

  const getNamaDesaUpper = (prof: ProfilLembaga) => {
    // 1. Cek field prof.desa jika diisi di Pengaturan Lembaga
    if (prof.desa && prof.desa.trim() && !/^(desa|kelurahan)$/i.test(prof.desa.trim())) {
      return prof.desa
        .replace(/^(desa|kelurahan|ds\.|kel\.)\s+/i, "")
        .trim()
        .toUpperCase();
    }

    const raw = (prof.alamat || "").trim();
    if (!raw) return (prof.kecamatan || "PONCOL").toUpperCase();

    // 2. Cari pola eksplisit 'Desa ...' / 'Kelurahan ...' / 'Ds. ...'
    const matchExplicit = raw.match(/(?:desa|ds\.|kelurahan|kel\.)\s+([a-zA-Z\d\s]+?)(?:,|\s+kec\.|\s+kecamatan|\s+kab\.|\s+kabupaten|\s+rt\s|\s+rw\s|$)/i);
    if (matchExplicit && matchExplicit[1] && matchExplicit[1].trim()) {
      return matchExplicit[1].trim().toUpperCase();
    }

    // 3. Jika alamat dipisah koma (contoh: "Jl. Basuki Rahmat, Wonosari, Poncol")
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

    // 4. Deteksi kata nama desa jika tertulis di alamat
    if (/wonosari/i.test(raw)) return "WONOSARI";
    if (/poncol/i.test(raw)) return "PONCOL";
    if (/sukomaju/i.test(raw)) return "SUKOMAJU";
    if (/bogem/i.test(raw)) return "BOGEM";

    // 5. Filter nama jalan, nomor, dan RT/RW untuk mencari kata nama desa yang tersisa
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

  const generatePrintableHtml = () => {
    const namaBulanAktif = NAMA_BULAN[selectedBulan - 1].toUpperCase();
    const namaMadinUpper = cleanMadinUpper(profil.namaLembaga);
    const namaMadinTitle = cleanMadinTitle(profil.namaLembaga);
    const desaUpper = getNamaDesaUpper(profil);
    const kecamatanUpper = (profil.kecamatan || "").replace(/^(kec\.?|kecamatan)\s+/i, "").split(",")[0].trim().toUpperCase() || "PONCOL";
    const kabupatenUpper = (profil.kabupaten || "").replace(/^(kab\.?|kabupaten|kota)\s+/i, "").split(",")[0].trim().toUpperCase() || "MAGETAN";

    // Format Titimangsa penutupan buku (e.g. "Poncol, 31 Oktober 2025")
    const tanggalTtd = getTanggalPenutupanBuku(profil.kecamatan || profil.kabupaten, tahun, selectedBulan);

    // Siapkan data penerimaan (Kiri)
    const penerimaanList: Array<{
      tanggal: string;
      uraian: string;
      noBukti: string;
      jumlah: number;
    }> = [];

    // Saldo Bulan Lalu
    if (bkuData.saldoBulanLalu > 0 || (selectedBulan > 1 && bkuData.penerimaanList.length === 0)) {
      penerimaanList.push({
        tanggal: `01/${String(selectedBulan).padStart(2, "0")}/${tahun}`,
        uraian: "Saldo Bulan Lalu",
        noBukti: "",
        jumlah: bkuData.saldoBulanLalu
      });
    }

    // Penerimaan bulan berjalan
    bkuData.penerimaanList.forEach(item => {
      penerimaanList.push({
        tanggal: formatTanggalIndo(item.tanggal),
        uraian: item.uraian,
        noBukti: item.noBukti || "",
        jumlah: item.jumlah
      });
    });

    // Siapkan data pengeluaran (Kanan)
    const pengeluaranList: Array<{
      tanggal: string;
      uraian: string;
      noBukti: string;
      jumlah: number;
    }> = bkuData.pengeluaranList.map(item => ({
      tanggal: formatTanggalIndo(item.tanggal),
      uraian: item.uraian,
      noBukti: item.noBukti || "",
      jumlah: item.jumlah
    }));

    // Tiadakan baris kosong: hanya tampilkan baris yang memiliki transaksi
    const totalRows = Math.max(penerimaanList.length, pengeluaranList.length);

    let rowsHtml = "";
    if (totalRows === 0) {
      rowsHtml = `
        <tr>
          <td colspan="8" style="border: 1px solid #000000; padding: 6px; text-align: center; font-style: italic; vertical-align: top;">
            Tidak ada transaksi pada bulan ini (Nihil)
          </td>
        </tr>
      `;
    } else {
      for (let i = 0; i < totalRows; i++) {
        const pen = penerimaanList[i];
        const peng = pengeluaranList[i];

        const penTgl = pen ? pen.tanggal : "&nbsp;";
        const penUraian = pen ? formatUraian(pen.uraian) : "&nbsp;";
        const penBukti = pen ? pen.noBukti : "&nbsp;";
        const penJml = pen ? `Rp ${pen.jumlah.toLocaleString("id-ID")}` : "&nbsp;";

        const pengTgl = peng ? peng.tanggal : "&nbsp;";
        const pengUraian = peng ? formatUraian(peng.uraian) : "&nbsp;";
        const pengBukti = peng ? peng.noBukti : "&nbsp;";
        const pengJml = peng ? `Rp ${peng.jumlah.toLocaleString("id-ID")}` : "&nbsp;";

        rowsHtml += `
          <tr>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: left; white-space: nowrap;">${penTgl}</td>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: left; line-height: 1.25;">${penUraian}</td>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: left; font-family: Arial, sans-serif;">${penBukti}</td>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: right; white-space: nowrap;">${penJml}</td>

            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: left; white-space: nowrap;">${pengTgl}</td>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: left; line-height: 1.25;">${pengUraian}</td>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: left; font-family: Arial, sans-serif;">${pengBukti}</td>
            <td style="border: 1px solid #000000; padding: 3px 5px; vertical-align: top; text-align: right; white-space: nowrap;">${pengJml}</td>
          </tr>
        `;
      }
    }

    const saldoAkhirFormatted = bkuData.saldoAkhirBulan === 0
      ? "-"
      : `Rp ${bkuData.saldoAkhirBulan.toLocaleString("id-ID")}`;

    const totalPenutupanPengeluaran = bkuData.totalPengeluaran + bkuData.saldoAkhirBulan;
    const penutupanRightFormatted = totalPenutupanPengeluaran === 0
      ? "-"
      : `Rp ${totalPenutupanPengeluaran.toLocaleString("id-ID")}`;

    const printBarHtml = `
  <div class="no-print no-print-bar">
    <span>Buku Kas Umum (BKU) — Bulan <strong>${namaBulanAktif} ${tahun}</strong></span>
    <div>
      <button class="btn-action-print" onclick="window.print()">Cetak Dokumen</button>
      <button class="btn-action-close" onclick="window.close()">Tutup</button>
    </div>
  </div>`;

    const autoPrintScript = `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>`;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Kas Umum - Bulan ${namaBulanAktif} ${tahun}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 297mm;
      height: 210mm;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media screen {
      body {
        background-color: #f1f5f9;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0;
        height: auto;
      }
      .print-page-wrapper {
        background: #ffffff;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }
    }

    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #fff;
      padding: 10px 20px;
      margin-bottom: 16px;
      border-radius: 8px;
      font-size: 13px;
      width: 297mm;
      max-width: 100%;
    }

    .btn-action-print {
      background: #059669;
      color: #fff;
      border: none;
      padding: 7px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12.5px;
      cursor: pointer;
    }

    .btn-action-close {
      background: #475569;
      color: #fff;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12.5px;
      margin-left: 8px;
      cursor: pointer;
    }

    .print-page-wrapper {
      width: 297mm;
      height: 210mm;
      max-width: 297mm;
      max-height: 210mm;
      padding: 10mm 15mm 8mm 15mm;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-inside: avoid;
      page-break-after: avoid;
      background: #fff;
      box-sizing: border-box;
    }

    .header-bku {
      text-align: center;
      margin-bottom: 12px;
    }

    .header-bku h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .header-bku h2 {
      margin: 2px 0 0 0;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .meta-table {
      margin-bottom: 10px;
      font-size: 11px;
      font-weight: bold;
    }

    .meta-table table {
      border-collapse: collapse;
      border: none;
    }

    .meta-table td {
      border: none;
      padding: 1.5px 0;
      font-weight: bold;
    }

    .bku-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      font-family: Arial, Helvetica, sans-serif;
      border: 1px solid #000000;
    }

    .bku-table th, .bku-table td {
      border: 1px solid #000000;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
    }

    .bku-table th {
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      padding: 4px 5px;
      background: #f8fafc;
      line-height: 1.2;
    }

    .bku-table tbody td {
      vertical-align: top;
      padding: 3px 5px;
      line-height: 1.25;
    }

    .bku-table tfoot td {
      vertical-align: top;
      padding: 3px 5px;
      line-height: 1.25;
      font-weight: bold;
      border: 1px solid #000000;
    }

    .sig-section {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 0 40px;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.25;
    }

    .sig-box {
      width: 280px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 85px;
      font-family: Arial, Helvetica, sans-serif;
    }

    .sig-box p {
      margin: 0;
      line-height: 1.25;
      font-family: Arial, Helvetica, sans-serif;
    }

    .sig-name {
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
    }

    .footer-printed-by {
      position: absolute;
      bottom: 5mm;
      left: 15mm;
      font-size: 9.5px;
      color: #64748b;
      margin: 0;
      padding: 0;
      font-style: normal;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        width: 297mm !important;
        height: 210mm !important;
        overflow: hidden !important;
      }
      .print-page-wrapper {
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  ${printBarHtml}

  <div class="print-page-wrapper">
    <div>
      <!-- Kop Dokumen BKU persis format gambar -->
      <div class="header-bku">
        <h1>BUKU KAS UMUM</h1>
        <h2>BULAN ${namaBulanAktif} ${tahun}</h2>
      </div>

      <!-- Informasi Metadata Lembaga -->
      <div class="meta-table">
        <table>
          <tbody>
            <tr>
              <td style="width: 115px;">NAMA MADIN</td>
              <td style="width: 15px; text-align: center;">:</td>
              <td>${namaMadinUpper}</td>
            </tr>
            <tr>
              <td>ALAMAT</td>
              <td style="text-align: center;">:</td>
              <td>${desaUpper}</td>
            </tr>
            <tr>
              <td>KECAMATAN</td>
              <td style="text-align: center;">:</td>
              <td>${kecamatanUpper}</td>
            </tr>
            <tr>
              <td>KABUPATEN</td>
              <td style="text-align: center;">:</td>
              <td>${kabupatenUpper}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabel BKU Model Skontro (Penerimaan & Pengeluaran) -->
      <table class="bku-table">
        <thead>
          <tr>
            <th colspan="4" style="text-transform: uppercase; letter-spacing: 0.5px;">PENERIMAAN</th>
            <th colspan="4" style="text-transform: uppercase; letter-spacing: 0.5px;">PENGELUARAN</th>
          </tr>
          <tr>
            <th style="width: 80px;">Tanggal</th>
            <th>Uraian</th>
            <th style="width: 85px;">No. Bukti</th>
            <th style="width: 105px;">Jumlah</th>

            <th style="width: 80px;">Tanggal</th>
            <th>Uraian</th>
            <th style="width: 85px;">No. Bukti</th>
            <th style="width: 105px;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <!-- Baris 1: Jumlah Penerimaan & Pengeluaran -->
          <tr style="font-weight: bold;">
            <td colspan="3" style="text-align: right; padding: 4px 6px; font-weight: bold; border: 1px solid #000000;">Jumlah Penerimaan</td>
            <td style="text-align: right; padding: 4px 6px; font-weight: bold; white-space: nowrap; border: 1px solid #000000;">Rp ${bkuData.totalPenerimaan.toLocaleString("id-ID")}</td>

            <td colspan="3" style="text-align: right; padding: 4px 6px; font-weight: bold; border: 1px solid #000000;">Jumlah Pengeluaran</td>
            <td style="text-align: right; padding: 4px 6px; font-weight: bold; white-space: nowrap; border: 1px solid #000000;">Rp ${bkuData.totalPengeluaran.toLocaleString("id-ID")}</td>
          </tr>

          <!-- Baris 2: Saldo Akhir Bulan -->
          <tr style="font-weight: bold;">
            <td colspan="3" style="border: 1px solid #000000;">&nbsp;</td>
            <td style="border: 1px solid #000000;">&nbsp;</td>

            <td colspan="3" style="text-align: right; padding: 4px 6px; font-weight: bold; border: 1px solid #000000;">Saldo Akhir Bulan</td>
            <td style="text-align: right; padding: 4px 6px; font-weight: bold; white-space: nowrap; border: 1px solid #000000;">${saldoAkhirFormatted}</td>
          </tr>

          <!-- Baris 3: Jumlah Penutupan -->
          <tr style="font-weight: bold;">
            <td colspan="3" style="text-align: right; padding: 4px 6px; font-weight: bold; border: 1px solid #000000;">Jumlah Penutupan</td>
            <td style="border: 1px solid #000000;">&nbsp;</td>

            <td colspan="3" style="text-align: right; padding: 4px 6px; font-weight: bold; border: 1px solid #000000;">Jumlah Penutupan</td>
            <td style="text-align: right; padding: 4px 6px; font-weight: bold; white-space: nowrap; border: 1px solid #000000;">${penutupanRightFormatted}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Tanda Tangan Resmi Sesuai Gambar Referensi -->
      <div class="sig-section">
        <!-- Kiri: Mengetahui Kepala MD -->
        <div class="sig-box">
          <div>
            <p>Mengetahui,</p>
            <p style="margin-top: 2px;">Kepala MD ${namaMadinTitle}</p>
          </div>
          <div>
            <p class="sig-name">${profil.namaKepala || "SARNI BASORI"}</p>
          </div>
        </div>

        <!-- Kanan: Titimangsa & Bendahara -->
        <div class="sig-box">
          <div>
            <p>${tanggalTtd}</p>
            <p style="margin-top: 2px;">Bendahara</p>
          </div>
          <div>
            <p class="sig-name">${profil.namaBendahara || "MAHMUDI"}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Dokumen printed by Santri di bagian paling bawah dokumen A4 -->
    <div class="footer-printed-by">
      printed by Santri
    </div>
  </div>

  ${autoPrintScript}
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = generatePrintableHtml();
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback: print via hidden iframe if popup blocker intervenes
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

  const formatUraian = (text: string) => {
    if (!text) return "";
    return text
      .replace(/,([^\s])/g, ", $1")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedBulan > 1) setSelectedBulan(selectedBulan - 1);
  };
  const handleNextMonth = () => {
    if (selectedBulan < 12) setSelectedBulan(selectedBulan + 1);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Toolbar with Month Switcher (Hidden on print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Buku Kas Umum — Bulanan
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Laporan pertanggungjawaban kas per bulan dengan saldo bulan lalu berkesinambungan otomatis.
          </p>
        </div>

        {/* Month Selector Dropdown & Nav */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              disabled={selectedBulan === 1}
              className="px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition cursor-pointer"
            >
              ◀
            </button>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {nama} ({tahun})
                </option>
              ))}
            </select>
            <button
              onClick={handleNextMonth}
              disabled={selectedBulan === 12}
              className="px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition cursor-pointer"
            >
              ▶
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 active:scale-95"
            title="Buka jendela cetak resmi A4 Landscape atau pilih opsi 'Simpan sebagai PDF' di browser"
          >
            <Printer className="w-4 h-4" />
            Cetak BKU {NAMA_BULAN[selectedBulan - 1]}
          </button>
        </div>

      </div>

      {/* Month Summary Cards (Hidden on print) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {selectedBulan === 1 ? "Pencairan Hibah (Awal)" : "Saldo Bulan Lalu"}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-700 mt-1">
            Rp {bkuData.saldoBulanLalu.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {selectedBulan === 1 ? "Saldo awal tahun anggaran" : `Saldo akhir dari bulan ${NAMA_BULAN[selectedBulan - 2]}`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Pengeluaran Bulan Ini
            </span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-700 mt-1">
            Rp {bkuData.totalPengeluaran.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {bkuData.pengeluaranList.length} Kwitansi transaksi di bulan {NAMA_BULAN[selectedBulan - 1]}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Saldo Akhir Bulan Ini
            </span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-black text-blue-700 mt-1">
            Rp {bkuData.saldoAkhirBulan.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Menjadi saldo awal bulan berikutnya
          </p>
        </div>

      </div>

      {/* BKU Printable / Screen Preview (Sesuai Format Gambar Referensi Resmi A4 Landscape) */}
      <div className="bg-slate-200/70 p-3 sm:p-6 md:p-8 rounded-2xl border border-slate-300/80 shadow-inner w-full overflow-x-auto flex justify-center">
        <div 
          ref={printRef}
          id="bku-official-document-sheet"
          className="print-page-wrapper bg-white text-black shadow-lg"
          style={{
            width: "297mm",
            minWidth: "297mm",
            maxWidth: "297mm",
            height: "210mm",
            minHeight: "210mm",
            maxHeight: "210mm",
            padding: "10mm 15mm 8mm 15mm",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            lineHeight: 1.35,
            color: "#000000",
            flexShrink: 0
          }}
        >
          <div>
            {/* Kop Dokumen BKU */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                BUKU KAS UMUM
              </h1>
              <h2 style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>
                BULAN {NAMA_BULAN[selectedBulan - 1].toUpperCase()} {tahun}
              </h2>
            </div>

            {/* Informasi Metadata Lembaga */}
            <div style={{ marginBottom: "10px", fontSize: "11px", fontWeight: "bold" }}>
              <table style={{ borderCollapse: "collapse", border: "none" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "105px", border: "none", padding: "1.5px 0", fontWeight: "bold" }}>NAMA MADIN</td>
                    <td style={{ width: "14px", textAlign: "center", border: "none", padding: "1.5px 0", fontWeight: "bold" }}>:</td>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold", textTransform: "uppercase" }}>{cleanMadinUpper(profil.namaLembaga)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold" }}>ALAMAT</td>
                    <td style={{ textAlign: "center", border: "none", padding: "1.5px 0", fontWeight: "bold" }}>:</td>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold", textTransform: "uppercase" }}>{getNamaDesaUpper(profil)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold" }}>KECAMATAN</td>
                    <td style={{ textAlign: "center", border: "none", padding: "1.5px 0", fontWeight: "bold" }}>:</td>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold", textTransform: "uppercase" }}>{(profil.kecamatan || "").replace(/^(kec\.?|kecamatan)\s+/i, "").split(",")[0].trim() || "PONCOL"}</td>
                  </tr>
                  <tr>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold" }}>KABUPATEN</td>
                    <td style={{ textAlign: "center", border: "none", padding: "1.5px 0", fontWeight: "bold" }}>:</td>
                    <td style={{ border: "none", padding: "1.5px 0", fontWeight: "bold", textTransform: "uppercase" }}>{(profil.kabupaten || "").replace(/^(kab\.?|kabupaten|kota)\s+/i, "").split(",")[0].trim() || "MAGETAN"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabel BKU Skontro (Penerimaan di Kiri, Pengeluaran di Kanan) */}
            {(() => {
              const penList: Array<{ tanggal: string; uraian: string; noBukti: string; jumlah: number }> = [];
              if (bkuData.saldoBulanLalu > 0 || (selectedBulan > 1 && bkuData.penerimaanList.length === 0)) {
                penList.push({
                  tanggal: `01/${String(selectedBulan).padStart(2, "0")}/${tahun}`,
                  uraian: "Saldo Bulan Lalu",
                  noBukti: "",
                  jumlah: bkuData.saldoBulanLalu
                });
              }
              bkuData.penerimaanList.forEach(item => {
                penList.push({
                  tanggal: formatTanggalIndo(item.tanggal),
                  uraian: item.uraian,
                  noBukti: item.noBukti || "",
                  jumlah: item.jumlah
                });
              });

              const pengList: Array<{ tanggal: string; uraian: string; noBukti: string; jumlah: number }> = bkuData.pengeluaranList.map(item => ({
                tanggal: formatTanggalIndo(item.tanggal),
                uraian: item.uraian,
                noBukti: item.noBukti || "",
                jumlah: item.jumlah
              }));

              const maxRows = Math.max(penList.length, pengList.length);
              const totalPenutupanPengeluaran = bkuData.totalPengeluaran + bkuData.saldoAkhirBulan;
              const saldoAkhirFormatted = bkuData.saldoAkhirBulan === 0 ? "-" : `Rp ${bkuData.saldoAkhirBulan.toLocaleString("id-ID")}`;
              const penutupanRightFormatted = totalPenutupanPengeluaran === 0 ? "-" : `Rp ${totalPenutupanPengeluaran.toLocaleString("id-ID")}`;

              return (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", fontFamily: "Arial, Helvetica, sans-serif", border: "1px solid #000000" }}>
                  <thead>
                    <tr>
                      <th colSpan={4} style={{ textAlign: "center", fontWeight: "bold", background: "#f8fafc", padding: "4px 5px", border: "1px solid #000000", lineHeight: 1.2 }}>PENERIMAAN</th>
                      <th colSpan={4} style={{ textAlign: "center", fontWeight: "bold", background: "#f8fafc", padding: "4px 5px", border: "1px solid #000000", lineHeight: 1.2 }}>PENGELUARAN</th>
                    </tr>
                    <tr>
                      <th style={{ width: "68px", fontWeight: "bold", textAlign: "center", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>Tanggal</th>
                      <th style={{ fontWeight: "bold", textAlign: "center", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>Uraian</th>
                      <th style={{ width: "85px", fontWeight: "bold", textAlign: "center", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>No. Bukti</th>
                      <th style={{ width: "110px", fontWeight: "bold", textAlign: "right", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>Jumlah</th>

                      <th style={{ width: "68px", fontWeight: "bold", textAlign: "center", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>Tanggal</th>
                      <th style={{ fontWeight: "bold", textAlign: "center", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>Uraian</th>
                      <th style={{ width: "85px", fontWeight: "bold", textAlign: "center", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>No. Bukti</th>
                      <th style={{ width: "110px", fontWeight: "bold", textAlign: "right", verticalAlign: "middle", padding: "4px 5px", background: "#f8fafc", border: "1px solid #000000", lineHeight: 1.2 }}>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maxRows === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ border: "1px solid #000000", padding: "6px", textAlign: "center", fontStyle: "italic", verticalAlign: "top" }}>
                          Tidak ada transaksi pada bulan ini (Nihil)
                        </td>
                      </tr>
                    ) : (
                      Array.from({ length: maxRows }).map((_, rIdx) => {
                        const pen = penList[rIdx];
                        const peng = pengList[rIdx];
                        return (
                          <tr key={`row-${rIdx}`}>
                            {/* Penerimaan */}
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "left", whiteSpace: "nowrap" }}>
                              {pen ? pen.tanggal : "\u00A0"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "left", lineHeight: 1.25 }}>
                              {pen ? formatUraian(pen.uraian) : "\u00A0"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                              {pen ? pen.noBukti : "\u00A0"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                              {pen ? `Rp ${pen.jumlah.toLocaleString("id-ID")}` : "\u00A0"}
                            </td>

                            {/* Pengeluaran */}
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "left", whiteSpace: "nowrap" }}>
                              {peng ? peng.tanggal : "\u00A0"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "left", lineHeight: 1.25 }}>
                              {peng ? formatUraian(peng.uraian) : "\u00A0"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                              {peng ? peng.noBukti : "\u00A0"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "3px 5px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                              {peng ? `Rp ${peng.jumlah.toLocaleString("id-ID")}` : "\u00A0"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    {/* Baris 1: Jumlah Penerimaan & Pengeluaran */}
                    <tr style={{ fontWeight: "bold" }}>
                      <td colSpan={3} style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", border: "1px solid #000000" }}>Jumlah Penerimaan</td>
                      <td style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", whiteSpace: "nowrap", border: "1px solid #000000" }}>Rp {bkuData.totalPenerimaan.toLocaleString("id-ID")}</td>

                      <td colSpan={3} style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", border: "1px solid #000000" }}>Jumlah Pengeluaran</td>
                      <td style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", whiteSpace: "nowrap", border: "1px solid #000000" }}>Rp {bkuData.totalPengeluaran.toLocaleString("id-ID")}</td>
                    </tr>

                    {/* Baris 2: Saldo Akhir Bulan */}
                    <tr style={{ fontWeight: "bold" }}>
                      <td colSpan={3} style={{ border: "1px solid #000000" }}>&nbsp;</td>
                      <td style={{ border: "1px solid #000000" }}>&nbsp;</td>

                      <td colSpan={3} style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", border: "1px solid #000000" }}>Saldo Akhir Bulan</td>
                      <td style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", whiteSpace: "nowrap", border: "1px solid #000000" }}>
                        {saldoAkhirFormatted}
                      </td>
                    </tr>

                    {/* Baris 3: Jumlah Penutupan */}
                    <tr style={{ fontWeight: "bold" }}>
                      <td colSpan={3} style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", border: "1px solid #000000" }}>Jumlah Penutupan</td>
                      <td style={{ border: "1px solid #000000" }}>&nbsp;</td>

                      <td colSpan={3} style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", border: "1px solid #000000" }}>Jumlah Penutupan</td>
                      <td style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", whiteSpace: "nowrap", border: "1px solid #000000" }}>
                        {penutupanRightFormatted}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              );
            })()}

            {/* Tanda Tangan Resmi Sesuai Gambar Referensi */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "0 40px", fontFamily: "Arial, Helvetica, sans-serif", lineHeight: 1.25 }}>
              {/* Kiri: Mengetahui Kepala MD */}
              <div style={{ width: "280px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "85px" }}>
                <div>
                  <p style={{ margin: 0, lineHeight: 1.25 }}>Mengetahui,</p>
                  <p style={{ margin: "2px 0 0 0", lineHeight: 1.25 }}>Kepala MD {cleanMadinTitle(profil.namaLembaga)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", textTransform: "uppercase", textDecoration: "underline" }}>{profil.namaKepala || "SARNI BASORI"}</p>
                </div>
              </div>

              {/* Kanan: Titimangsa & Bendahara */}
              <div style={{ width: "280px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "85px" }}>
                <div>
                  <p style={{ margin: 0, lineHeight: 1.25 }}>{getTanggalPenutupanBuku(profil.kecamatan || profil.kabupaten, tahun, selectedBulan)}</p>
                  <p style={{ margin: "2px 0 0 0", lineHeight: 1.25 }}>Bendahara</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", textTransform: "uppercase", textDecoration: "underline" }}>{profil.namaBendahara || "MAHMUDI"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Dokumen printed by Santri di bagian paling bawah halaman A4 */}
          <div style={{ position: "absolute", bottom: "5mm", left: "15mm", fontSize: "9.5px", color: "#64748b", margin: 0, padding: 0, fontStyle: "normal" }}>
            printed by Santri
          </div>
        </div>
      </div>

    </div>
  );
}
