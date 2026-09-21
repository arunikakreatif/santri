/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FolderKanban, 
  Search, 
  Printer, 
  Edit3, 
  Copy, 
  Trash2, 
  PlusCircle,
  FileCheck,
  Calendar,
  DollarSign,
  AlertTriangle,
  X,
  RefreshCw,
  FileText
} from "lucide-react";
import { RABData } from "../types";

interface ArsipRabViewProps {
  rabList: RABData[];
  onNavigate: (tab: string, param?: any) => void;
  onDeleteRab: (tahun: string) => Promise<boolean>;
  onDuplicateRab: (sourceTahun: string, targetTahun: string) => Promise<boolean>;
}

export default function ArsipRabView({ 
  rabList, 
  onNavigate, 
  onDeleteRab,
  onDuplicateRab
}: ArsipRabViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Duplication Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [sourceTahun, setSourceTahun] = useState("");
  const [targetTahun, setTargetTahun] = useState("");
  const [duplicationError, setDuplicationError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Deletion Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tahunToDelete, setTahunToDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Filter & Search Rabs
  const filteredRabs = rabList.filter(rab => 
    rab.tahun.includes(searchTerm) || 
    rab.sumberDana.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => parseInt(b.tahun) - parseInt(a.tahun));

  // Format IDR Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Open Duplicate Dialog
  const openDuplicateDialog = (tahun: string) => {
    setSourceTahun(tahun);
    setTargetTahun((parseInt(tahun) + 1).toString()); // Default to next year
    setDuplicationError("");
    setShowDuplicateModal(true);
  };

  // Confirm Duplication
  const handleConfirmDuplicate = async () => {
    const yearNum = parseInt(targetTahun);
    if (!targetTahun || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      setDuplicationError("Masukkan tahun anggaran yang valid (contoh: 2026).");
      return;
    }

    // Check if target year already exists
    if (rabList.some(r => r.tahun === targetTahun)) {
      setDuplicationError(`RAB untuk Tahun Anggaran ${targetTahun} sudah ada. Silakan pilih tahun lain atau hapus yang sudah ada terlebih dahulu.`);
      return;
    }

    setDuplicating(true);
    setDuplicationError("");

    try {
      const success = await onDuplicateRab(sourceTahun, targetTahun);
      if (success) {
        setShowDuplicateModal(false);
        // Direct the user to the newly duplicated RAB editor
        onNavigate("susun", { editTahun: targetTahun });
      } else {
        setDuplicationError("Gagal menduplikat RAB. Silakan coba lagi.");
      }
    } catch (err: any) {
      setDuplicationError(err.message || "Gagal menduplikat RAB.");
    } finally {
      setDuplicating(false);
    }
  };

  // Open Delete Dialog
  const openDeleteDialog = (tahun: string) => {
    setTahunToDelete(tahun);
    setShowDeleteModal(true);
  };

  // Confirm Deletion
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const success = await onDeleteRab(tahunToDelete);
      if (success) {
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus RAB.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="archive-view-container">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-700" />
            Arsip RAB BPPDGS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar lengkap Rencana Anggaran Biaya per tahun anggaran yang telah disusun.
          </p>
        </div>
        <button
          onClick={() => onNavigate("susun")}
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
          id="btn-archive-create-rab"
        >
          <PlusCircle className="w-4 h-4" />
          Susun RAB Baru
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-xs" id="archive-filter-bar">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan tahun anggaran atau sumber dana..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition"
          />
        </div>
      </div>

      {/* Grid List of RABs */}
      {filteredRabs.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 py-12 text-center" id="archive-empty-state">
          <FolderKanban className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-700 font-bold text-base">Tidak Ada Data RAB</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto px-4">
            {searchTerm 
              ? "Tidak ditemukan RAB yang cocok dengan kata pencarian Anda." 
              : "Belum ada Rencana Anggaran Biaya yang tersimpan di sistem."}
          </p>
          {!searchTerm && (
            <button
              onClick={() => onNavigate("susun")}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Susun RAB Pertama Anda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="archive-rabs-grid">
          {filteredRabs.map((rab) => (
            <div 
              key={rab.tahun} 
              className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group relative overflow-hidden"
              id={`archive-card-${rab.tahun}`}
            >
              {/* Badge Year */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm">TA {rab.tahun}</span>
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  Diperbarui: {new Date(rab.updatedAt).toLocaleDateString("id-ID")}
                </div>
              </div>

              {/* Budget Details */}
              <div className="space-y-1 py-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Nilai Anggaran</p>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight">{formatIDR(rab.totalAnggaran)}</p>
                <div className="flex items-center gap-1.5 pt-1.5">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                    Sumber Dana: <strong className="text-slate-800">{rab.sumberDana}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate("cetak", { previewTahun: rab.tahun, docType: "rab" })}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-xs py-2 rounded-lg transition shadow-xs cursor-pointer"
                  title="Lihat Preview & Cetak Laporan RAB"
                  id={`btn-archive-print-${rab.tahun}`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak RAB
                </button>
                <button
                  onClick={() => onNavigate("cetak", { previewTahun: rab.tahun, docType: "lpp" })}
                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs py-2 rounded-lg transition shadow-xs cursor-pointer"
                  title="Lihat & Cetak Dokumen Laporan Program Pelaksanaan (LPP)"
                  id={`btn-archive-lpp-${rab.tahun}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Cetak LPP
                </button>
                <button
                  onClick={() => onNavigate("susun", { editTahun: rab.tahun })}
                  className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs py-2 rounded-lg transition shadow-xs cursor-pointer"
                  title="Edit Rincian Kegiatan"
                  id={`btn-archive-edit-${rab.tahun}`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  Edit RAB
                </button>
                <button
                  onClick={() => openDuplicateDialog(rab.tahun)}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                  title="Duplikat RAB untuk tahun lain"
                  id={`btn-archive-duplicate-${rab.tahun}`}
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  Salin Acuan
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openDeleteDialog(rab.tahun)}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold py-1.5 rounded-md transition cursor-pointer"
                  title="Hapus RAB Tahun Ini"
                  id={`btn-archive-delete-${rab.tahun}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Hapus Arsip Tahun {rab.tahun}
                </button>
              </div>

              {/* Decorative side accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
            </div>
          ))}
        </div>
      )}

      {/* DUPLICATE MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" id="duplicate-rab-modal">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Duplikat RAB sebagai Acuan</h3>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menyalin seluruh struktur komponen beserta sub-item rincian dari <strong className="text-slate-900">RAB Tahun {sourceTahun}</strong> sebagai template/template awal untuk Tahun Anggaran baru.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Tahun Anggaran Baru
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={targetTahun}
                  onChange={(e) => setTargetTahun(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  placeholder="Contoh: 2026"
                />
              </div>

              {duplicationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-relaxed flex gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{duplicationError}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={duplicating}
                onClick={handleConfirmDuplicate}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                {duplicating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menyalin...
                  </>
                ) : (
                  "Konfirmasi Duplikat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" id="delete-rab-modal">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-sm w-full overflow-hidden animate-zoom-in">
            <div className="p-5 space-y-4 text-center">
              <div className="mx-auto flex items-center justify-center bg-rose-100 text-rose-600 rounded-full w-12 h-12">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">Hapus RAB Tahun {tahunToDelete}?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tindakan ini permanen dan tidak dapat dibatalkan. Seluruh data rincian untuk Tahun Anggaran {tahunToDelete} akan dihapus secara permanen dari sistem.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
                id="btn-confirm-delete-rab"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
