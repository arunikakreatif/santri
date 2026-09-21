/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Check, 
  School, 
  Trash2, 
  Settings,
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";
import { ProfilLembaga } from "../../types";
import { 
  getMadinList, 
  getActiveMadinId, 
  setActiveMadinId, 
  createMadin, 
  deleteMadin 
} from "../../services/db";

interface MadinSelectorProps {
  currentMadin: ProfilLembaga;
  onMadinChanged: (newMadinId: string) => void;
}

export default function MadinSelector({ currentMadin, onMadinChanged }: MadinSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [madinList, setMadinList] = useState<ProfilLembaga[]>(getMadinList());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Madin Form State
  const [namaLembaga, setNamaLembaga] = useState<string>("");
  const [nsm, setNsm] = useState<string>("");
  const [alamat, setAlamat] = useState<string>("");
  const [kecamatan, setKecamatan] = useState<string>("Kawedanan");
  const [kabupaten, setKabupaten] = useState<string>("Magetan");
  const [namaKepala, setNamaKepala] = useState<string>("");
  const [namaBendahara, setNamaBendahara] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete madin confirmation state
  const [madinToDelete, setMadinToDelete] = useState<ProfilLembaga | null>(null);
  const [deletingMadin, setDeletingMadin] = useState<boolean>(false);

  const refreshList = () => {
    setMadinList(getMadinList());
  };

  const handleSelectMadin = (id: string) => {
    setActiveMadinId(id);
    setDropdownOpen(false);
    onMadinChanged(id);
  };

  const handleCreateNewMadin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaLembaga.trim()) {
      setFormError("Nama Madrasah Diniyah wajib diisi.");
      return;
    }

    try {
      const created = await createMadin({
        namaLembaga: namaLembaga.trim().toUpperCase(),
        nsm: nsm.trim() || "311235120000",
        alamat: alamat.trim() || "Jl. Pesantren No. 1",
        kecamatan: kecamatan.trim() || "Kawedanan",
        kabupaten: kabupaten.trim() || "Magetan",
        namaKepala: namaKepala.trim() || "KEPALA MADIN",
        namaBendahara: namaBendahara.trim() || "BENDAHARA MADIN",
        kotaTanggal: `${kabupaten.trim() || "Magetan"}, 31 Desember ${new Date().getFullYear()}`,
        sumberDanaOptions: ["DAU", "BKK"]
      });

      refreshList();
      setShowAddModal(false);
      onMadinChanged(created.id || "");
    } catch (err: any) {
      setFormError(err?.message || "Gagal membuat madin baru.");
    }
  };

  const handleDeleteMadin = (item: ProfilLembaga, e: React.MouseEvent) => {
    e.stopPropagation();
    setMadinToDelete(item);
  };

  const confirmDeleteMadin = async () => {
    if (!madinToDelete || !madinToDelete.id) return;
    if (madinList.length <= 1) {
      setMadinToDelete(null);
      return;
    }
    setDeletingMadin(true);
    try {
      await deleteMadin(madinToDelete.id);
      refreshList();
      const nextActiveId = getActiveMadinId();
      onMadinChanged(nextActiveId);
      setMadinToDelete(null);
    } catch (err) {
      console.error("Gagal menghapus madin:", err);
    } finally {
      setDeletingMadin(false);
    }
  };

  return (
    <div className="relative">
      
      {/* Madin Active Switcher Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full text-left bg-black/25 hover:bg-black/35 border border-brand-gold/30 rounded-2xl p-3 flex items-center justify-between gap-2.5 transition cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center shrink-0 border border-brand-gold/40">
            <School className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider block">
              Madin Aktif (Multi-Tenant)
            </span>
            <p className="text-xs font-black text-white truncate font-sans">
              {currentMadin.namaLembaga}
            </p>
            <p className="text-[10px] text-slate-300 truncate">
              NSM: {currentMadin.nsm}
            </p>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-brand-gold shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-brand-gold/30 rounded-2xl shadow-2xl p-2 z-50 text-white space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pilih Madrasah Diniyah:
              </span>
              <span className="text-[10px] font-semibold text-brand-gold">
                {madinList.length} Terdaftar
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 py-1">
              {madinList.map((m) => {
                const isSelected = m.id === currentMadin.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMadin(m.id || "")}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected 
                        ? "bg-brand-green text-white border border-brand-gold/40" 
                        : "hover:bg-white/10 text-slate-200"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold truncate">{m.namaLembaga}</p>
                      <p className="text-[10px] opacity-75 truncate">
                        Kec. {m.kecamatan}, Kab. {m.kabupaten}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-gold" />
                      )}
                      {madinList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteMadin(m, e)}
                          className="p-1 hover:text-red-400 text-slate-500 rounded transition"
                          title="Hapus Madin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Madin Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setShowAddModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/40 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Madrasah Diniyah Baru
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL FORM TAMBAH MADIN BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl text-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tambah Madrasah Diniyah Baru (Multi-Tenant)
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewMadin} className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Madrasah Diniyah *</label>
                <input
                  type="text"
                  value={namaLembaga}
                  onChange={(e) => setNamaLembaga(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder='Contoh: MADRASAH DINIYAH "NURUL IMAN"'
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NSM / Nomor Ijin</label>
                  <input
                    type="text"
                    value={nsm}
                    onChange={(e) => setNsm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="31123512xxxx"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kecamatan</label>
                  <input
                    type="text"
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Kawedanan"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Alamat Lengkap</label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Jl. Raya Sukomoro No. 10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Kepala Madin</label>
                  <input
                    type="text"
                    value={namaKepala}
                    onChange={(e) => setNamaKepala(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="KH. ACHMAD, S.Pd.I."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Bendahara Madin</label>
                  <input
                    type="text"
                    value={namaBendahara}
                    onChange={(e) => setNamaBendahara(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="UST. ZAINUDDIN, S.E."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Simpan & Aktifkan Madin
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS MADIN */}
      {madinToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Madrasah Diniyah</h3>
                  <p className="text-xs text-slate-500">Konfirmasi penghapusan data madin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMadinToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus Madrasah Diniyah <strong>{madinToDelete.namaLembaga}</strong> beserta seluruh data profilnya? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMadinToDelete(null)}
                disabled={deletingMadin}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteMadin}
                disabled={deletingMadin}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {deletingMadin ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus Madin
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
