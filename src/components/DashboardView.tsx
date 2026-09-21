/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building, 
  FileText, 
  PlusCircle, 
  TrendingUp, 
  FolderKanban, 
  Settings, 
  HelpCircle,
  Database,
  ArrowRight,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  RefreshCw,
  X
} from "lucide-react";
import { RABData, ProfilLembaga } from "../types";

interface DashboardViewProps {
  profil: ProfilLembaga;
  rabList: RABData[];
  onNavigate: (tab: string, param?: any) => void;
  isSheetsConnected: boolean;
  onDeleteRab?: (tahun: string) => Promise<boolean>;
}

export default function DashboardView({ 
  profil, 
  rabList, 
  onNavigate,
  isSheetsConnected,
  onDeleteRab 
}: DashboardViewProps) {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Find latest/active RAB year
  const sortedRabs = [...rabList].sort((a, b) => parseInt(b.tahun) - parseInt(a.tahun));
  const latestRab = sortedRabs[0] || null;

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !onDeleteRab) return;
    setIsDeleting(true);
    try {
      await onDeleteRab(itemToDelete);
      setItemToDelete(null);
    } catch (err) {
      console.error("Gagal menghapus dari dashboard:", err);
      alert("Gagal menghapus data.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-3 pb-1" id="dashboard-container">
      {/* Welcome Hero Banner with Islamic geometric watermark */}
      <div 
        className="relative overflow-hidden bg-gradient-to-r from-brand-green-dark via-brand-green-dark to-brand-green rounded-xl p-3.5 md:p-4 text-white shadow-sm border border-brand-gold/15"
        id="dashboard-hero"
      >
        {/* Repeating Islamic geometric Star Pattern watermark */}
        <div className="absolute inset-0 bg-islamic-pattern opacity-[0.04] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Column: Badge, Title & Justified Description */}
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-brand-gold/15 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-brand-gold border border-brand-gold/30">
              <Building className="w-3 h-3 text-brand-gold" />
              {profil.namaLembaga || "Lembaga Belum Diatur"}
            </div>

            {/* Clean Typography Header without logo */}
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight font-serif text-brand-gold leading-none">
                SANTRI
              </h1>
              <span className="text-xs font-semibold text-brand-gold/85 tracking-wide">
                (Sistem Administrasi &amp; Transparansi Realisasi Hibah)
              </span>
            </div>

            <p className="text-brand-krem/90 text-xs leading-relaxed text-justify">
              SANTRI (Sistem Administrasi &amp; Transparansi Realisasi Hibah) adalah platform manajemen keuangan terpadu untuk pengelolaan Dana Hibah BPPDGS Madrasah Diniyah. Tingkatkan efisiensi dan akurasi penyusunan laporan pertanggungjawaban (SPJ) Anda melalui ekosistem digital yang praktis dan profesional.
            </p>
          </div>

          {/* Right Column: 3 Action Buttons stacked vertically */}
          <div className="flex flex-col gap-1.5 w-full md:w-52 lg:w-56 shrink-0">
            <button
              onClick={() => onNavigate("susun")}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-green-dark hover:bg-brand-gold-muted active:scale-[0.98] transition px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-2xs cursor-pointer whitespace-nowrap"
              id="btn-quick-create-rab"
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-green-dark shrink-0" />
              Buat RAB Baru
            </button>
            <button
              onClick={() => onNavigate("belanja")}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98] transition px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs cursor-pointer whitespace-nowrap"
              id="btn-quick-menu-belanja"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              Menu Belanja & Buku Kas
            </button>
            <button
              onClick={() => onNavigate("arsip")}
              className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-[0.98] transition px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 cursor-pointer whitespace-nowrap"
              id="btn-quick-view-archive"
            >
              <FolderKanban className="w-3.5 h-3.5 shrink-0" />
              Lihat Arsip RAB
            </button>
          </div>
        </div>

        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 bg-brand-gold/10 rounded-full blur-2xl" />
      </div>

      {/* Connection Alert Status with compact streamlined styling */}
      <div 
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-2 px-3.5 rounded-lg border text-xs shadow-2xs ${
          isSheetsConnected 
            ? "bg-emerald-50/70 text-emerald-800 border-emerald-200/60" 
            : "bg-brand-gold-pale/80 text-brand-gold-muted border-brand-gold/30"
        }`}
        id="db-connection-status-alert"
      >
        <div className="flex gap-2 items-center">
          <div className={`p-1.5 rounded-md shrink-0 ${isSheetsConnected ? "bg-emerald-100 text-emerald-700" : "bg-brand-gold/15 text-brand-gold-muted"}`}>
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs mr-2">
              {isSheetsConnected ? "Database Terkoneksi ke Google Sheets" : "Penyimpanan Lokal (Offline)"}
            </span>
            <span className="text-[11px] opacity-85">
              {isSheetsConnected 
                ? "Semua perubahan otomatis tersimpan langsung ke Google Spreadsheet Anda secara real-time." 
                : "Aplikasi berjalan dalam mode lokal. Hubungkan Google Sheets di menu Pengaturan."}
            </span>
          </div>
        </div>
        {!isSheetsConnected && (
          <button
            onClick={() => onNavigate("pengaturan")}
            className="text-[11px] font-extrabold bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold-muted px-2.5 py-1 rounded-md border border-brand-gold/30 transition cursor-pointer flex items-center gap-1 shrink-0"
            id="btn-connect-sheets-quick"
          >
            Hubungkan Sekarang
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Stats Grid with compact padding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="dashboard-stats-grid">
        
        {/* Stat Card 1: Total Anggaran (FEATURED CARD) */}
        <div className="bg-gradient-to-br from-brand-gold-pale to-white rounded-xl p-3.5 border-2 border-brand-gold shadow-xs flex items-center justify-between relative overflow-hidden group" id="stat-card-total-budget">
          <div className="space-y-1 relative z-10">
            <p className="text-[11px] font-bold text-brand-gold-muted uppercase tracking-wider font-display">
              Anggaran Terpakai ({latestRab?.tahun || "-"})
            </p>
            <h3 className="text-xl font-extrabold text-brand-green font-mono">
              {latestRab ? formatIDR(latestRab.totalAnggaran) : "Rp 0"}
            </h3>
            {latestRab?.paguAnggaran ? (
              <div className="text-[11px] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="text-slate-500 font-medium">
                  Pagu: <strong className="text-slate-700 font-mono">{formatIDR(latestRab.paguAnggaran)}</strong>
                </span>
                {(() => {
                  const sld = latestRab.paguAnggaran - latestRab.totalAnggaran;
                  return (
                    <span className={`font-bold ${sld < 0 ? 'text-rose-600' : 'text-brand-green'}`}>
                      Saldo: <span className="font-mono">{sld < 0 ? '-' : ''}{formatIDR(Math.abs(sld))}</span>
                    </span>
                  );
                })()}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-brand-gold" />
                Sumber: <span className="font-semibold text-brand-green">{latestRab?.sumberDana || "-"}</span>
              </p>
            )}
          </div>
          <div className="p-2.5 bg-brand-gold/15 text-brand-gold-muted rounded-lg shrink-0 self-center shadow-2xs relative z-10">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 2: Jumlah Arsip RAB */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-xs flex items-center justify-between" id="stat-card-rab-count">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
              Arsip RAB Tersimpan
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {rabList.length} <span className="text-xs font-semibold text-slate-500">Tahun Anggaran</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
              Periode: {rabList.map(r => r.tahun).join(", ") || "-"}
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shadow-2xs">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 3: Lembaga Terdaftar */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-xs flex items-center justify-between" id="stat-card-school-info">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
              Profil Madrasah Diniyah
            </p>
            <h3 className="text-base font-extrabold text-slate-800 truncate max-w-[210px]" title={profil.namaLembaga}>
              {profil.namaLembaga || "Belum diatur"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              NSM: <span className="font-bold text-slate-700 font-mono">{profil.nsm || "-"}</span>
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shadow-2xs">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity & Help Guide with compact height */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3" id="dashboard-bottom-grid">
        {/* Recent RABs (3/5 wide) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-xs space-y-2" id="dashboard-active-rabs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-extrabold text-slate-800 text-sm font-serif">Arsip RAB Terakhir</h2>
            <button 
              onClick={() => onNavigate("arsip")}
              className="text-xs font-bold text-brand-gold-muted hover:text-brand-gold cursor-pointer flex items-center gap-1 transition"
            >
              Semua Arsip <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {sortedRabs.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-xs font-medium">
              Belum ada RAB yang disimpan. Klik "Buat RAB Baru" untuk memulai!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedRabs.slice(0, 2).map((rab) => (
                <div key={rab.tahun} className="py-1.5 flex items-center justify-between hover:bg-brand-krem/40 rounded-lg px-1.5 transition-all">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">RAB Tahun Anggaran {rab.tahun}</p>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Sumber: <span className="font-bold text-brand-green">{rab.sumberDana}</span> &bull; Diupdate: {new Date(rab.updatedAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    <span className="font-extrabold text-brand-green text-xs font-mono">{formatIDR(rab.totalAnggaran)}</span>
                    <button
                      onClick={() => onNavigate("susun", { editTahun: rab.tahun })}
                      className="text-xs bg-slate-50 hover:bg-brand-gold-pale text-slate-700 hover:text-brand-gold-muted transition px-2 py-1 rounded-md border border-slate-200 hover:border-brand-gold/30 cursor-pointer font-bold"
                    >
                      Edit
                    </button>
                    {onDeleteRab && (
                      <button
                        onClick={() => setItemToDelete(rab.tahun)}
                        className="text-xs p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-transparent hover:border-rose-200 transition cursor-pointer"
                        title={`Hapus RAB & Pencairan TA ${rab.tahun}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Help Guide (2/5 wide) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-gold-pale/30 to-white rounded-xl p-3.5 border border-brand-gold/15 shadow-xs space-y-2" id="dashboard-quick-tips">
          <div className="flex items-center gap-1.5 border-b border-brand-gold/10 pb-2">
            <HelpCircle className="w-4 h-4 text-brand-gold" />
            <h2 className="font-extrabold text-slate-800 text-sm font-serif">Panduan Ringkas</h2>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-600 leading-snug font-medium">
            <li className="flex gap-2">
              <span className="flex items-center justify-center bg-brand-gold/15 text-brand-gold-muted font-bold rounded-full w-4 h-4 shrink-0 text-[10px]">1</span>
              <span>Lengkapi data di menu <strong className="text-brand-green font-bold">Pengaturan Lembaga</strong> untuk kop &amp; tanda tangan.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex items-center justify-center bg-brand-gold/15 text-brand-gold-muted font-bold rounded-full w-4 h-4 shrink-0 text-[10px]">2</span>
              <span>Masuk ke <strong className="text-brand-green font-bold">Susun RAB</strong>, tentukan tahun &amp; rincian 7 komponen kegiatan.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex items-center justify-center bg-brand-gold/15 text-brand-gold-muted font-bold rounded-full w-4 h-4 shrink-0 text-[10px]">3</span>
              <span>Subtotal dihitung otomatis secara real-time. Klik <strong className="text-brand-green font-bold">Simpan</strong> setelah selesai.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex items-center justify-center bg-brand-gold/15 text-brand-gold-muted font-bold rounded-full w-4 h-4 shrink-0 text-[10px]">4</span>
              <span>Di <strong className="text-brand-green font-bold">Arsip RAB</strong>, cetak laporan A4, duplikat, atau ekspor Excel/CSV.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Data RAB & Pencairan */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  Hapus RAB &amp; Pencairan Hibah?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data <strong>RAB Tahun Anggaran {itemToDelete}</strong> beserta data pencairan dana hibah dan belanja terkait? Data yang dihapus tidak dapat dipulihkan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus Semua
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
