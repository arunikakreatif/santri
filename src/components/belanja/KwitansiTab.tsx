/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Search, 
  FileText, 
  Receipt, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  ShoppingBag,
  Building2,
  Sparkles,
  RefreshCw,
  X,
  Zap
} from "lucide-react";
import { 
  Kwitansi, 
  KwitansiItemRealisasi, 
  ProfilLembaga, 
  RABData, 
  RABItemWithBudget 
} from "../../types";
import { 
  generateNextNomorKwitansi, 
  saveKwitansi, 
  deleteKwitansi,
  getRabItemsWithBudget,
  generateId
} from "../../services/db";
import { generateTerbilangRupiah } from "../../utils/terbilang";
import KwitansiPrintModal from "./KwitansiPrintModal";

interface VolumePreset {
  label: string;
  volume: number;
  nominal: number;
}

const getVolumePresets = (matchedRab: RABItemWithBudget | undefined): VolumePreset[] => {
  if (!matchedRab || matchedRab.sisa_anggaran <= 0) return [];
  
  const harga = matchedRab.satuanHarga || 0;
  const sisaNominal = matchedRab.sisa_anggaran;
  const satuan = matchedRab.satuanVolume || matchedRab.satuan || "Unit";
  
  if (harga <= 0) {
    return [
      { label: `1 ${satuan} (Sisa Penuh: Rp ${sisaNominal.toLocaleString("id-ID")})`, volume: 1, nominal: sisaNominal }
    ];
  }
  
  const maxVol = Math.max(1, Math.round(sisaNominal / harga));
  const presetsMap = new Map<number, VolumePreset>();
  
  // Jika maxVol <= 36 (misal 12 bulan honor guru, 20 pak ATK, 6 bulan listrik, dsb), buatkan pilihan setiap volume 1 s.d maxVol
  if (maxVol <= 36) {
    for (let v = 1; v <= maxVol; v++) {
      const nom = v === maxVol ? sisaNominal : Math.min(sisaNominal, Math.round(v * harga));
      presetsMap.set(v, {
        label: `${v} ${satuan} → Rp ${nom.toLocaleString("id-ID")}${v === maxVol ? " (Penuh/Sisa)" : ""}`,
        volume: v,
        nominal: nom
      });
    }
  } else {
    // Untuk volume besar (> 36)
    const baseSteps = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100].filter(s => s < maxVol);
    baseSteps.forEach(v => {
      const nom = Math.min(sisaNominal, Math.round(v * harga));
      presetsMap.set(v, {
        label: `${v} ${satuan} → Rp ${nom.toLocaleString("id-ID")}`,
        volume: v,
        nominal: nom
      });
    });
    // Persentase 25%, 50%, 75%
    [0.25, 0.5, 0.75].forEach(pct => {
      const v = Math.round(maxVol * pct);
      if (v >= 1 && v < maxVol) {
        const nom = Math.min(sisaNominal, Math.round(v * harga));
        presetsMap.set(v, {
          label: `${v} ${satuan} (${Math.round(pct * 100)}%) → Rp ${nom.toLocaleString("id-ID")}`,
          volume: v,
          nominal: nom
        });
      }
    });
    // Selalu sertakan volume sisa penuh
    presetsMap.set(maxVol, {
      label: `${maxVol} ${satuan} → Rp ${sisaNominal.toLocaleString("id-ID")} (Penuh/Sisa)`,
      volume: maxVol,
      nominal: sisaNominal
    });
  }
  
  return Array.from(presetsMap.values()).sort((a, b) => a.volume - b.volume);
};

interface KwitansiTabProps {
  profil: ProfilLembaga;
  kwitansiList: Kwitansi[];
  activeRab: RABData | null;
  selectedTahun: string;
  onRefresh: () => void;
}

