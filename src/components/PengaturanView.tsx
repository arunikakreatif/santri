/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Building, 
  User, 
  MapPin, 
  Plus, 
  Trash, 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Copy, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Image as ImageIcon,
  ExternalLink,
  Code,
  Download,
  Upload,
  Link,
  ShieldCheck,
  Calendar,
  KeyRound,
  Layers,
  Globe
} from "lucide-react";
import { ProfilLembaga } from "../types";
import { APPS_SCRIPT_CODE, STEP_BY_STEP_GUIDE, SHEET_STRUCTURE_DOC } from "../services/appsScriptTemplate";
import { MASTER_REGISTRY_APPS_SCRIPT } from "../services/masterRegistryScript";
import { getMasterRegistryUrl, setMasterRegistryUrl } from "../services/tenantService";
import { 
  testGoogleSheetsConnection, 
  setAppsScriptUrl, 
  getAppsScriptUrl, 
  isValidAppsScriptUrl,
  getProfil,
  syncAllDataFromSheets,
  isSheetsConnected,
  cleanKabupatenName
} from "../services/db";

interface PengaturanViewProps {
  profil: ProfilLembaga;
  onSaveProfil: (profil: ProfilLembaga) => Promise<boolean>;
  onRefreshAllData: () => Promise<void>;
}

