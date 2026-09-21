/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Building2,
  Info,
  RefreshCw,
  X
} from "lucide-react";
import { PenerimaanDana, ProfilLembaga } from "../../types";
import { savePenerimaanDana, deletePenerimaanDana } from "../../services/db";

interface PenerimaanDanaTabProps {
  profil: ProfilLembaga;
  penerimaanList: PenerimaanDana[];
  onRefresh: () => void;
  onNavigateToBelanja: (tab: string) => void;
}

export default function PenerimaanDanaTab({
  profil,
  penerimaanList,
  onRefresh,
  onNavigateToBelanja
}: PenerimaanDanaTabProps) {
  const currentYear = new Date().getFullYear().toString();

  // Form State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tahun, setTahun] = useState<string>(currentYear);
  const [tanggal, setTanggal] = useState<string>(`${currentYear}-01-10`);
  const [sumberDana, setSumberDana] = useState<string>("DAU Kabupaten");
  const [jumlah, setJumlah] = useState<number | "">(20000000);
  const [keterangan, setKeterangan] = useState<string>("Pencairan Dana Hibah DAU Kabupaten TA " + currentYear);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; tahun: string } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setTahun(currentYear);
    setTanggal(`${currentYear}-01-10`);
    setSumberDana("DAU Kabupaten");
    setJumlah(20000000);
    setKeterangan(`Pencairan Dana Hibah DAU Kabupaten TA ${currentYear}`);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowModal(true);
  };

  const openEditModal = (item: PenerimaanDana) => {
    setEditingId(item.id);
    setTahun(item.tahun);
    setTanggal(item.tanggal);
    setSumberDana(item.sumberDana);
    setJumlah(item.jumlah);
    setKeterangan(item.keterangan || "");
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const nominal = typeof jumlah === "number" ? jumlah : parseInt(String(jumlah), 10);
    if (!nominal || nominal <= 0) {
      setErrorMessage("Nominal jumlah dana yang diterima harus lebih dari Rp 0.");
      return;
    }

    if (!tahun.trim()) {
      setErrorMessage("Tahun anggaran wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave: PenerimaanDana = {
        id: editingId || "",
        madinId: profil.id || "madin-baiturrohman",
        tahun: tahun.trim(),
        tanggal,
        sumberDana,
        jumlah: nominal,
        keterangan: keterangan.trim(),
        createdAt: new Date().toISOString()
      };

      const result = await savePenerimaanDana(dataToSave);
      if (result.success) {
        setSuccessMessage("Data Penerimaan Dana Hibah berhasil disimpan.");
        onRefresh();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMessage(null);
        }, 1000);
      } else {
        setErrorMessage(result.message || "Gagal menyimpan data penerimaan dana hibah.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, tahunItem: string) => {
    setItemToDelete({ id, tahun: tahunItem });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const tahunHapus = itemToDelete.tahun;
      await deletePenerimaanDana(itemToDelete.id, itemToDelete.tahun, profil.id);
      setItemToDelete(null);
      setActionNotice({
        type: "success",
        text: `Data pencairan dana hibah TA ${tahunHapus} berhasil dihapus.`
      });
      setTimeout(() => setActionNotice(null), 4000);
      onRefresh();
    } catch (err: any) {
      console.error("Gagal menghapus penerimaan dana:", err);
      setActionNotice({
        type: "error",
        text: `Gagal menghapus data pencairan: ${err?.message || err}`
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Alert / Action Notification Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
          actionNotice.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <div className="flex items-center gap-2.5">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Informational Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-xs shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-950">
              Penerimaan Dana Hibah Tahunan
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">
              Menu ini diisi <strong>hanya 1 kali per tahun anggaran</strong> untuk madrasah diniyah aktif (<strong>{profil.namaLembaga}</strong>).
              Dana yang diterima di sini secara otomatis dijadikan <strong>Saldo Awal baris pertama di Buku Kas Pembantu (BKP)</strong> dan <strong>Saldo Bulan Pertama di Buku Kas Umum (BKU)</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Input Penerimaan Dana
        </button>
      </div>

      {/* List / Table of Penerimaan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Riwayat Pencairan Dana Hibah ({profil.namaLembaga})
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total {penerimaanList.length} Tahun Anggaran
          </span>
        </div>

        {penerimaanList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Belum Ada Catatan Penerimaan Dana Hibah</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan klik tombol "Input Penerimaan Dana" di atas untuk mencatat pencairan dana hibah pertama Anda.
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4">Tahun Anggaran</th>
                  <th className="p-4">Tgl Penerimaan</th>
                  <th className="p-4">Sumber Dana</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4 text-right">Jumlah Penerimaan</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {penerimaanList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 transition">
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        TA {item.tahun}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.sumberDana}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {item.keterangan || "-"}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-700 text-sm">
                      Rp {item.jumlah.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Penerimaan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.tahun)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Hapus Penerimaan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL INPUT / EDIT PENERIMAAN DANA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? "Edit Penerimaan Dana Hibah" : "Input Penerimaan Dana Hibah"}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Info Target Madin */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Madrasah Diniyah Aktif:</span>
                <p className="font-bold text-slate-800 text-xs">{profil.namaLembaga}</p>
              </div>

              {/* Tahun Anggaran */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tahun Anggaran *</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  disabled={!!editingId}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  placeholder="Contoh: 2025"
                  required
                />
                <p className="text-[10px] text-slate-500">
                  Hanya boleh ada 1 catatan penerimaan per tahun anggaran untuk madrasah ini.
                </p>
              </div>

              {/* Tanggal Penerimaan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Pencairan / Penerimaan *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              {/* Sumber Dana */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sumber Dana *</label>
                <select
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="DAU Kabupaten">DAU Kabupaten</option>
                  <option value="BKK Provinsi">BKK Provinsi</option>
                  <option value="BOS Diniyah">BOS Diniyah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Jumlah Dana Diterima */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jumlah Dana yang Diterima (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Contoh: 20000000"
                    required
                  />
                </div>
                {typeof jumlah === "number" && jumlah > 0 && (
                  <p className="text-[11px] text-emerald-700 font-semibold italic">
                    Terbilang: Rp {jumlah.toLocaleString("id-ID")}
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Keterangan Transaksi</label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Misal: Pencairan Hibah APBD Magetan TA 2025"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Menyimpan..." : (editingId ? "Perbarui Data" : "Simpan Penerimaan")}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PENERIMAAN DANA */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Penerimaan Dana</h3>
                  <p className="text-xs text-slate-500">Konfirmasi penghapusan penerimaan dana hibah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data penerimaan dana hibah TA <strong>{itemToDelete.tahun}</strong>? Menghapus data ini akan mengubah saldo awal pada Buku Kas Pembantu (BKP) dan Buku Kas Umum (BKU).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus Data
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
