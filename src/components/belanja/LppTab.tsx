/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Printer, 
  FileText, 
  CheckCircle, 
  RotateCcw, 
  Info,
  Calendar,
  Building,
  Save
} from "lucide-react";
import { ProfilLembaga, RABData, RABKomponen } from "../../types";
import { cleanKabupatenName } from "../../services/db";

interface LppTabProps {
  profil: ProfilLembaga;
  rab: RABData | null;
  tahun: string;
  onNavigateToRab?: () => void;
}

interface LppCustomItem {
  hasil: string;
  permasalahan: string;
  upaya: string;
}

// Format nama komponen agar ringkas dan elegan sesuai contoh format resmi BPPDGS
export const formatLppKomponenNama = (rawNama: string): string => {
  const lower = rawNama.toLowerCase();
  if (lower.includes("honorarium") || lower.includes("honor") || lower.includes("ustadz")) return "Honorarium";
  if (lower.includes("buku")) return "Pembelian , Pengadaan Buku Pelajaran";
  if (lower.includes("ppdb") || lower.includes("santri baru") || lower.includes("penerimaan")) return "Penerimaan Santri Baru";
  if (lower.includes("pbm") || lower.includes("proses belajar") || lower.includes("pembelajaran &")) return "Proses Belajar Mengajar";
  if (lower.includes("penggandaan") || lower.includes("bahan pembelajaran")) return "Pengadaan Bahan Pembelajaran";
  if (lower.includes("habis pakai")) return "Pembelian Bahan Habis Pakai";
  if (lower.includes("mutu")) return "Kegiatan Peningkatan Mutu";
  if (lower.includes("operasional") || lower.includes("bosda") || lower.includes("manajemen")) return "Kegiatan Operasional BOSDA";
  return rawNama;
};

// Ekstraksi nama Madin bersih (misal: "MADRASAH DINIYAH BAITURROHMAN" -> "BAITURROHMAN")
export const getCleanMadinName = (rawName?: string): string => {
  if (!rawName) return "BAITURROHMAN";
  const cleaned = rawName
    .replace(/^(madrasah diniyah|madin|md\.?)\s+/i, "")
    .replace(/^["'“'”’‘]+|["'“'”’‘]+$/g, "")
    .trim();
  return cleaned.toUpperCase() || "BAITURROHMAN";
};

// Ekstraksi Desa / Wilayah singkat
export const getDesaOrAlamatSingkat = (profil: ProfilLembaga): string => {
  if (profil.desa && profil.desa.trim() && !/^(desa|kelurahan)$/i.test(profil.desa.trim())) {
    return profil.desa.replace(/^(desa|kelurahan|ds\.|kel\.)\s+/i, "").trim().toUpperCase();
  }
  const raw = (profil.alamat || "").trim();
  const match = raw.match(/(?:desa|ds\.|kelurahan|kel\.)\s+([a-zA-Z\d\s]+?)(?:,|\s+kec\.|\s+kecamatan|\s+kab\.|\s+rt\s|\s+rw\s|$)/i);
  if (match && match[1]) {
    return match[1].trim().toUpperCase();
  }
  if (/poncol/i.test(raw)) return "PONCOL";
  if (/wonosari/i.test(raw)) return "WONOSARI";
  return (profil.kecamatan || "PONCOL").toUpperCase();
};