export default function KwitansiTab({
  profil,
  kwitansiList,
  activeRab,
  selectedTahun,
  onRefresh
}: KwitansiTabProps) {
  // Search & filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterSumberDana, setFilterSumberDana] = useState<string>("ALL");

  // Print modal state
  const [activePrintKwitansi, setActivePrintKwitansi] = useState<Kwitansi | null>(null);

  // Form modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [nomorKwitansi, setNomorKwitansi] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sumberDana, setSumberDana] = useState<string>("DAU");
  const [telahTerimaDari, setTelahTerimaDari] = useState<string>(`Bendahara ${profil.namaLembaga}`);
  const [penerima, setPenerima] = useState<string>("");
  const [uraianPembayaran, setUraianPembayaran] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<KwitansiItemRealisasi[]>([]);
  const [namaKepala, setNamaKepala] = useState<string>(profil.namaKepala || "");
  const [namaBendahara, setNamaBendahara] = useState<string>(profil.namaBendahara || "");
  const [namaPenerima, setNamaPenerima] = useState<string>("");

  // Error & Status
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<Kwitansi | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Compute RAB items with budget usage
  const rabItemsWithBudget: RABItemWithBudget[] = useMemo(() => {
    if (!activeRab) return [];
    // Exclude current kwitansi items if editing so its own budget doesn't count against itself
    const filteredKwitansi = editingId 
      ? kwitansiList.filter(k => k.id !== editingId)
      : kwitansiList;
    return getRabItemsWithBudget(activeRab, filteredKwitansi);
  }, [activeRab, kwitansiList, editingId]);

  // Compute Total
  const totalJumlah = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (Number(item.jumlahRealisasi) || 0), 0);
  }, [selectedItems]);

  // Compute Terbilang
  const terbilangText = useMemo(() => {
    return generateTerbilangRupiah(totalJumlah);
  }, [totalJumlah]);

  // Auto-generate Uraian Pembayaran when items change (if user hasn't heavily customized or if creating)
  useEffect(() => {
    if (!editingId && selectedItems.length > 0) {
      const descriptions = selectedItems
        .filter(it => it.uraianItem.trim())
        .map(it => it.uraianItem.trim());
      if (descriptions.length > 0) {
        setUraianPembayaran(`Pembayaran ${descriptions.join(", ")}`);
      }
    }
  }, [selectedItems, editingId]);

  // Auto-fill default nomor kwitansi when modal opens or sumber dana changes
  const updateAutoNomor = (targetSumber: string) => {
    if (!editingId) {
      const nextNo = generateNextNomorKwitansi(profil.id || "madin-baiturrohman", selectedTahun, targetSumber);
      setNomorKwitansi(nextNo);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormError(null);
    const initialSumber = profil.sumberDanaOptions?.[0] || "DAU";
    setSumberDana(initialSumber);
    setTanggal(new Date().toISOString().split("T")[0]);
    setTelahTerimaDari(`Bendahara ${profil.namaLembaga}`);
    setPenerima("");
    setUraianPembayaran("");
    setSelectedItems([]);
    setNamaKepala(profil.namaKepala || "");
    setNamaBendahara(profil.namaBendahara || "");
    setNamaPenerima("");

    const nextNo = generateNextNomorKwitansi(profil.id || "madin-baiturrohman", selectedTahun, initialSumber);
    setNomorKwitansi(nextNo);
    setShowModal(true);
  };

  const openEditModal = (kw: Kwitansi) => {
    setEditingId(kw.id);
    setFormError(null);
    setNomorKwitansi(kw.nomorKwitansi);
    setTanggal(kw.tanggal);
    setSumberDana(kw.sumberDana);
    setTelahTerimaDari(kw.telahTerimaDari);
    setPenerima(kw.penerima);
    setUraianPembayaran(kw.uraianPembayaran);

    // Enrich items with volume & price if previously omitted
    const enrichedItems: KwitansiItemRealisasi[] = (kw.items || []).map(it => {
      const matched = rabItemsWithBudget.find(r => r.id === it.rabItemId);
      const harga = it.hargaSatuan || matched?.satuanHarga || 0;
      const satuan = it.satuanRealisasi || matched?.satuanVolume || matched?.satuan || "Unit";
      const vol = it.volumeRealisasi !== undefined && it.volumeRealisasi > 0
        ? it.volumeRealisasi
        : (harga > 0 ? Math.round(it.jumlahRealisasi / harga) : (matched?.volume || 1));
      return {
        ...it,
        volumeRealisasi: vol,
        satuanRealisasi: satuan,
        hargaSatuan: harga
      };
    });
    setSelectedItems(enrichedItems);

    setNamaKepala(kw.namaKepala || profil.namaKepala || "");
    setNamaBendahara(kw.namaBendahara || profil.namaBendahara || "");
    setNamaPenerima(kw.namaPenerima || kw.penerima || "");
    setShowModal(true);
  };

  // Add Item to repeater
  const handleAddItem = () => {
    if (rabItemsWithBudget.length === 0) {
      alert("Belum ada data item RAB yang tersedia untuk tahun ini. Susun RAB terlebih dahulu di menu Susun RAB.");
      return;
    }

    // Default to first available item with budget > 0 if possible
    const available = rabItemsWithBudget.find(it => it.sisa_anggaran > 0) || rabItemsWithBudget[0];
    const sisaVol = available.satuanHarga > 0 
      ? Math.max(1, Math.round(available.sisa_anggaran / available.satuanHarga))
      : (available.volume || 1);
    const satuanStr = available.satuanVolume || available.satuan || "Unit";

    const newItem: KwitansiItemRealisasi = {
      id: generateId(),
      rabItemId: available.id,
      uraianItem: available.uraian,
      jumlahRealisasi: available.sisa_anggaran > 0 ? available.sisa_anggaran : 0,
      volumeRealisasi: available.sisa_anggaran > 0 ? sisaVol : 0,
      satuanRealisasi: satuanStr,
      hargaSatuan: available.satuanHarga
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleItemRabChange = (index: number, rabItemId: string) => {
    const matchedRab = rabItemsWithBudget.find(r => r.id === rabItemId);
    if (!matchedRab) return;

    const sisaVol = matchedRab.satuanHarga > 0 
      ? Math.max(1, Math.round(matchedRab.sisa_anggaran / matchedRab.satuanHarga))
      : (matchedRab.volume || 1);
    const satuanStr = matchedRab.satuanVolume || matchedRab.satuan || "Unit";

    const updated = [...selectedItems];
    updated[index] = {
      ...updated[index],
      rabItemId: matchedRab.id,
      uraianItem: matchedRab.uraian,
      jumlahRealisasi: matchedRab.sisa_anggaran > 0 ? matchedRab.sisa_anggaran : 0,
      volumeRealisasi: matchedRab.sisa_anggaran > 0 ? sisaVol : 0,
      satuanRealisasi: satuanStr,
      hargaSatuan: matchedRab.satuanHarga
    };
    setSelectedItems(updated);
  };

  const handleItemVolumeChange = (index: number, newVol: number) => {
    const item = selectedItems[index];
    const matchedRab = rabItemsWithBudget.find(r => r.id === item.rabItemId);
    const updated = [...selectedItems];
    const safeVol = Math.max(0, newVol);
    
    let calculatedNominal = item.jumlahRealisasi;
    if (matchedRab && matchedRab.satuanHarga > 0) {
      calculatedNominal = Math.min(matchedRab.sisa_anggaran, Math.round(safeVol * matchedRab.satuanHarga));
    }
    
    updated[index] = {
      ...updated[index],
      volumeRealisasi: safeVol,
      jumlahRealisasi: calculatedNominal,
      hargaSatuan: matchedRab?.satuanHarga || updated[index].hargaSatuan
    };
    setSelectedItems(updated);
  };

  const handleItemPresetSelect = (index: number, vol: number, nominal: number) => {
    const updated = [...selectedItems];
    updated[index] = {
      ...updated[index],
      volumeRealisasi: vol,
      jumlahRealisasi: nominal
    };
    setSelectedItems(updated);
  };

  const handleItemRealisasiChange = (index: number, nominal: number) => {
    const item = selectedItems[index];
    const matchedRab = rabItemsWithBudget.find(r => r.id === item.rabItemId);
    const updated = [...selectedItems];
    const harga = matchedRab?.satuanHarga || item.hargaSatuan || 0;
    
    updated[index] = {
      ...updated[index],
      jumlahRealisasi: nominal,
      volumeRealisasi: harga > 0 ? Math.round((nominal / harga) * 100) / 100 : item.volumeRealisasi
    };
    setSelectedItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedItems.length === 0) {
      setFormError("Pilih minimal 1 item belanja RAB.");
      return;
    }

    if (totalJumlah <= 0) {
      setFormError("Total realisasi belanja harus lebih dari Rp 0.");
      return;
    }

    if (!penerima.trim()) {
      setFormError("Nama penerima / pihak ketiga (toko / guru) wajib diisi.");
      return;
    }

    // Validasi ketat: jumlah realisasi TIDAK BOLEH melebihi sisa anggaran
    for (let i = 0; i < selectedItems.length; i++) {
      const it = selectedItems[i];
      const rabBudget = rabItemsWithBudget.find(r => r.id === it.rabItemId);
      if (rabBudget) {
        if (it.jumlahRealisasi > rabBudget.sisa_anggaran) {
          setFormError(
            `Item "${it.uraianItem}" melebihi sisa anggaran! Sisa anggaran hanya Rp ${rabBudget.sisa_anggaran.toLocaleString("id-ID")}, namun input realisasi Rp ${it.jumlahRealisasi.toLocaleString("id-ID")}.`
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload: Kwitansi = {
        id: editingId || "",
        madinId: profil.id || "madin-baiturrohman",
        tahun: selectedTahun,
        nomorKwitansi: nomorKwitansi.trim(),
        sumberDana,
        tanggal,
        telahTerimaDari: telahTerimaDari.trim(),
        penerima: penerima.trim(),
        items: selectedItems,
        totalJumlah,
        uraianPembayaran: uraianPembayaran.trim() || `Pembayaran realisasi ${nomorKwitansi}`,
        terbilang: terbilangText,
        namaKepala: namaKepala.trim() || profil.namaKepala,
        namaBendahara: namaBendahara.trim() || profil.namaBendahara,
        namaPenerima: namaPenerima.trim() || penerima.trim(),
        createdAt: new Date().toISOString()
      };

      const result = await saveKwitansi(payload);
      if (result.success) {
        setShowModal(false);
        onRefresh();
      } else {
        setFormError(result.message || "Gagal menyimpan data kwitansi.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan sistem saat menyimpan kwitansi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (kw: Kwitansi) => {
    setDeleteError(null);
    setItemToDelete(kw);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteKwitansi(itemToDelete.id);
      setItemToDelete(null);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err?.message || "Terjadi kesalahan saat menghapus data kwitansi.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter list
  const filteredList = kwitansiList.filter(k => {
    const matchSearch = 
      k.nomorKwitansi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.penerima.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.uraianPembayaran.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSumber = filterSumberDana === "ALL" || k.sumberDana === filterSumberDana;
    return matchSearch && matchSumber;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Search, Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor kwitansi, penerima, atau uraian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={filterSumberDana}
            onChange={(e) => setFilterSumberDana(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">Semua Sumber Dana</option>
            {(profil.sumberDanaOptions || ["DAU", "BKK"]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Kwitansi Belanja Baru
        </button>
      </div>

      {/* Kwitansi Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Daftar Kwitansi Belanja TA {selectedTahun} ({profil.namaLembaga})
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filteredList.length} Transaksi Tercatat
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Belum Ada Kwitansi Belanja</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik tombol "Buat Kwitansi Belanja Baru" untuk merealisasikan belanja sesuai pos anggaran RAB.
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Kwitansi Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4">No. Kwitansi</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Sumber Dana</th>
                  <th className="p-4">Diberikan Kepada (Penerima)</th>
                  <th className="p-4">Uraian Pembayaran</th>
                  <th className="p-4 text-right">Jumlah Total</th>
                  <th className="p-4 text-center">Aksi & Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50/75 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/80">
                        {kw.nomorKwitansi}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {new Date(kw.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {kw.sumberDana}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {kw.penerima}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {kw.uraianPembayaran}
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 text-sm">
                      Rp {kw.totalJumlah.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setActivePrintKwitansi(kw)}
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg font-bold transition shadow-xs cursor-pointer"
                          title="Cetak Kwitansi Format Resmi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>
                        <button
                          onClick={() => openEditModal(kw)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Kwitansi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(kw)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Hapus Kwitansi"
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

      {/* MODAL FORM KWITANSI BELANJA BARU / EDIT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-5 border border-slate-200 shadow-2xl space-y-3 my-auto animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {editingId ? "Edit Kwitansi Belanja" : "Form Kwitansi Belanja Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {profil.namaLembaga} • TA {selectedTahun}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              
              {/* Row 1: Nomor, Tanggal, Sumber Dana */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                
                {/* Nomor Kwitansi */}
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Nomor Kwitansi *</label>
                  <input
                    type="text"
                    value={nomorKwitansi}
                    onChange={(e) => setNomorKwitansi(e.target.value)}
                    className="w-full font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Contoh: 01/DAU/2026"
                    required
                  />
                </div>

                {/* Tanggal Transaksi */}
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                {/* Sumber Dana */}
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Sumber Dana *</label>
                  <select
                    value={sumberDana}
                    onChange={(e) => {
                      setSumberDana(e.target.value);
                      updateAutoNomor(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {(profil.sumberDanaOptions || ["DAU", "BKK"]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="BOS Diniyah">BOS Diniyah</option>
                  </select>
                </div>

              </div>

              {/* Row 2: Telah Terima Dari & Diberikan Kepada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Telah Terima Dari *</label>
                  <input
                    type="text"
                    value={telahTerimaDari}
                    onChange={(e) => setTelahTerimaDari(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Diberikan Kepada (Penerima / Toko / Guru) *</label>
                  <input
                    type="text"
                    value={penerima}
                    onChange={(e) => setPenerima(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Contoh: Toko Buku Makmur / Ust. Ahmad Fauzi"
                    required
                  />
                </div>
              </div>

              {/* SECTION: ITEM-ITEM RAB REPEATER */}
              <div className="space-y-2 border-t border-b border-slate-200/80 py-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Pos Realisasi Belanja dari RAB
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Pos Belanja
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="bg-slate-50 py-2.5 px-3 rounded-xl border border-dashed border-slate-300 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Belum ada item belanja dipilih dari RAB</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Pilih Item RAB
                    </button>
                  </div>
                ) : (
                  <div className="max-h-60 sm:max-h-72 overflow-y-auto space-y-2 pr-1">
                    {selectedItems.map((item, index) => {
                      const matchedBudget = rabItemsWithBudget.find(r => r.id === item.rabItemId);
                      const isOverBudget = matchedBudget && item.jumlahRealisasi > matchedBudget.sisa_anggaran;
                      const presets = getVolumePresets(matchedBudget);
                      const satuanName = item.satuanRealisasi || matchedBudget?.satuanVolume || matchedBudget?.satuan || "Unit";

                      return (
                        <div 
                          key={item.id || index}
                          className={`p-2.5 sm:p-3 rounded-xl border transition ${
                            isOverBudget ? "bg-red-50/70 border-red-300" : "bg-slate-50/90 border-slate-200"
                          }`}
                        >
                          {/* Baris 1: Pilih Pos RAB & Uraian Belanja & Tombol Hapus */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                            
                            {/* Pilih Pos RAB */}
                            <div className="md:col-span-6">
                              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                                Pos Anggaran RAB:
                              </label>
                              <select
                                value={item.rabItemId}
                                onChange={(e) => handleItemRabChange(index, e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 truncate"
                              >
                                {rabItemsWithBudget.map((rabItem) => (
                                  <option key={rabItem.id} value={rabItem.id}>
                                    {rabItem.uraian} [Vol: {rabItem.volume} {rabItem.satuanVolume || rabItem.satuan}] (Sisa: Rp {rabItem.sisa_anggaran.toLocaleString("id-ID")})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Uraian Spesifik Kwitansi */}
                            <div className="md:col-span-5">
                              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                                Uraian Spesifik Belanja:
                              </label>
                              <input
                                type="text"
                                value={item.uraianItem}
                                onChange={(e) => {
                                  const updated = [...selectedItems];
                                  updated[index].uraianItem = e.target.value;
                                  setSelectedItems(updated);
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                placeholder="Keterangan item belanja..."
                              />
                            </div>

                            {/* Delete button */}
                            <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-4">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Hapus Pos Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                          </div>

                          {/* Info Volume Item yang Dipilih dari Pos RAB */}
                          {matchedBudget && (
                            <div className="mt-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                  Volume RAB
                                </span>
                                <span className="font-bold text-emerald-950">
                                  {matchedBudget.volume} {satuanName}
                                </span>
                                {matchedBudget.satuanHarga > 0 && (
                                  <span className="text-slate-500 font-medium">
                                    @ Rp {matchedBudget.satuanHarga.toLocaleString("id-ID")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-600">Sisa Tersedia:</span>
                                <span className="font-bold text-emerald-800">
                                  {matchedBudget.satuanHarga > 0 
                                    ? Math.max(0, Math.round(matchedBudget.sisa_anggaran / matchedBudget.satuanHarga)) 
                                    : matchedBudget.volume} {satuanName} (Rp {matchedBudget.sisa_anggaran.toLocaleString("id-ID")})
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Bagian: Tinggal Pilih Volume & Angka Jumlah Belanja */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <label className="text-[11px] font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span>Pilihan Volume Belanja (Tinggal Pilih):</span>
                              </label>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Pilih volume di bawah, angka belanja otomatis terisi tanpa ketik manual
                              </span>
                            </div>

                            {/* Dropdown & Quick Selection Chips */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                              {/* Dropdown Pilihan Volume & Nominal */}
                              <div className="md:col-span-6">
                                <select
                                  value={presets.some(p => p.volume === item.volumeRealisasi && p.nominal === item.jumlahRealisasi) 
                                    ? `${item.volumeRealisasi}_${item.jumlahRealisasi}` 
                                    : (presets.some(p => p.nominal === item.jumlahRealisasi) 
                                        ? `${presets.find(p => p.nominal === item.jumlahRealisasi)?.volume}_${item.jumlahRealisasi}` 
                                        : "")}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    if (val.includes("_")) {
                                      const [vStr, nStr] = val.split("_");
                                      handleItemPresetSelect(index, Number(vStr), Number(nStr));
                                    }
                                  }}
                                  className="w-full bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-xs"
                                >
                                  <option value="">-- Pilih Volume & Jumlah Belanja --</option>
                                  {presets.map((p, pIdx) => (
                                    <option key={pIdx} value={`${p.volume}_${p.nominal}`}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Tombol Pilihan Cepat (Chips) untuk 1-Klik */}
                              <div className="md:col-span-6 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                                {presets.slice(0, 5).map((p, pIdx) => {
                                  const isSelected = item.volumeRealisasi === p.volume && item.jumlahRealisasi === p.nominal;
                                  return (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => handleItemPresetSelect(index, p.volume, p.nominal)}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                                        isSelected
                                          ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                                          : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                                      }`}
                                      title={`Pilih ${p.volume} ${satuanName} = Rp ${p.nominal.toLocaleString("id-ID")}`}
                                    >
                                      {p.volume} {satuanName}
                                    </button>
                                  );
                                })}
                                {presets.length > 5 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const last = presets[presets.length - 1];
                                      handleItemPresetSelect(index, last.volume, last.nominal);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                                      item.volumeRealisasi === presets[presets.length - 1].volume
                                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                                        : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                                    }`}
                                    title="Pilih Volume Sisa Maksimal"
                                  >
                                    Penuh ({presets[presets.length - 1].volume})
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Baris Rincian Volume & Angka Jumlah Belanja */}
                            <div className="bg-white p-2 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              <div className="sm:col-span-5 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Volume:
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={item.volumeRealisasi !== undefined && item.volumeRealisasi > 0 ? item.volumeRealisasi : ""}
                                  onChange={(e) => handleItemVolumeChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                  placeholder="Vol"
                                />
                                <span className="text-xs font-bold text-slate-700">
                                  {satuanName}
                                </span>
                              </div>

                              <div className="sm:col-span-7 flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                                  Angka Jumlah Belanja:
                                </span>
                                <div className="relative w-44">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                                    Rp
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={item.jumlahRealisasi || ""}
                                    onChange={(e) => handleItemRealisasiChange(index, Number(e.target.value))}
                                    className="w-full bg-emerald-50/50 border border-emerald-400 rounded-lg pl-8 pr-2.5 py-1 text-xs font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                                    placeholder="0"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Budget status info bar */}
                          {matchedBudget && (
                            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex flex-wrap items-center justify-between text-[11px] gap-1">
                              <span className="text-slate-500">
                                Anggaran Penuh: <strong>{matchedBudget.volume} {matchedBudget.satuanVolume || matchedBudget.satuan}</strong> @ Rp {matchedBudget.satuanHarga.toLocaleString("id-ID")}
                                {" "}(Total Rp {matchedBudget.jumlah_anggaran.toLocaleString("id-ID")})
                              </span>
                              <span className={isOverBudget ? "text-red-700 font-bold" : "text-emerald-700 font-semibold"}>
                                Sisa Anggaran: Rp {matchedBudget.sisa_anggaran.toLocaleString("id-ID")}
                                {isOverBudget && " (Melebihi Sisa!)"}
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total & Terbilang Preview Box */}
              <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide">
                      Total Kwitansi:
                    </span>
                    <span className="text-sm font-black text-emerald-900">
                      Rp {totalJumlah.toLocaleString("id-ID")},-
                    </span>
                  </div>
                  <p className="text-[11px] italic text-emerald-800 font-medium truncate">
                    # {terbilangText} #
                  </p>
                </div>
              </div>

              {/* Untuk Pembayaran (Editable text) */}
              <div className="space-y-0.5">
                <label className="font-bold text-slate-700 text-[11px]">Untuk Pembayaran (Teks Kwitansi) *</label>
                <input
                  type="text"
                  value={uraianPembayaran}
                  onChange={(e) => setUraianPembayaran(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Contoh: Pembayaran Honorarium Ustadz Bulan Januari 2026"
                  required
                />
              </div>

              {/* Tanda Tangan Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-0.5">
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Kepala Madin</label>
                  <input
                    type="text"
                    value={namaKepala}
                    onChange={(e) => setNamaKepala(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Bendahara Madin</label>
                  <input
                    type="text"
                    value={namaBendahara}
                    onChange={(e) => setNamaBendahara(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-700 text-[11px]">Nama Terang Penerima Uang</label>
                  <input
                    type="text"
                    value={namaPenerima}
                    onChange={(e) => setNamaPenerima(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Nama jelas penerima"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-100">
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
                  {saving ? "Menyimpan Kwitansi..." : (editingId ? "Perbarui Kwitansi" : "Simpan & Terbitkan Kwitansi")}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Kwitansi Print Modal */}
      {activePrintKwitansi && (
        <KwitansiPrintModal
          kwitansi={activePrintKwitansi}
          profil={profil}
          onClose={() => setActivePrintKwitansi(null)}
        />
      )}

      {/* MODAL KONFIRMASI HAPUS KWITANSI */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Kwitansi Belanja</h3>
                  <p className="text-xs text-slate-500">Konfirmasi pembatalan/penghapusan transaksi</p>
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

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nomor Kwitansi:</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {itemToDelete.nomorKwitansi}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Diberikan Kepada:</span>
                <span className="font-bold text-slate-800">{itemToDelete.penerima}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sumber Dana:</span>
                <span className="font-semibold text-slate-700">{itemToDelete.sumberDana}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Total Jumlah:</span>
                <span className="font-black text-sm text-rose-600">
                  Rp {itemToDelete.totalJumlah.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus kwitansi belanja ini? Data di <strong>Buku Kas Pembantu (BKP)</strong>, <strong>Buku Kas Umum (BKU)</strong>, serta sisa anggaran di pos belanja RAB akan otomatis dikembalikan.
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
                    Ya, Hapus Kwitansi
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
