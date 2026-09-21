/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  HelpCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Info
} from "lucide-react";
import { 
  RABData, 
  RABKomponen, 
  RABItem, 
  ProfilLembaga,
  KOMPONEN_DEFAULT_LIST,
  KOMPONEN_DETAILS,
  KomponenDetail,
  SATUAN_BARANG_SUGGESTIONS,
  SATUAN_VOLUME_SUGGESTIONS
} from "../types";

interface SusunRabViewProps {
  profil: ProfilLembaga;
  initialTahun?: string | null;
  onSaveRab: (rab: RABData) => Promise<boolean>;
  onNavigate: (tab: string, param?: any) => void;
  rabList: RABData[];
}

export default function SusunRabView({ 
  profil, 
  initialTahun, 
  onSaveRab, 
  onNavigate,
  rabList 
}: SusunRabViewProps) {
  // 1. Core RAB Metadata State
  const [tahun, setTahun] = useState(initialTahun || new Date().getFullYear().toString());
  const [sumberDana, setSumberDana] = useState(profil.sumberDanaOptions[0] || "DAU");
  const [paguAnggaran, setPaguAnggaran] = useState<number>(15000000);

  // 2. Initialize Komponen List State
  const [komponenList, setKomponenList] = useState<RABKomponen[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // 3. Rules and deletion state helpers
  const [expandedRules, setExpandedRules] = useState<Record<number, boolean>>({ 0: true });
  const [confirmDeleteCompIdx, setConfirmDeleteCompIdx] = useState<number | null>(null);

  // Load existing RAB if editing, or initialize a clean template
  useEffect(() => {
    const existingRab = rabList.find(r => r.tahun === initialTahun);
    
    if (existingRab) {
      // Edit mode: clone deep to prevent accidental mutations
      setTahun(existingRab.tahun);
      setSumberDana(existingRab.sumberDana);
      setKomponenList(JSON.parse(JSON.stringify(existingRab.komponenList)));
      setPaguAnggaran(existingRab.paguAnggaran || 0);
      
      // Expand first rule by default in edit mode too
      setExpandedRules({ 0: true });
    } else {
      // New mode: start with an empty list so the user can select exactly what components they want to add
      const freshList: RABKomponen[] = [];
      setKomponenList(freshList);
      setPaguAnggaran(15000000); // default pagu
      setExpandedRules({});
      
      // If we are creating a new RAB and there is a year, let's prefill
      if (initialTahun) {
        setTahun(initialTahun);
      } else {
        // Suggest next year that doesn't exist
        const years = rabList.map(r => parseInt(r.tahun)).filter(y => !isNaN(y));
        const nextYear = years.length > 0 ? (Math.max(...years) + 1).toString() : new Date().getFullYear().toString();
        setTahun(nextYear);
      }
    }
  }, [initialTahun, rabList]);

  // Format Currency Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper to generate IDs
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Helper to convert index (0, 1, 2...) to alphabet (a, b, c...)
  const getAlphabetLabel = (index: number): string => {
    let label = "";
    let temp = index;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 97) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  };

  // Add a new empty component block
  const handleAddComponentBlock = () => {
    const existingNames = komponenList.map((c) => c.nama);
    const unusedDetail = KOMPONEN_DETAILS.find((d) => !existingNames.includes(d.nama));
    const defaultNama = unusedDetail ? unusedDetail.nama : KOMPONEN_DETAILS[0].nama;

    const newComponent: RABKomponen = {
      nama: defaultNama,
      items: []
    };
    const newList = [...komponenList, newComponent];
    const newIdx = newList.length - 1;
    setKomponenList(newList);
    // Expand rules for the newly added component
    setExpandedRules((prev) => ({ ...prev, [newIdx]: true }));
    setConfirmDeleteCompIdx(null);
  };

  // Remove a component block
  const handleRemoveComponentBlock = (compIdx: number) => {
    const newList = [...komponenList];
    newList.splice(compIdx, 1);
    setKomponenList(newList);
    setConfirmDeleteCompIdx(null);

    // Re-align expanded rules states
    const newExpanded: Record<number, boolean> = {};
    newList.forEach((_, idx) => {
      newExpanded[idx] = expandedRules[idx] !== undefined ? expandedRules[idx] : false;
    });
    setExpandedRules(newExpanded);
  };

  // Change a component's category type
  const handleChangeComponentCategory = (compIdx: number, newNama: string) => {
    const newList = [...komponenList];
    newList[compIdx].nama = newNama;
    setKomponenList(newList);
  };

  // Add Item Row to Component
  const handleAddItem = (compIndex: number) => {
    const newList = [...komponenList];
    const newItem: RABItem = {
      id: generateId(),
      uraian: "",
      jumlah: 1,
      satuan: "Orang",
      volume: 1,
      satuanVolume: "",
      satuanHarga: 0,
      total: 0
    };
    newList[compIndex].items.push(newItem);
    setKomponenList(newList);
  };

  // Remove Item Row
  const handleRemoveItem = (compIndex: number, itemIndex: number) => {
    const newList = [...komponenList];
    newList[compIndex].items.splice(itemIndex, 1);
    setKomponenList(newList);
  };

  // Update Item Fields & Recompute Totals
  const handleUpdateItem = (
    compIndex: number, 
    itemIndex: number, 
    field: keyof RABItem, 
    value: any
  ) => {
    const newList = [...komponenList];
    const item = newList[compIndex].items[itemIndex];

    // Force default values for 6-column model
    item.jumlah = 1;
    item.satuanVolume = "";

    // Safely update field
    if (field === "jumlah" || field === "volume" || field === "satuanHarga") {
      const numVal = Math.max(0, parseFloat(value) || 0);
      item[field] = numVal as never;
    } else {
      item[field] = value as never;
    }

    // Recalculate Subtotal row total = volume * satuanHarga
    item.total = item.volume * item.satuanHarga;
    
    setKomponenList(newList);
  };

  // Calculate Grand Total Overall
  const calculateGrandTotal = () => {
    return komponenList.reduce((grandSum, komponen) => {
      const compSum = komponen.items.reduce((sum, item) => sum + item.total, 0);
      return grandSum + compSum;
    }, 0);
  };

  // Save/Submit Action
  const handleSave = async () => {
    const currentYearNum = parseInt(tahun);
    if (!tahun || isNaN(currentYearNum) || currentYearNum < 2000 || currentYearNum > 2100) {
      setErrorMessage("Masukkan tahun anggaran yang valid (contoh: 2025).");
      return;
    }

    if (komponenList.length === 0) {
      setErrorMessage("Silakan tambahkan minimal satu komponen belanja sebelum menyimpan.");
      return;
    }

    // Check if saving as a new year, but that year already exists
    if (!initialTahun && rabList.some(r => r.tahun === tahun)) {
      setErrorMessage(`RAB untuk Tahun Anggaran ${tahun} sudah ada. Silakan gunakan menu Edit di tab Arsip jika ingin mengubahnya.`);
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSaveStatus(null);

    const grandTotal = calculateGrandTotal();
    const finalRabData: RABData = {
      tahun: tahun.trim(),
      sumberDana,
      totalAnggaran: grandTotal,
      paguAnggaran,
      komponenList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const success = await onSaveRab(finalRabData);
      if (success) {
        setSaveStatus("success");
        setTimeout(() => {
          setSaveStatus(null);
          onNavigate("arsip");
        }, 1500);
      } else {
        setSaveStatus("error");
        setErrorMessage("Gagal menyimpan data ke database. Coba cek koneksi internet Anda.");
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
      setErrorMessage(err.message || "Terjadi kesalahan sistem saat mencoba menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const grandTotalValue = calculateGrandTotal();

  return (
    <div className="space-y-6 pb-40" id="susun-rab-view-container">
      {/* Header with back */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <button
            onClick={() => onNavigate("arsip")}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Arsip
          </button>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            {initialTahun ? `Edit RAB Tahun Anggaran ${initialTahun}` : "Susun Rencana Anggaran Biaya (RAB)"}
          </h1>
          <p className="text-sm text-slate-500">
            Isi rincian anggaran biaya dengan memilih komponen kegiatan BPPDGS secara fleksibel dan menyusun sub-item secara manual.
          </p>
        </div>
      </div>

      {/* Unified Premium Dashboard Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6" id="rab-metadata-and-balance-panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* LEFT SECTION: Config Inputs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Parameter Anggaran & Lembaga
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tahun Anggaran */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Tahun Anggaran
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  required
                  disabled={!!initialTahun} // Lock year on edit mode
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold disabled:bg-slate-50 disabled:text-slate-500 transition"
                  placeholder="Contoh: 2025"
                />
              </div>

              {/* Sumber Dana */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Sumber Dana
                </label>
                <select
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition bg-white"
                >
                  {profil.sumberDanaOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagu Anggaran Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  Pagu Anggaran
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={paguAnggaran}
                  onChange={(e) => setPaguAnggaran(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-bold text-emerald-900 font-mono transition"
                  placeholder="Contoh: 15000000"
                />
              </div>
            </div>
            {initialTahun && (
              <p className="text-[10px] text-slate-400 italic">Tahun anggaran tidak dapat diubah pada mode pengeditan.</p>
            )}
          </div>

          {/* MIDDLE DIVIDER */}
          <div className="hidden lg:block lg:col-span-1 h-20 flex justify-center items-center">
            <div className="border-l border-slate-200 h-16 mx-auto"></div>
          </div>

          {/* RIGHT SECTION: Real-time Budget Status (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status Real-time</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Kalkulator</span>
            </div>

            <div className="space-y-2">
              {/* Total Belanja */}
              <div className="flex justify-between items-center bg-white px-3.5 py-2.5 rounded-xl border border-slate-150 shadow-2xs">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Belanja</span>
                  <span className="text-[10px] text-slate-500 font-medium">Akumulasi rincian</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-850 font-mono block">
                    {formatIDR(grandTotalValue)}
                  </span>
                </div>
              </div>

              {/* Saldo Keseimbangan */}
              {(() => {
                const saldo = paguAnggaran - grandTotalValue;
                const isOver = saldo < 0;
                return (
                  <div className={`flex justify-between items-center px-3.5 py-2.5 rounded-xl border transition-all shadow-2xs ${
                    isOver ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}>
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider block text-slate-500">Saldo Sisa</span>
                      <span className={`text-[9px] font-bold ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {isOver ? '⚠️ Defisit / Over Pagu' : '✅ Seimbang'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-black font-mono block ${isOver ? 'text-rose-700 animate-pulse' : 'text-emerald-700'}`}>
                        {saldo < 0 ? '-' : ''}{formatIDR(Math.abs(saldo))}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* ADD COMPONENT ACTION SECTION (CLEAN & PROFESSIONAL DROPDOWN SELECTION) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 gap-4 shadow-2xs" id="add-component-clean-action">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Komponen Kegiatan Terpilih</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Pilih komponen kegiatan resmi di sebelah kanan untuk membentuk baris kelompok anggaran Anda secara otomatis.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            id="quick-add-component-select"
            className="w-full md:w-[360px] px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer"
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                // Add the selected component block
                const newComponent: RABKomponen = {
                  nama: val,
                  items: []
                };
                const newList = [...komponenList, newComponent];
                const newIdx = newList.length - 1;
                setKomponenList(newList);
                setExpandedRules((prev) => ({ ...prev, [newIdx]: true }));
                setConfirmDeleteCompIdx(null);
                // Reset select value back to placeholder
                e.target.value = "";
              }
            }}
          >
            <option value="" disabled>-- Pilih Komponen Belanja Baru --</option>
            {KOMPONEN_DETAILS.map((detail) => {
              const isAlreadyAdded = komponenList.some(c => c.nama === detail.nama);
              return (
                <option key={detail.nama} value={detail.nama} disabled={isAlreadyAdded}>
                  {isAlreadyAdded ? `✓ ${detail.label} (Sudah Ada)` : detail.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* COMPONENT SECTIONS */}
      <div className="space-y-8" id="rab-components-container">
        {komponenList.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-4" id="empty-components-state">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Belum Ada Komponen Kegiatan</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Silakan pilih komponen belanja pada menu pilihan di atas untuk membentuk baris kelompok nomor urut 1 dan seterusnya, lalu tambahkan rincian belanja Anda.
              </p>
            </div>
          </div>
        ) : (
          komponenList.map((komponen, compIdx) => {
            const compNo = compIdx + 1;
            const subtotal = komponen.items.reduce((sum, i) => sum + i.total, 0);

            // Get detail rules of selected component category
            const matchedDetail = KOMPONEN_DETAILS.find((d) => 
              d.nama === komponen.nama || 
              d.label.toLowerCase() === komponen.nama.toLowerCase() ||
              (komponen.nama.toLowerCase().includes("honor") && d.id === "honorarium")
            ) || KOMPONEN_DETAILS[0];
            const isRulesExpanded = !!expandedRules[compIdx];

            return (
              <div 
                key={`${komponen.nama}-${compIdx}`} 
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                id={`komponen-card-${compIdx}`}
              >
              {/* Component Card Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-3 items-center flex-1 min-w-0">
                  <span className="flex items-center justify-center bg-emerald-800 text-white font-black rounded-lg w-8 h-8 text-xs shrink-0">
                    {compNo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-1 tracking-tight">
                      {komponen.nama}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Komponen Kegiatan:</span>
                      <select
                        value={komponen.nama}
                        onChange={(e) => handleChangeComponentCategory(compIdx, e.target.value)}
                        className="px-2 py-0.5 rounded border border-slate-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[11px] font-bold text-slate-700 cursor-pointer max-w-[280px] sm:max-w-md truncate"
                      >
                        {KOMPONEN_DETAILS.map((detail) => (
                          <option key={detail.nama} value={detail.nama}>
                            {detail.label}
                          </option>
                        ))}
                        {!KOMPONEN_DETAILS.some(d => d.nama === komponen.nama) && (
                          <option value={komponen.nama}>{komponen.nama}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Actions: Toggle Rules Guide, Add Row, Delete Component */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                  {/* Toggle Rules Guide Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedRules((prev) => ({ ...prev, [compIdx]: !prev[compIdx] }))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Panduan Belanja</span>
                    {isRulesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Add Row Button */}
                  <button
                    type="button"
                    onClick={() => handleAddItem(compIdx)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Rincian Baris
                  </button>

                  {/* Safe Delete Component Button with Confirmation Click State */}
                  {confirmDeleteCompIdx === compIdx ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-rose-700">Yakin hapus?</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveComponentBlock(compIdx)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-2 py-0.5 rounded cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCompIdx(null)}
                        className="text-slate-500 hover:text-slate-700 font-bold text-[10px] px-1 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCompIdx(compIdx)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition cursor-pointer"
                      title="Hapus Kelompok Komponen ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Rules Box (Panduan Belanja) */}
              {isRulesExpanded && (
                <div className="bg-emerald-50/30 border-b border-slate-200/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Aturan Belanja & Deskripsi Komponen</p>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {matchedDetail.deskripsi}
                      </p>
                    </div>
                  </div>

                  {/* Boleh vs Tidak Boleh grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Boleh (Allowed) */}
                    <div className="bg-white/80 border border-emerald-100/80 rounded-lg p-3 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 shrink-0 text-emerald-600" />
                        Boleh Digunakan Untuk:
                      </span>
                      <ul className="list-none space-y-1 text-[11px] text-slate-600 font-medium pl-1">
                        {matchedDetail.boleh.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold select-none">•</span>
                            <span className="leading-tight">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tidak Boleh (Forbidden) */}
                    <div className="bg-white/80 border border-rose-100/80 rounded-lg p-3 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md">
                        <X className="w-3 h-3 shrink-0 text-rose-500" />
                        TIDAK Boleh Digunakan Untuk:
                      </span>
                      <ul className="list-none space-y-1 text-[11px] text-slate-600 font-medium pl-1">
                        {matchedDetail.tidakBoleh.map((tb, tbIdx) => (
                          <li key={tbIdx} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold select-none">•</span>
                            <span className="leading-tight text-slate-800 font-semibold">{tb}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table/Cards */}
              <div className="p-0 sm:p-4">
                {komponen.items.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    Belum ada rincian baris kegiatan. Klik "Tambah Rincian Baris" di atas untuk memulai mengisi anggaran program ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop/Tablet Table Layout */}
                    <table className="w-full text-left border-collapse hidden md:table">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3">Uraian Kegiatan</th>
                          <th className="py-2.5 px-3 text-center w-24">Volume</th>
                          <th className="py-2.5 px-3 text-center w-32">Satuan</th>
                          <th className="py-2.5 px-3 text-right w-44">Harga Satuan (Rp)</th>
                          <th className="py-2.5 px-3 text-right w-48">Jumlah Biaya (Rp)</th>
                          <th className="py-2.5 px-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {komponen.items.map((item, itemIdx) => (
                          <tr key={item.id} className="hover:bg-slate-50/40">
                            {/* Line Number */}
                            <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                              {getAlphabetLabel(itemIdx)}.
                            </td>

                            {/* Uraian */}
                            <td className="py-3 px-2">
                              <input
                                type="text"
                                required
                                value={item.uraian}
                                onChange={(e) => handleUpdateItem(compIdx, itemIdx, "uraian", e.target.value)}
                                placeholder="Misal: Pembelian Buku Teks Pelajaran Fiqih"
                                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs font-semibold"
                              />
                            </td>

                            {/* Volume */}
                            <td className="py-3 px-1">
                              <input
                                type="number"
                                min="0"
                                required
                                value={item.volume || ""}
                                onChange={(e) => handleUpdateItem(compIdx, itemIdx, "volume", e.target.value)}
                                className="w-full px-1.5 py-1.5 rounded-md border border-slate-200 text-center font-mono text-xs outline-none font-bold"
                              />
                            </td>

                            {/* Satuan */}
                            <td className="py-3 px-1 relative">
                              <input
                                type="text"
                                list={`satuan-suggestions-${compIdx}-${itemIdx}`}
                                value={item.satuan}
                                onChange={(e) => handleUpdateItem(compIdx, itemIdx, "satuan", e.target.value)}
                                className="w-full px-1.5 py-1.5 rounded-md border border-slate-200 text-center text-xs outline-none bg-white font-semibold"
                                placeholder="Orang, Buah, dll"
                              />
                              <datalist id={`satuan-suggestions-${compIdx}-${itemIdx}`}>
                                {SATUAN_BARANG_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                              </datalist>
                            </td>

                            {/* Harga Satuan */}
                            <td className="py-3 px-1">
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={item.satuanHarga || ""}
                                  onChange={(e) => handleUpdateItem(compIdx, itemIdx, "satuanHarga", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-right font-mono text-xs outline-none font-bold"
                                  placeholder="Harga Rp"
                                />
                                <div className="text-[10px] text-slate-400 text-right leading-none truncate select-none px-1">
                                  {formatIDR(item.satuanHarga)}
                                </div>
                              </div>
                            </td>

                            {/* Jumlah Biaya / Total */}
                            <td className="py-3 px-3 text-right font-mono font-black text-slate-800 text-xs">
                              {formatIDR(item.total)}
                            </td>

                            {/* Remove action */}
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(compIdx, itemIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Baris"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile/Tablet Card Layout */}
                    <div className="block md:hidden divide-y divide-slate-100 px-4">
                      {komponen.items.map((item, itemIdx) => (
                        <div key={item.id} className="py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              Rincian {getAlphabetLabel(itemIdx)}.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(compIdx, itemIdx)}
                              className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>

                          {/* Mobile Fields */}
                          <div className="space-y-2.5 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Uraian Kegiatan</label>
                              <input
                                type="text"
                                required
                                value={item.uraian}
                                onChange={(e) => handleUpdateItem(compIdx, itemIdx, "uraian", e.target.value)}
                                placeholder="Misal: Honor Bulanan"
                                className="w-full px-2.5 py-2 rounded-md border border-slate-200 outline-none text-xs font-semibold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Volume</label>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={item.volume || ""}
                                  onChange={(e) => handleUpdateItem(compIdx, itemIdx, "volume", e.target.value)}
                                  className="w-full px-2 py-2 rounded-md border border-slate-200 font-mono text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Satuan</label>
                                <input
                                  type="text"
                                  value={item.satuan}
                                  onChange={(e) => handleUpdateItem(compIdx, itemIdx, "satuan", e.target.value)}
                                  className="w-full px-2 py-2 rounded-md border border-slate-200 text-xs font-semibold"
                                  placeholder="Orang"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Harga Satuan (Rp)</label>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={item.satuanHarga || ""}
                                  onChange={(e) => handleUpdateItem(compIdx, itemIdx, "satuanHarga", e.target.value)}
                                  className="w-full px-2 py-2 rounded-md border border-slate-200 font-mono text-xs font-bold"
                                  placeholder="Harga Satuan"
                                />
                                <p className="text-[9px] text-slate-400">{formatIDR(item.satuanHarga)}</p>
                              </div>
                              <div className="space-y-1 text-right">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Biaya</label>
                                <span className="font-mono font-extrabold text-xs text-emerald-800 pt-1 block">{formatIDR(item.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })
      )}
      </div>

      {/* SAVE / METADATA SUMMARY BAR (FIXED BOTTOM AT DESKTOP) */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl px-4 py-4 md:px-8"
        id="save-budget-bottom-bar"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Responsive stats container: grid on mobile, flex row on desktop */}
          <div className="grid grid-cols-3 divide-x divide-slate-150 w-full md:w-auto md:flex md:flex-row md:items-center md:gap-6 md:divide-x-0">
            
            <div className="text-center md:text-left px-1 md:px-0">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">TOTAL BELANJA</p>
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-emerald-800 font-mono leading-none mt-1">
                {formatIDR(grandTotalValue)}
              </h2>
            </div>

            <div className="text-center md:text-left px-1 md:px-0 md:border-l md:border-slate-200 md:pl-6">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">PAGU ANGGARAN</p>
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-700 font-mono leading-none mt-1">
                {formatIDR(paguAnggaran)}
              </h2>
            </div>

            {(() => {
              const saldo = paguAnggaran - grandTotalValue;
              const isOver = saldo < 0;
              return (
                <div className="text-center md:text-left px-1 md:px-0 md:border-l md:border-slate-200 md:pl-6">
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">SALDO SISA</p>
                  <h2 className={`text-sm sm:text-base md:text-lg lg:text-xl font-black font-mono leading-none mt-1 ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {saldo < 0 ? '-' : ''}{formatIDR(Math.abs(saldo))}
                  </h2>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            {errorMessage && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </p>
            )}

            {saveStatus === "success" && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-bounce">
                Selesai Disimpan!
              </span>
            )}

            <button
              onClick={() => onNavigate("arsip")}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Batal
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-400 text-white font-extrabold text-sm px-6 py-2.5 rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer"
              id="btn-save-rab"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan RAB {tahun ? `TA ${tahun}` : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