export default function PengaturanView({ 
  profil, 
  onSaveProfil,
  onRefreshAllData
}: PengaturanViewProps) {
  // Navigation tab: 'profil' | 'database' | 'multitenant'
  const [activeTab, setActiveTab] = useState<"profil" | "database" | "multitenant">("profil");

  // Local state for profile form
  const [namaLembaga, setNamaLembaga] = useState(profil.namaLembaga);
  const [nsm, setNsm] = useState(profil.nsm);
  const [alamat, setAlamat] = useState(profil.alamat);
  const [desa, setDesa] = useState(profil.desa || "");
  const [kecamatan, setKecamatan] = useState(profil.kecamatan || "");
  const [kabupaten, setKabupaten] = useState(cleanKabupatenName(profil.kabupaten || ""));
  const [logo, setLogo] = useState(profil.logo);
  const [namaKepala, setNamaKepala] = useState(profil.namaKepala);
  const [nipKepala, setNipKepala] = useState(profil.nipKepala || "");
  const [namaBendahara, setNamaBendahara] = useState(profil.namaBendahara || "");
  const [nipBendahara, setNipBendahara] = useState(profil.nipBendahara || "");
  const [kotaTanggal, setKotaTanggal] = useState(profil.kotaTanggal || "");
  const [sumberDanaOptions, setSumberDanaOptions] = useState<string[]>(profil.sumberDanaOptions || ["DAU", "BKK"]);
  const [newSumberDana, setNewSumberDana] = useState("");
  const [showUrlLogoInput, setShowUrlLogoInput] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setNamaLembaga(profil.namaLembaga);
    setNsm(profil.nsm);
    setAlamat(profil.alamat);
    setDesa(profil.desa || "");
    setKecamatan(profil.kecamatan || "");
    setKabupaten(cleanKabupatenName(profil.kabupaten || ""));
    setLogo(profil.logo);
    setNamaKepala(profil.namaKepala);
    setNipKepala(profil.nipKepala || "");
    setNamaBendahara(profil.namaBendahara || "");
    setNipBendahara(profil.nipBendahara || "");
    setKotaTanggal(profil.kotaTanggal || "");
    setSumberDanaOptions(profil.sumberDanaOptions || ["DAU", "BKK"]);
  }, [profil]);

  // Apps Script integration state
  const [appsScriptUrl, setLocalAppsScriptUrl] = useState(getAppsScriptUrl());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sheets?: string[] } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sheets Sync state
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Master Registry state (Pengembang)
  const [masterUrl, setMasterUrl] = useState(getMasterRegistryUrl());
  const [testingMaster, setTestingMaster] = useState(false);
  const [masterTestResult, setMasterTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [masterCopied, setMasterCopied] = useState(false);
  const [showMasterCode, setShowMasterCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConnected = isSheetsConnected();

  // Pull All Data from Sheets Handler
  const handleSyncFromSheets = async () => {
    setSyncingSheets(true);
    setSyncMessage(null);
    try {
      const res = await syncAllDataFromSheets();
      if (res.success) {
        await onRefreshAllData();
        const fresh = await getProfil(true);
        setNamaLembaga(fresh.namaLembaga);
        setNsm(fresh.nsm);
        setAlamat(fresh.alamat);
        setDesa(fresh.desa || "");
        setKecamatan(fresh.kecamatan || "");
        setKabupaten(fresh.kabupaten || "");
        setLogo(fresh.logo);
        setNamaKepala(fresh.namaKepala);
        setNipKepala(fresh.nipKepala || "");
        setNamaBendahara(fresh.namaBendahara || "");
        setNipBendahara(fresh.nipBendahara || "");
        setKotaTanggal(fresh.kotaTanggal);
        setSumberDanaOptions(fresh.sumberDanaOptions || ["DAU", "BKK"]);
        setSyncMessage({ success: true, text: res.message });
      } else {
        setSyncMessage({ success: false, text: res.message });
      }
    } catch (e: any) {
      setSyncMessage({ success: false, text: e?.message || "Gagal sinkronisasi data dari Google Sheets." });
    } finally {
      setSyncingSheets(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Handle Logo Upload to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file logo maksimal 2MB agar penyimpanan tetap efisien.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add source of funds
  const handleAddSumberDana = () => {
    const trimmed = newSumberDana.trim().toUpperCase();
    if (trimmed && !sumberDanaOptions.includes(trimmed)) {
      setSumberDanaOptions([...sumberDanaOptions, trimmed]);
      setNewSumberDana("");
    }
  };

  // Remove source of funds
  const handleRemoveSumberDana = (item: string) => {
    setSumberDanaOptions(sumberDanaOptions.filter(x => x !== item));
  };

  // Save Profil Action
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfil(true);
    setSaveStatus(null);

    // Save and normalize Apps Script URL
    setAppsScriptUrl(appsScriptUrl);
    const normalizedUrl = getAppsScriptUrl();
    if (normalizedUrl && normalizedUrl !== appsScriptUrl) {
      setLocalAppsScriptUrl(normalizedUrl);
    }

    // Save Master Registry URL (Pengembang)
    setMasterRegistryUrl(masterUrl);

    const updatedProfil: ProfilLembaga = {
      namaLembaga: namaLembaga.trim(),
      nsm: nsm.trim(),
      alamat: alamat.trim(),
      desa: desa.trim(),
      kecamatan: kecamatan.trim(),
      kabupaten: cleanKabupatenName(kabupaten.trim()),
      logo,
      namaKepala: namaKepala.trim(),
      nipKepala: nipKepala.trim(),
      namaBendahara: namaBendahara.trim(),
      nipBendahara: nipBendahara.trim(),
      kotaTanggal: kotaTanggal.trim(),
      sumberDanaOptions: sumberDanaOptions.length > 0 ? sumberDanaOptions : ["DAU", "BKK"]
    };

    try {
      const success = await onSaveProfil(updatedProfil);
      if (success) {
        setSaveStatus("success");
        if (isValidAppsScriptUrl(appsScriptUrl)) {
          await onRefreshAllData();
        }
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err: any) {
      console.warn("Gagal menyimpan profil:", err);
      setSaveStatus("error");
    } finally {
      setSavingProfil(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    if (!appsScriptUrl || !appsScriptUrl.trim()) {
      setTestResult({ success: false, message: "Masukkan URL Apps Script Web App terlebih dahulu." });
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testGoogleSheetsConnection(appsScriptUrl);
      setTestResult(res);
      if (res.success) {
        setAppsScriptUrl(appsScriptUrl);
        const norm = getAppsScriptUrl();
        if (norm) {
          setLocalAppsScriptUrl(norm);
        }
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "Gagal menghubungi server Apps Script." });
    } finally {
      setTestingConnection(false);
    }
  };

  // Copy Apps Script Code to Clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Test Master Registry Connection (Pengembang)
  const handleTestMaster = async () => {
    if (!masterUrl || !masterUrl.trim()) {
      setMasterTestResult({ success: false, message: "Masukkan URL Master Registry terlebih dahulu." });
      return;
    }
    setTestingMaster(true);
    setMasterTestResult(null);
    try {
      const resp = await fetch(`${masterUrl.trim()}${masterUrl.includes("?") ? "&" : "?"}action=ping`);
      if (resp.ok) {
        const json = await resp.json();
        setMasterTestResult({ success: true, message: json.message || "Master Registry terhubung dan aktif!" });
        setMasterRegistryUrl(masterUrl.trim());
      } else {
        setMasterTestResult({ success: false, message: `Status HTTP: ${resp.status}` });
      }
    } catch (e: any) {
      setMasterTestResult({ 
        success: false, 
        message: e?.message || "Gagal menghubungi Master Registry. Pastikan deployment Web App disetel ke 'Anyone' (Siapa Saja)." 
      });
    } finally {
      setTestingMaster(false);
    }
  };

  // Copy Master Registry Apps Script Code
  const handleCopyMasterCode = () => {
    navigator.clipboard.writeText(MASTER_REGISTRY_APPS_SCRIPT);
    setMasterCopied(true);
    setTimeout(() => setMasterCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-4" id="settings-view-container">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 md:w-6 md:h-6 text-brand-green" />
            Pengaturan Lembaga &amp; Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data legalitas madrasah, pejabat penandatangan SPJ, dan sinkronisasi database Google Sheets.
          </p>
        </div>

        {/* Action button in header to quickly sync if connected */}
        {isConnected && (
          <button
            type="button"
            onClick={handleSyncFromSheets}
            disabled={syncingSheets}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200/80 text-xs transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Tarik data profil madrasah langsung dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${syncingSheets ? "animate-spin" : ""}`} />
            <span>{syncingSheets ? "Menarik Data..." : "Tarik dari Spreadsheet"}</span>
          </button>
        )}
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("profil")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "profil"
              ? "border-brand-green text-brand-green bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Profil Lembaga &amp; Dokumen</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("database")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "database"
              ? "border-brand-green text-brand-green bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Integrasi Google Sheets</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-400"}`} />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("multitenant")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "multitenant"
              ? "border-brand-green text-brand-green bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master Multi-Tenant (Pengembang)</span>
          {masterUrl && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
        </button>
      </div>

      {/* Sync Feedback Toast */}
      {syncMessage && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 transition-all ${
          syncMessage.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {syncMessage.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span className="font-medium">{syncMessage.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-4">

        {/* TAB 1: PROFIL LEMBAGA & PEJABAT */}
        {activeTab === "profil" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Card 1: Identitas Madrasah & Logo */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
                  <Building className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Identitas Madrasah Diniyah</h2>
                  <p className="text-[11px] text-slate-500">Informasi utama lembaga yang dicetak pada bagian kop surat dokumen resmi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                
                {/* Logo Lembaga Section */}
                <div className="md:col-span-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 flex flex-col items-center text-center space-y-2.5">
                  <span className="text-xs font-bold text-slate-700">Logo Lembaga</span>
                  <div className="relative flex items-center justify-center bg-white border border-slate-200 rounded-xl w-24 h-24 p-1.5 overflow-hidden shadow-2xs">
                    {logo ? (
                      <img src={logo} alt="Logo Madrasah" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] text-slate-400">Belum Ada Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-md border border-slate-300 text-xs shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-slate-500" />
                      Pilih File
                    </button>
                    {logo && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-2 py-1 rounded-md border border-rose-200 text-xs cursor-pointer"
                        title="Hapus Logo"
                      >
                        <Trash className="w-3 h-3" />
                        Hapus
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowUrlLogoInput(!showUrlLogoInput)}
                    className="text-[11px] text-brand-green font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" />
                    {showUrlLogoInput ? "Tutup URL Logo" : "Gunakan Tautan/URL"}
                  </button>

                  {showUrlLogoInput && (
                    <input
                      type="url"
                      value={logo && logo.startsWith("data:") ? "" : logo}
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 text-xs outline-none focus:border-emerald-500 bg-white shadow-2xs font-mono"
                    />
                  )}

                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">Format PNG/JPG, maks 2MB</p>
                </div>

                {/* Nama & NSM */}
                <div className="md:col-span-2 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Nama Lembaga Madrasah Diniyah
                    </label>
                    <input
                      type="text"
                      required
                      value={namaLembaga}
                      onChange={(e) => setNamaLembaga(e.target.value)}
                      placeholder="Contoh: MADRASAH DINIYAH &quot;BAITURROHMAN&quot;"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs md:text-sm shadow-2xs transition font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Nomor Statistik Madrasah (NSM)
                    </label>
                    <input
                      type="text"
                      required
                      value={nsm}
                      onChange={(e) => setNsm(e.target.value)}
                      placeholder="Contoh: 311235120145"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs md:text-sm font-mono shadow-2xs transition"
                    />
                  </div>

                  <div className="pt-1">
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        Data identitas ini akan dicetak otomatis pada Kop Surat RAB, Kwitansi SPJ, Buku Kas Pembantu (BKP), dan Buku Kas Umum (BKU).
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Card 2: Pejabat Penandatangan Dokumen SPJ */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-md">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Pejabat Penandatangan Dokumen</h2>
                  <p className="text-[11px] text-slate-500">Nama Kepala Madrasah dan Bendahara yang akan menandatangani SPJ dan lembar pengesahan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Kolom Kepala Madrasah */}
                <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kepala Madrasah Diniyah</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Nama Lengkap &amp; Gelar
                    </label>
                    <input
                      type="text"
                      required
                      value={namaKepala}
                      onChange={(e) => setNamaKepala(e.target.value)}
                      placeholder="Contoh: SARNI BASORI, S.Pd.I."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs md:text-sm bg-white shadow-2xs"
                    />
                  </div>
                </div>

                {/* Kolom Bendahara Madrasah */}
                <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    <span>Bendahara Madrasah Diniyah</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Nama Lengkap &amp; Gelar
                    </label>
                    <input
                      type="text"
                      required
                      value={namaBendahara}
                      onChange={(e) => setNamaBendahara(e.target.value)}
                      placeholder="Contoh: MAHMUDI, S.Pd.I."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs md:text-sm bg-white shadow-2xs"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Card 3: Detail Alamat Lembaga & Titimangsa */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Alamat Lembaga &amp; Titimangsa Surat</h2>
                  <p className="text-[11px] text-slate-500">Rincian lokasi madrasah untuk baris kedua kop surat dan tempat penetapan dokumen.</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Alamat Jalan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Alamat Jalan / Dusun / RT &amp; RW
                  </label>
                  <input
                    type="text"
                    required
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Dusun Krajan RT 02 RW 01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs md:text-sm shadow-2xs transition"
                  />
                </div>

                {/* Grid 3 Kolom Wilayah */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Desa / Kelurahan
                    </label>
                    <input
                      type="text"
                      required
                      value={desa}
                      onChange={(e) => setDesa(e.target.value)}
                      placeholder="Contoh: Poncol"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs md:text-sm shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      required
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      placeholder="Contoh: Poncol"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs md:text-sm shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Kabupaten / Kota
                    </label>
                    <input
                      type="text"
                      required
                      value={kabupaten}
                      onChange={(e) => setKabupaten(e.target.value)}
                      placeholder="Contoh: Magetan"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs md:text-sm shadow-2xs"
                    />
                  </div>
                </div>

                {/* Titimangsa Tempat & Tanggal Dokumen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-green" />
                      Titimangsa Kota &amp; Tanggal Pengesahan
                    </label>
                    <input
                      type="text"
                      required
                      value={kotaTanggal}
                      onChange={(e) => setKotaTanggal(e.target.value)}
                      placeholder="Contoh: Magetan, 31 Desember 2025"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-xs md:text-sm shadow-2xs"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      Tercetak di pojok kanan bawah lembar cetak dokumen di atas nama Kepala Madrasah.
                    </p>
                  </div>

                  {/* Sumber Dana Hibah Options (Ringkas & Bersih) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Opsi Sumber Dana Hibah
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSumberDana}
                        onChange={(e) => setNewSumberDana(e.target.value)}
                        placeholder="Tambah kode sumber dana..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none text-xs focus:border-emerald-500 shadow-2xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSumberDana();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSumberDana}
                        className="bg-brand-green hover:bg-brand-green-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sumberDanaOptions.map((item) => (
                        <span 
                          key={item} 
                          className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-medium"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleRemoveSumberDana(item)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                            title="Hapus opsi"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: INTEGRASI GOOGLE SHEETS */}
        {activeTab === "database" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Status Koneksi Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              isConnected 
                ? "bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border-emerald-300/80 shadow-2xs" 
                : "bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-300/80 shadow-2xs"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {isConnected ? <CheckCircle className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800">
                        {isConnected ? "Google Sheets Terhubung & Aktif" : "Mode Penyimpanan Lokal (Offline)"}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isConnected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {isConnected ? "Online" : "Offline"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {isConnected 
                        ? "Seluruh data profil madrasah, arsip RAB, dan transaksi SPJ tersimpan di Google Spreadsheet Anda secara real-time."
                        : "Aplikasi saat ini menyimpan data di browser Anda. Masukkan Web App URL di bawah untuk menghubungkan ke Google Sheets."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                  {isConnected && (
                    <button
                      type="button"
                      disabled={syncingSheets}
                      onClick={handleSyncFromSheets}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 ${syncingSheets ? "animate-spin" : ""}`} />
                      <span>{syncingSheets ? "Menyinkronkan..." : "Sinkronkan Data"}</span>
                    </button>
                  )}
                  <a
                    href="https://docs.google.com/spreadsheets/d/1qpwmTBXZiHUj-ULJQC8f3KkJrePZoZjqlpDvMJHisDsZtV7iGS64NZdc/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer shadow-2xs"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* Konfigurasi URL Web App */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
                  <Database className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Pengaturan URL Google Apps Script</h2>
                  <p className="text-[11px] text-slate-500">Tautan deployment Web App dari Apps Script Google Spreadsheet Anda.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Google Apps Script Web App URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={appsScriptUrl}
                      onChange={(e) => setLocalAppsScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs md:text-sm shadow-2xs font-mono bg-slate-50/50"
                    />
                    <button
                      type="button"
                      disabled={testingConnection}
                      onClick={handleTestConnection}
                      className="bg-brand-green hover:bg-brand-green-dark active:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2 rounded-lg shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
                      <span>{testingConnection ? "Menguji..." : "Uji Koneksi & Sheet"}</span>
                    </button>
                  </div>

                  {appsScriptUrl.includes("docs.google.com/spreadsheets") && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                      <span className="shrink-0 text-base leading-none">⚠️</span>
                      <p className="text-[11px] leading-relaxed">
                        Tautan ini adalah tautan spreadsheet langsung, bukan URL Web App. Buka spreadsheet &gt; <strong>Ekstensi &gt; Apps Script &gt; Terapkan &gt; Penerapan baru &gt; Aplikasi Web</strong>, lalu salin URL yang berakhiran <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">/exec</code>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Connection Status Box */}
                {testResult && (
                  <div 
                    className={`flex flex-col gap-2 p-3.5 rounded-lg border text-xs leading-relaxed ${
                      testResult.success 
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" 
                        : "bg-rose-50/80 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold">{testResult.success ? "Koneksi Berhasil & Sheet Terverifikasi" : "Koneksi Gagal"}</p>
                        <p className="mt-0.5 opacity-90">{testResult.message}</p>
                      </div>
                    </div>

                    {testResult.sheets && testResult.sheets.length > 0 && (
                      <div className="mt-1 pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-1.5 pl-6.5">
                        <span className="font-semibold text-emerald-900 text-[11px]">Sheet Terdeteksi:</span>
                        {testResult.sheets.map((sheet, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              ['Profil_Lembaga', 'Daftar_RAB', 'Rincian_RAB'].includes(sheet)
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            📄 {sheet}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Panduan & Kode Google Apps Script (Accordion Rapi) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-3">
              <button 
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between text-left font-bold text-slate-800 text-xs md:text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-green" />
                  <span>Panduan Menghubungkan Google Sheets &amp; Kode Script</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-normal">
                  <span>{showGuide ? "Tutup Panduan" : "Lihat Panduan"}</span>
                  {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {showGuide && (
                <div className="space-y-4 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                  
                  {/* Langkah Cepat */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-green" />
                      Langkah Praktis Integrasi:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11.5px]">
                      {STEP_BY_STEP_GUIDE.slice(0, 5).map((step, idx) => (
                        <li key={idx} className="leading-normal">
                          <span className="font-medium text-slate-800">{step.split('\n')[0]}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Salin Kode Script Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Kode Google Apps Script (Code.gs)</p>
                      <p className="text-[11px] text-slate-500">Salin kode ini dan tempelkan ke editor Apps Script spreadsheet Anda.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                        className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-2.5 py-1.5 rounded-md border border-slate-200 text-xs cursor-pointer shadow-2xs"
                      >
                        <Code className="w-3.5 h-3.5 text-slate-500" />
                        {showCodeSnippet ? "Tutup Editor" : "Lihat Kode"}
                      </button>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-2xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copied ? "Tersalin!" : "Salin Kode"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Code Box */}
                  {showCodeSnippet && (
                    <div className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[11px]">
                        <span className="font-mono text-slate-300">Code.gs</span>
                        <button
                          type="button"
                          onClick={copyToClipboard}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs cursor-pointer"
                        >
                          {copied ? "Tersalin!" : "Copy All"}
                        </button>
                      </div>
                      <pre className="p-3 text-[10px] leading-relaxed font-mono overflow-x-auto max-h-64 select-all whitespace-pre">
                        <code>{APPS_SCRIPT_CODE}</code>
                      </pre>
                    </div>
                  )}

                  {/* Dokumentasi Lembar Kerja */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    {SHEET_STRUCTURE_DOC.map((doc, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="font-bold text-emerald-800 font-mono">&bull; {doc.sheetName}</p>
                        <p className="text-slate-500 text-[10.5px] mt-0.5 leading-snug">{doc.description}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: MASTER MULTI-TENANT (KHUSUS PENGEMBANG / ADMIN) */}
        {activeTab === "multitenant" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Kartu Ringkasan Konsep */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-xl p-4 md:p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Arsitektur Multi-Tenant Terisolasi (Database-per-Tenant)</h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Sistem ini memungkinkan satu aplikasi frontend melayani puluhan hingga ratusan madrasah. Setiap madrasah memiliki berkas Google Spreadsheet independen masing-masing, sementara Anda sebagai pengembang mengelola satu <strong>Spreadsheet Pusat (Master Registry)</strong> yang mencatat kode akses unik dan tautan database mereka.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <p className="font-bold text-amber-300">1. Master Spreadsheet</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Dikelola pengembang, berisi daftar Kode Unik, PIN, dan URL Apps Script madrasah.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <p className="font-bold text-emerald-300">2. Spreadsheet Madrasah</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Tersimpan di Google Drive masing-masing madrasah untuk menyimpan data SPJ &amp; RAB.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <p className="font-bold text-sky-300">3. Vercel Hosting (SPA)</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Deploy gratis berkecepatan tinggi dengan auto-update via GitHub.</p>
                </div>
              </div>
            </div>

            {/* Konfigurasi URL Master Registry */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">URL Web App Master Registry Pengembang</h3>
                  <p className="text-[11px] text-slate-500">Tautan Web App dari Spreadsheet Pusat Pengembang untuk autentikasi Kode Unik &amp; PIN.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Master Registry Apps Script URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={masterUrl}
                      onChange={(e) => setMasterUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs md:text-sm shadow-2xs font-mono bg-slate-50/50"
                    />
                    <button
                      type="button"
                      disabled={testingMaster}
                      onClick={handleTestMaster}
                      className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2 rounded-lg shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingMaster ? "animate-spin" : ""}`} />
                      <span>{testingMaster ? "Menguji..." : "Uji Koneksi Master"}</span>
                    </button>
                  </div>
                </div>

                {masterTestResult && (
                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    masterTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}>
                    {masterTestResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{masterTestResult.success ? "Master Registry Terhubung!" : "Koneksi Master Gagal"}</p>
                      <p className="mt-0.5 opacity-90">{masterTestResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Struktur Kolom Spreadsheet Master */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-green" />
                Struktur Sheet &quot;Daftar_Lembaga&quot; pada Spreadsheet Master Pengembang
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buat satu file Google Spreadsheet baru milik Anda (misal dinamai <strong>MASTER REGISTRY SANTRI</strong>), lalu buat sheet bernama <code className="font-bold font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800">Daftar_Lembaga</code> dengan baris judul kolom sebagai berikut:
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-200">kode</th>
                      <th className="px-3 py-2 border-r border-slate-200">pin</th>
                      <th className="px-3 py-2 border-r border-slate-200">nama_lembaga</th>
                      <th className="px-3 py-2 border-r border-slate-200">nsm</th>
                      <th className="px-3 py-2 border-r border-slate-200">url_apps_script</th>
                      <th className="px-3 py-2 border-r border-slate-200">status</th>
                      <th className="px-3 py-2">keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr className="bg-white">
                      <td className="px-3 py-2 border-r border-slate-100 font-bold text-emerald-700">MD01</td>
                      <td className="px-3 py-2 border-r border-slate-100">1234</td>
                      <td className="px-3 py-2 border-r border-slate-100 font-sans">MD BAITURROHMAN</td>
                      <td className="px-3 py-2 border-r border-slate-100">311235120145</td>
                      <td className="px-3 py-2 border-r border-slate-100 text-slate-500 truncate max-w-[150px]">https://script.google.com/macros/s/.../exec</td>
                      <td className="px-3 py-2 border-r border-slate-100 text-emerald-600 font-bold">AKTIF</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Kec. Kawedanan</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="px-3 py-2 border-r border-slate-100 font-bold text-emerald-700">MD02</td>
                      <td className="px-3 py-2 border-r border-slate-100">4567</td>
                      <td className="px-3 py-2 border-r border-slate-100 font-sans">MD AL-HIDAYAH</td>
                      <td className="px-3 py-2 border-r border-slate-100">311235120188</td>
                      <td className="px-3 py-2 border-r border-slate-100 text-slate-500 truncate max-w-[150px]">https://script.google.com/macros/s/.../exec</td>
                      <td className="px-3 py-2 border-r border-slate-100 text-emerald-600 font-bold">AKTIF</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Kec. Kawedanan</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kode Google Apps Script Master Registry */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Kode Apps Script untuk Spreadsheet Master
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pasang script ini di Spreadsheet Master Anda melalui menu <strong>Ekstensi &gt; Apps Script</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMasterCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition cursor-pointer border border-indigo-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{masterCopied ? "Kode Tersalin!" : "Salin Script Master"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMasterCode(!showMasterCode)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                  >
                    {showMasterCode ? "Sembunyikan" : "Lihat Kode"}
                  </button>
                </div>
              </div>

              {showMasterCode && (
                <div className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
                  <pre className="p-3 text-[10px] leading-relaxed font-mono overflow-x-auto max-h-72 select-all whitespace-pre">
                    <code>{MASTER_REGISTRY_APPS_SCRIPT}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Panduan 3 Langkah Deploy ke GitHub & Vercel */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-green" />
                Langkah Praktis Deploy ke GitHub &amp; Vercel
              </h3>
              
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
                <li>
                  <strong>Export / Push ke Repository GitHub:</strong> Buka menu Settings di Google AI Studio &gt; <em>Export to GitHub</em> (atau download ZIP, ekstrak, lalu <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">git push origin main</code> ke repository GitHub Anda).
                </li>
                <li>
                  <strong>Hubungkan ke Vercel:</strong> Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">vercel.com</a>, pilih <strong>Add New Project</strong> &gt; Pilih repository GitHub Anda &gt; Klik <strong>Deploy</strong>. Vercel akan otomatis mengenali Vite dan file <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">vercel.json</code> yang telah terkonfigurasi.
                </li>
                <li>
                  <strong>Bagikan Tautan ke Madrasah:</strong> Setelah Vercel memberikan domain (misal: <code className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-1 py-0.5 rounded">https://madin-bppdgs.vercel.app</code>), Anda dapat membagikan link tersebut beserta Kode Unik dan PIN masing-masing madrasah, atau link langsung: <br />
                  <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] block mt-1">
                    https://madin-bppdgs.vercel.app?kode=MD01
                  </code>
                </li>
              </ol>
            </div>

          </div>
        )}

        {/* Bottom Bar: Status Simpan & Tombol Aksi */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
          <div className="text-xs text-slate-500">
            {isConnected ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Tersambung ke Google Sheets &amp; Penyimpanan Lokal
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                * Berjalan dalam mode lokal offline. Perubahan tersimpan di browser.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            {saveStatus === "success" && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Pengaturan Berhasil Disimpan!
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                Gagal Menyimpan Pengaturan!
              </span>
            )}
            <button
              type="submit"
              disabled={savingProfil}
              className="bg-brand-green hover:bg-brand-green-dark active:bg-emerald-900 disabled:bg-emerald-400 text-white font-bold text-xs md:text-sm px-6 py-2 rounded-lg shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              id="btn-save-settings"
            >
              {savingProfil ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengaturan"
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
