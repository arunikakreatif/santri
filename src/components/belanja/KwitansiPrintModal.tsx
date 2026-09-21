/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Printer, Download, X, Loader2, CheckCircle2 } from "lucide-react";
import { Kwitansi, ProfilLembaga } from "../../types";
import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "../../utils/safeHtml2Canvas";

interface KwitansiPrintModalProps {
  kwitansi: Kwitansi;
  profil: ProfilLembaga;
  onClose: () => void;
}

export default function KwitansiPrintModal({ kwitansi, profil, onClose }: KwitansiPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [printSuccessNotice, setPrintSuccessNotice] = useState(false);

  // Format date to Indonesian, e.g. "20 November 2024"
  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Clean terbilang text from enclosing '#' marks if any
  const terbilangClean = (kwitansi.terbilang || "")
    .replace(/^#\s*|\s*#$/g, "")
    .trim();

  // Parse kepala & institution name components
  const getKepalaComponents = () => {
    let raw = (profil.namaLembaga || 'Madrasah Diniyah "BAITURROHMAN"').trim();
    if (raw.toLowerCase().startsWith("kepala ")) {
      raw = raw.substring(7).trim();
    }
    // Normalize uppercase MADRASAH DINIYAH to Title Case
    raw = raw.replace(/\bMADRASAH\s+DINIYAH\b/gi, "Madrasah Diniyah");
    raw = raw.replace(/\bMD\b/gi, "Madrasah Diniyah");

    const quoteMatch = raw.match(/^(.*?)(["“].*?["”])$/);
    if (quoteMatch) {
      return {
        prefix: `Kepala ${quoteMatch[1].trim() || "Madrasah Diniyah"}`,
        quoted: quoteMatch[2].trim()
      };
    }
    return {
      prefix: `Kepala ${raw}`,
      quoted: ""
    };
  };

  const { prefix: labelKepalaPrefix, quoted: labelKepalaQuoted } = getKepalaComponents();

  // Generate self-contained, clean HTML for instant standalone printing
  const generatePrintableHtml = () => {
    const tanggalTtd = formatTanggalIndo(kwitansi.tanggal);
    const nominalStr = Number(kwitansi.totalJumlah || 0).toLocaleString("id-ID");
    const telahTerima = kwitansi.telahTerimaDari || `BENDAHARA ${profil.namaLembaga || "MADIN"}`;
    const namaKepala = kwitansi.namaKepala || profil.namaKepala || "SARNI BASORI";
    const namaBendahara = kwitansi.namaBendahara || profil.namaBendahara || "MAHMUDI";
    const namaPenerima = kwitansi.namaPenerima || kwitansi.penerima || "MAHMUDI";

    const rincianItemsHtml = kwitansi.items && kwitansi.items.length > 1 ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dotted #000; font-size: 11px;">
        <div style="font-style: italic; margin-bottom: 3px;">dengan rincian:</div>
        <ul style="margin-left: 18px; margin-top: 2px;">
          ${kwitansi.items.map(it => `
            <li style="margin-bottom: 2px;">
              ${it.uraianItem} ${it.volumeRealisasi && it.volumeRealisasi > 0 && it.satuanRealisasi ? `(${it.volumeRealisasi} ${it.satuanRealisasi})` : ""} &mdash; <strong>Rp ${Number(it.jumlahRealisasi || 0).toLocaleString("id-ID")},-</strong>
            </li>
          `).join("")}
        </ul>
      </div>
    ` : "";

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #000;
      background: #f8fafc;
      padding: 24px;
    }
    @page {
      size: A4 portrait;
      margin: 0; /* Menghapus header tanggal/jam/judul dan footer URL browser */
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
        height: 297mm !important;
        max-width: 210mm !important;
        min-height: 297mm !important;
        padding: 16mm 18mm 12mm 18mm !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      .kwitansi-outer-box {
        border: 1px solid #000 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      .footer-printed-by {
        position: fixed !important;
        bottom: 8mm !important;
        left: 18mm !important;
        font-size: 10px !important;
        color: #475569 !important;
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
      max-width: 800px;
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
      max-width: 800px;
      min-height: 980px;
      margin: 0 auto;
      background: #fff;
      padding: 24px 30px 16px 30px;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .kwitansi-outer-box {
      border: 1px solid #000;
      padding: 28px 36px;
      background: #fff;
      width: 100%;
    }
    .footer-printed-by {
      font-size: 10.5px;
      color: #64748b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: left;
      padding-top: 24px;
    }
    .title-doc {
      text-align: center;
      font-size: 17px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .nomor-row {
      font-size: 13px;
      margin-bottom: 14px;
    }
    .grid-row {
      display: flex;
      margin-bottom: 12px;
      font-size: 13px;
      line-height: 1.4;
      align-items: baseline;
    }
    .grid-col-label {
      width: 140px;
      flex-shrink: 0;
      color: #000;
    }
    .grid-col-colon {
      width: 16px;
      text-align: center;
      font-weight: bold;
      flex-shrink: 0;
    }
    .grid-col-value {
      flex: 1;
    }
    .shaded-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      font-weight: bold;
      color: #000;
    }
    .border-box {
      border: 1px solid #000;
      padding: 10px 12px;
      min-height: 48px;
      color: #000;
    }
    .nominal-wrapper {
      margin: 20px 0 28px 0;
    }
    .nominal-badge {
      display: inline-block;
      border: 3px double #000;
      padding: 6px 14px;
      font-size: 16px;
      font-weight: bold;
      font-family: monospace;
      color: #000;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      text-align: center;
      font-size: 12.5px;
      gap: 12px;
      margin-top: 8px;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 135px;
    }
    .sig-name {
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }
    .sig-divider {
      border-bottom: 1px solid #000;
      width: 140px;
      margin: 3px auto;
    }
  </style>
</head>
<body>
  <div class="no-print no-print-bar">
    <span>Kwitansi Pembayaran: <strong>${kwitansi.nomorKwitansi}</strong></span>
    <div>
      <button class="btn-action-print" onclick="window.print()">Cetak Dokumen</button>
      <button class="btn-action-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="print-page-wrapper">
    <div class="kwitansi-outer-box">
      <div class="title-doc">KWITANSI / BUKTI PEMBAYARAN</div>
      
      <div class="nomor-row">
        <span style="display:inline-block; width: 70px;">Nomor:</span>
        <strong>${kwitansi.nomorKwitansi}</strong>
      </div>

      <div class="grid-row">
        <div class="grid-col-label">Telah terima dari</div>
        <div class="grid-col-colon">:</div>
        <div class="grid-col-value" style="font-weight: bold; text-transform: uppercase;">
          ${telahTerima}
        </div>
      </div>

      <div class="grid-row">
        <div class="grid-col-label">Uang sejumlah</div>
        <div class="grid-col-colon">:</div>
        <div class="grid-col-value">
          <div class="shaded-box">${terbilangClean}</div>
        </div>
      </div>

      <div class="grid-row" style="align-items: flex-start;">
        <div class="grid-col-label" style="padding-top: 4px;">Untuk pembayaran</div>
        <div class="grid-col-colon" style="padding-top: 4px;">:</div>
        <div class="grid-col-value">
          <div class="border-box">
            <div style="font-weight: 500; line-height: 1.4;">${kwitansi.uraianPembayaran}</div>
            ${rincianItemsHtml}
          </div>
        </div>
      </div>

      <div class="nominal-wrapper">
        <div class="nominal-badge">
          Rp &nbsp; ${nominalStr},-
        </div>
      </div>

      <div class="sig-grid">
        <div class="sig-col">
          <div style="line-height: 1.35;">
            <div>Mengetahui</div>
            <div>${labelKepalaPrefix}</div>
            ${labelKepalaQuoted ? `<div>${labelKepalaQuoted}</div>` : ""}
          </div>
          <div class="sig-name">${namaKepala}</div>
        </div>

        <div class="sig-col">
          <div style="line-height: 1.35;">
            <div>Lunas dibayar,</div>
            <div>${tanggalTtd}</div>
            <div style="margin-top: 2px;">Bendahara Madrasah</div>
          </div>
          <div class="sig-name">${namaBendahara}</div>
        </div>

        <div class="sig-col">
          <div style="line-height: 1.35;">
            <div>${tanggalTtd}</div>
            <div class="sig-divider"></div>
            <div>Penerima</div>
          </div>
          <div class="sig-name">${namaPenerima}</div>
        </div>
      </div>
    </div>

    <div class="footer-printed-by" style="font-size: 11px; color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding-top: 14px; text-align: left;">
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

  // Fastest & simplest print handler:
  // Opens a dedicated clean tab that directly triggers the native print dialog,
  // completely bypassing iframe sandbox restrictions.
  const handlePrint = () => {
    try {
      const htmlContent = generatePrintableHtml();
      const printWindow = window.open("", "_blank");
      
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setPrintSuccessNotice(true);
        setTimeout(() => setPrintSuccessNotice(false), 4000);
        return;
      }
    } catch (e) {
      console.warn("Jendela cetak pop-up dibatasi, beralih ke print halaman:", e);
    }

    // Direct fallback if pop-up is completely blocked
    try {
      window.print();
    } catch (err) {
      console.error("Window print error:", err);
    }
  };

  // Instant 1-click Download PDF handler
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("print-sheet-kwitansi-box") || document.getElementById("print-sheet-kwitansi");
      if (!element) {
        alert("Elemen kwitansi tidak ditemukan");
        return;
      }

      const canvas = await safeHtml2Canvas(element, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight);
      
      // Footer dokumen di bagian paling bawah halaman A4 (8mm dari batas bawah kertas)
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("printed by Santri", margin, pdfHeight - 8);

      const cleanNo = (kwitansi.nomorKwitansi || "Kwitansi").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Kwitansi_${cleanNo}.pdf`);
      setPrintSuccessNotice(true);
      setTimeout(() => setPrintSuccessNotice(false), 4000);
    } catch (err) {
      console.error("Gagal mengunduh file PDF:", err);
      alert("Gagal membuat PDF otomatis. Silakan gunakan tombol 'Cetak / Print Langsung'.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modal-print-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="modal-print-card bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none">
        
        {/* Header toolbar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">Cetak Kwitansi / Bukti Pembayaran</h3>
              <p className="text-xs text-slate-400">Nomor: {kwitansi.nomorKwitansi}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Tombol Cetak Langsung */}
            <button
              onClick={handlePrint}
              id="btn-cetak-kwitansi-langsung"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              title="Buka jendela cetak A4 & print langsung"
            >
              <Printer className="w-4 h-4" />
              Cetak / Print Langsung
            </button>

            {/* Tombol Unduh PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              id="btn-unduh-pdf-kwitansi"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
              title="Unduh langsung sebagai file PDF resmi"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? "Membuat PDF..." : "Unduh PDF"}
            </button>

            {/* Tombol Tutup */}
            <button
              onClick={onClose}
              id="btn-tutup-modal-kwitansi"
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Notice Banner */}
        {printSuccessNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-emerald-800 text-xs font-medium print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Jendela cetak / dokumen PDF kwitansi berhasil dibuka dan diproses.</span>
          </div>
        )}

        {/* Printable Document Container */}
        <div 
          ref={printRef} 
          id="print-sheet-kwitansi" 
          className="dokumen-cetak-resmi p-6 md:p-10 print:p-0 bg-white text-black font-sans relative flex flex-col justify-between"
        >
          {/* Kwitansi Outer Border Box */}
          <div 
            id="print-sheet-kwitansi-box"
            className="border border-black p-6 md:p-8 relative print:border print:border-black text-black bg-white"
          >
            
            {/* 1. Judul Baku Centered */}
            <div className="text-center pt-1 pb-4">
              <h1 className="text-base md:text-lg font-bold tracking-wider uppercase text-black font-sans">
                KWITANSI / BUKTI PEMBAYARAN
              </h1>
            </div>

            {/* Nomor Kwitansi */}
            <div className="text-xs md:text-sm font-sans text-black mb-4">
              <span className="font-normal inline-block w-20">Nomor:</span>
              <span className="font-bold">{kwitansi.nomorKwitansi}</span>
            </div>

            {/* Kwitansi Content Table / Grid */}
            <div className="space-y-3.5 text-xs md:text-sm font-sans text-black">
              
              {/* Telah Terima Dari */}
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <div className="col-span-3 font-normal text-black">Telah terima dari</div>
                <div className="col-span-1 text-center font-bold text-black">:</div>
                <div className="col-span-8 font-bold text-black uppercase">
                  {kwitansi.telahTerimaDari || `BENDAHARA ${profil.namaLembaga || "MADIN"}`}
                </div>
              </div>

              {/* Uang Sejumlah (Shaded Background Box) */}
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <div className="col-span-3 font-normal text-black">Uang sejumlah</div>
                <div className="col-span-1 text-center font-bold text-black">:</div>
                <div className="col-span-8">
                  <div 
                    style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }}
                    className="px-3 py-1.5 font-bold text-black border"
                  >
                    {terbilangClean}
                  </div>
                </div>
              </div>

              {/* Untuk Pembayaran (Inside Rectangular Border Box) */}
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3 font-normal text-black pt-1">Untuk pembayaran</div>
                <div className="col-span-1 text-center font-bold text-black pt-1">:</div>
                <div className="col-span-8">
                  <div className="border border-black print:border-black p-2.5 min-h-[48px] text-black">
                    <p className="font-medium text-black leading-relaxed">
                      {kwitansi.uraianPembayaran}
                    </p>

                    {/* Rincian Komponen if more than 1 item */}
                    {kwitansi.items && kwitansi.items.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-dotted border-black text-[11px] space-y-1">
                        <p className="font-normal italic text-black">dengan rincian:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {kwitansi.items.map((it, idx) => (
                            <li key={idx} className="text-black">
                              {it.uraianItem} {it.volumeRealisasi !== undefined && it.volumeRealisasi > 0 && it.satuanRealisasi ? `(${it.volumeRealisasi} ${it.satuanRealisasi})` : ""} — <span className="font-semibold">Rp {Number(it.jumlahRealisasi || 0).toLocaleString("id-ID")},-</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Kotak Jumlah / Nominal Box (Sits by itself on the left with double border) */}
            <div className="mt-5 mb-8">
              <div className="border-[3px] border-double border-black print:border-[3px] print:border-double print:border-black px-4 py-2 inline-block font-bold text-base md:text-lg font-mono text-black">
                Rp &nbsp; {Number(kwitansi.totalJumlah || 0).toLocaleString("id-ID")},-
              </div>
            </div>

            {/* Signature Block (3 Columns) */}
            <div className="grid grid-cols-3 gap-3 text-center font-sans text-xs md:text-sm text-black">
              
              {/* Kolom 1: Mengetahui / Kepala */}
              <div className="flex flex-col justify-between h-36">
                <div className="space-y-0.5">
                  <p className="font-normal text-black">Mengetahui</p>
                  <div className="font-normal text-black leading-snug">
                    <span>{labelKepalaPrefix}</span>
                    {labelKepalaQuoted && (
                      <>
                        <br />
                        <span>{labelKepalaQuoted}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-bold underline uppercase text-black tracking-wide">
                    {kwitansi.namaKepala || profil.namaKepala}
                  </p>
                </div>
              </div>

              {/* Kolom 2: Lunas dibayar / Bendahara Madrasah */}
              <div className="flex flex-col justify-between h-36">
                <div className="space-y-0.5">
                  <p className="font-normal text-black leading-snug">Lunas dibayar,</p>
                  <p className="font-normal text-black leading-snug">{formatTanggalIndo(kwitansi.tanggal)}</p>
                  <p className="font-normal text-black pt-0.5">Bendahara Madrasah</p>
                </div>
                <div>
                  <p className="font-bold underline uppercase text-black tracking-wide">
                    {kwitansi.namaBendahara || profil.namaBendahara}
                  </p>
                </div>
              </div>

              {/* Kolom 3: Tanggal dengan Garis Bawah / Penerima */}
              <div className="flex flex-col justify-between h-36">
                <div className="space-y-0.5">
                  <p className="font-normal text-black">
                    {formatTanggalIndo(kwitansi.tanggal)}
                  </p>
                  <div className="border-b border-black w-40 max-w-full mx-auto my-0.5"></div>
                  <p className="font-normal text-black">Penerima</p>
                </div>
                <div>
                  <p className="font-bold underline uppercase text-black tracking-wide">
                    {kwitansi.namaPenerima || kwitansi.penerima}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Footer printed by Santri positioned at the very bottom */}
          <div className="mt-8 pt-4 text-[11px] text-slate-500 font-sans text-left print:fixed print:bottom-[8mm] print:left-[18mm] print:m-0 print:p-0 print:text-slate-600">
            printed by Santri
          </div>

        </div>

      </div>
    </div>
  );
}