export default function LppTab({
  profil,
  rab,
  tahun,
  onNavigateToRab
}: LppTabProps) {
  // Key penyimpanan catatan tambahan per lembaga dan tahun
  const storageKey = `lpp_custom_${profil.id || "default"}_${tahun}`;

  // State untuk periode bulan (default: "JANUARI S/D DESEMBER")
  const [bulanPeriod, setBulanPeriod] = useState<string>("JANUARI S/D DESEMBER");
  
  // State untuk custom notes per item RAB (opsional jika lembaga punya kendala tertentu)
  const [customData, setCustomData] = useState<Record<string, LppCustomItem>>({});
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load custom data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bulanPeriod) setBulanPeriod(parsed.bulanPeriod);
        if (parsed.customData) setCustomData(parsed.customData);
      } else {
        setBulanPeriod("JANUARI S/D DESEMBER");
        setCustomData({});
      }
    } catch {
      // Ignore parse error
    }
  }, [storageKey]);

  // Simpan perubahan catatan LPP
  const handleSaveCustom = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        bulanPeriod,
        customData
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsEditingNotes(false);
    } catch (e) {
      console.error("Gagal menyimpan data LPP", e);
    }
  };

  // Reset catatan ke default standar
  const handleReset = () => {
    if (confirm("Reset semua catatan LPP ke format standar (Semua 'Tercapai' dan kolom masalah kosong)?")) {
      localStorage.removeItem(storageKey);
      setBulanPeriod("JANUARI S/D DESEMBER");
      setCustomData({});
      setIsEditingNotes(false);
    }
  };

  // Nilai identitas madrasah untuk LPP
  const namaMadin = getCleanMadinName(profil.namaLembaga);
  const alamatMadin = getDesaOrAlamatSingkat(profil);
  const kecamatanMadin = (profil.kecamatan || "PONCOL").replace(/^(kec\.?|kecamatan)\s+/i, "").trim().toUpperCase();
  const kabupatenMadin = cleanKabupatenName(profil.kabupaten || "MAGETAN").toUpperCase();

  // Titimangsa tanda tangan
  const getSignatureDate = () => {
    if (profil.kotaTanggal && profil.kotaTanggal.trim()) {
      return profil.kotaTanggal.trim();
    }
    const desaCapitalized = alamatMadin.charAt(0) + alamatMadin.slice(1).toLowerCase();
    return `${desaCapitalized}, 31 Desember ${tahun}`;
  };

  const signatureDate = getSignatureDate();
  const namaKepala = (profil.namaKepala || "SARNI BASORI").toUpperCase();

  // Cetak Dokumen LPP menggunakan window.print atau popup isolasi
  const handlePrint = () => {
    const printContent = generatePrintHtml();
    
    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch {
      // Fallback popup blocker
    }

    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      return;
    }

    // Fallback via invisible iframe jika popup diblokir browser
    const frameId = "print-lpp-frame";
    let frame = document.getElementById(frameId) as HTMLIFrameElement;
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = frameId;
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "none";
      document.body.appendChild(frame);
    }

    const frameDoc = frame.contentWindow?.document || frame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printContent);
      frameDoc.close();
    }
  };

  // Generate HTML Cetak LPP Standalone A4 Portrait
  const generatePrintHtml = () => {
    let rowsHtml = "";

    if (rab && rab.komponenList && rab.komponenList.length > 0) {
      rab.komponenList.forEach((komponen, compIdx) => {
        const compNo = compIdx + 1;
        const compNama = formatLppKomponenNama(komponen.nama);
        const items = komponen.items && komponen.items.length > 0 ? komponen.items : [{ id: `empty-${compIdx}`, uraian: "-", jumlah: 0, satuan: "", volume: 0, satuanVolume: "", satuanHarga: 0, total: 0 }];

        items.forEach((item, itemIdx) => {
          const itemKey = `${komponen.nama}_${item.id || item.uraian}`;
          const custom = customData[itemKey] || {
            hasil: "Tercapai",
            permasalahan: "",
            upaya: ""
          };

          const isFirstItem = itemIdx === 0;
          const noCellText = isFirstItem ? `${compNo}` : "";
          const compCellText = isFirstItem ? compNama : "";

          rowsHtml += `
            <tr>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: ${isFirstItem ? "bold" : "normal"}; vertical-align: top;">
                ${noCellText}
              </td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: ${isFirstItem ? "500" : "normal"}; vertical-align: top;">
                ${compCellText}
              </td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: top;">
                ${item.uraian}
              </td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: top;">
                ${custom.hasil || "Tercapai"}
              </td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: top;">
                ${custom.permasalahan || ""}
              </td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; vertical-align: top;">
                ${custom.upaya || ""}
              </td>
            </tr>
          `;
        });
      });
    }

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
    .meta-label {
      width: 130px;
    }
    .meta-colon {
      width: 14px;
      text-align: center;
    }
    .meta-value {
      text-transform: uppercase;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 8.5pt;
    }
    table.data-table th {
      border: 1px solid #000;
      background-color: #f8fafc;
      padding: 5px 4px;
      text-align: center;
      font-weight: bold;
      font-size: 8.5pt;
    }
    table.data-table td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
      text-align: left;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
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
    .signature-date {
      margin-bottom: 3px;
    }
    .signature-role {
      font-weight: normal;
      margin-bottom: 2px;
    }
    .signature-madin {
      font-weight: normal;
      margin-bottom: 50px;
    }
    .signature-name {
      font-weight: bold;
      text-decoration: none;
      text-transform: uppercase;
    }
    .signature-nip {
      font-size: 8pt;
      margin-top: 2px;
    }
    .footer-printed-by {
      font-size: 8pt;
      font-family: Arial, Helvetica, sans-serif !important;
      color: #000000;
      text-align: left;
      margin-top: 12px;
      padding-top: 4px;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content-area">
      <div class="header-lpp">
        <h1>LAPORAN PROGRAM PELAKSANAAN</h1>
        <h2>PROGRAM BANTUAN PENYELENGGARAAN PENDIDIKAN DINIYAH DAN GURU SWASTA (BPPDGS)</h2>
        <h3>TAHUN ${tahun}</h3>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">NAMA MADIN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${namaMadin}</td>
        </tr>
        <tr>
          <td class="meta-label">ALAMAT</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${alamatMadin}</td>
        </tr>
        <tr>
          <td class="meta-label">KECAMATAN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${kecamatanMadin}</td>
        </tr>
        <tr>
          <td class="meta-label">KABUPATEN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${kabupatenMadin}</td>
        </tr>
        <tr>
          <td class="meta-label">BULAN</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${bulanPeriod}</td>
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
          <div class="signature-date">${signatureDate}</div>
          <div class="signature-role">Mengetahui,</div>
          <div class="signature-madin">Kepala MD ${namaMadin}</div>
          <div class="signature-name">${namaKepala}</div>
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

  if (!rab) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">RAB Tahun {tahun} Belum Tersedia</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Dokumen Laporan Program Pelaksanaan (LPP) disusun secara otomatis berdasarkan Rincian Anggaran Biaya (RAB) yang telah disahkan.
          </p>
        </div>
        {onNavigateToRab && (
          <button
            type="button"
            onClick={onNavigateToRab}
            className="inline-flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Susun RAB Tahun {tahun}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" id="lpp-tab-container">
      {/* Action Bar & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-brand-green rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-sm md:text-base font-bold text-slate-800">
              Dokumen Laporan Program Pelaksanaan (LPP)
            </h2>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              TA {tahun}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Format resmi ringkasan realisasi kegiatan BPPDGS yang disinkronkan langsung dari data RAB.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition cursor-pointer ${
              isEditingNotes
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEditingNotes ? "Tutup Edit Catatan" : "Sesuaikan Catatan / Masalah"}</span>
          </button>

          {isEditingNotes && (
            <>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Catatan</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs px-2 py-2 rounded-xl cursor-pointer"
                title="Reset ke default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
            id="btn-print-lpp"
          >
            <Printer className="w-4 h-4 text-brand-gold" />
            <span>Cetak Dokumen LPP (A4)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Catatan Laporan Program Pelaksanaan (LPP) berhasil disimpan.</span>
        </div>
      )}

      {/* Editor Panel Periode & Custom Notes (jika dibuka) */}
      {isEditingNotes && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Pengaturan Tambahan Lembar LPP</span>
            </h4>
            <span className="text-[11px] text-amber-700">Perubahan akan langsung tercetak di dokumen LPP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Teks Periode Bulan Dokumen
              </label>
              <input
                type="text"
                value={bulanPeriod}
                onChange={(e) => setBulanPeriod(e.target.value)}
                placeholder="Contoh: JANUARI S/D DESEMBER"
                className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-semibold uppercase outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Anda juga dapat mengisi kolom <strong>Permasalahan yang dihadapi</strong> atau <strong>Upaya Pemecahan Masalah</strong> langsung pada baris tabel di bawah.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Paper - Format Identik Gambar Template Pengguna */}
      <div className="bg-slate-100 p-4 md:p-8 rounded-2xl border border-slate-200 overflow-x-auto flex justify-center">
        <div 
          className="bg-white shadow-md border border-slate-300 p-6 md:p-10 w-full max-w-[850px] min-w-[700px] text-black"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {/* 1. Judul Laporan */}
          <div className="text-center mb-6 space-y-0.5">
            <h1 className="text-sm md:text-base font-bold tracking-tight uppercase">
              LAPORAN PROGRAM PELAKSANAAN
            </h1>
            <h2 className="text-xs md:text-sm font-bold uppercase">
              PROGRAM BANTUAN PENYELENGGARAAN PENDIDIKAN DINIYAH DAN GURU SWASTA (BPPDGS)
            </h2>
            <h3 className="text-xs md:text-sm font-bold uppercase">
              TAHUN {tahun}
            </h3>
          </div>

          {/* 2. Metadata Lembaga */}
          <div className="mb-5 text-[11px] md:text-xs font-bold leading-relaxed space-y-0.5">
            <div className="flex">
              <span className="w-36">NAMA MADIN</span>
              <span className="w-4 text-center">:</span>
              <span className="uppercase">{namaMadin}</span>
            </div>
            <div className="flex">
              <span className="w-36">ALAMAT</span>
              <span className="w-4 text-center">:</span>
              <span className="uppercase">{alamatMadin}</span>
            </div>
            <div className="flex">
              <span className="w-36">KECAMATAN</span>
              <span className="w-4 text-center">:</span>
              <span className="uppercase">{kecamatanMadin}</span>
            </div>
            <div className="flex">
              <span className="w-36">KABUPATEN</span>
              <span className="w-4 text-center">:</span>
              <span className="uppercase">{kabupatenMadin}</span>
            </div>
            <div className="flex">
              <span className="w-36">BULAN</span>
              <span className="w-4 text-center">:</span>
              <span className="uppercase">{bulanPeriod}</span>
            </div>
          </div>

          {/* 3. Tabel Data LPP */}
          <table className="w-full border-collapse border border-black text-[10.5px] md:text-xs text-black">
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
              {rab.komponenList && rab.komponenList.map((komponen, compIdx) => {
                const compNo = compIdx + 1;
                const compNama = formatLppKomponenNama(komponen.nama);
                const items = komponen.items && komponen.items.length > 0 ? komponen.items : [{ id: `empty-${compIdx}`, uraian: "-", jumlah: 0, satuan: "", volume: 0, satuanVolume: "", satuanHarga: 0, total: 0 }];

                return items.map((item, itemIdx) => {
                  const itemKey = `${komponen.nama}_${item.id || item.uraian}`;
                  const custom = customData[itemKey] || {
                    hasil: "Tercapai",
                    permasalahan: "",
                    upaya: ""
                  };

                  const isFirstItem = itemIdx === 0;

                  return (
                    <tr key={`${compIdx}-${item.id || itemIdx}`}>
                      <td className={`border border-black px-2 py-1 align-top text-left ${isFirstItem ? "font-bold" : ""}`}>
                        {isFirstItem ? compNo : ""}
                      </td>
                      <td className={`border border-black px-2 py-1 align-top text-left ${isFirstItem ? "font-medium" : ""}`}>
                        {isFirstItem ? compNama : ""}
                      </td>
                      <td className="border border-black px-2 py-1 align-top text-left">
                        {item.uraian}
                      </td>
                      <td className="border border-black px-2 py-1 align-top text-left">
                        {isEditingNotes ? (
                          <input
                            type="text"
                            value={custom.hasil || "Tercapai"}
                            onChange={(e) => {
                              setCustomData({
                                ...customData,
                                [itemKey]: {
                                  ...custom,
                                  hasil: e.target.value
                                }
                              });
                            }}
                            className="w-full text-left text-xs p-0.5 border border-amber-300 rounded bg-amber-50/50"
                          />
                        ) : (
                          custom.hasil || "Tercapai"
                        )}
                      </td>
                      <td className="border border-black px-2 py-1 align-top text-left">
                        {isEditingNotes ? (
                          <input
                            type="text"
                            value={custom.permasalahan || ""}
                            onChange={(e) => {
                              setCustomData({
                                ...customData,
                                [itemKey]: {
                                  ...custom,
                                  permasalahan: e.target.value
                                }
                              });
                            }}
                            placeholder="Isi jika ada..."
                            className="w-full text-left text-xs p-0.5 border border-amber-300 rounded bg-amber-50/50"
                          />
                        ) : (
                          custom.permasalahan || ""
                        )}
                      </td>
                      <td className="border border-black px-2 py-1 align-top text-left">
                        {isEditingNotes ? (
                          <input
                            type="text"
                            value={custom.upaya || ""}
                            onChange={(e) => {
                              setCustomData({
                                ...customData,
                                [itemKey]: {
                                  ...custom,
                                  upaya: e.target.value
                                }
                              });
                            }}
                            placeholder="Isi jika ada..."
                            className="w-full text-left text-xs p-0.5 border border-amber-300 rounded bg-amber-50/50"
                          />
                        ) : (
                          custom.upaya || ""
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          {/* 4. Tanda Tangan */}
          <div className="mt-8 flex justify-end text-[11px] md:text-xs">
            <div className="w-64 text-center space-y-0.5">
              <div>{signatureDate}</div>
              <div>Mengetahui,</div>
              <div className="mb-14">Kepala MD {namaMadin}</div>
              <div className="font-bold uppercase underline-offset-2">{namaKepala}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
