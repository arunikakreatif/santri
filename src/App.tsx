/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Layers, 
  FolderKanban, 
  Settings, 
  Menu, 
  X, 
  Building, 
  Database,
  Printer,
  Sparkles,
  RefreshCw,
  Clock,
  ShoppingBag,
  KeyRound,
  ShieldCheck,
  LogOut,
  Building2
} from "lucide-react";

import { ProfilLembaga, RABData } from "./types";
import { 
  getProfil, 
  saveProfil, 
  getRabList, 
  saveRab, 
  deleteRab, 
  isSheetsConnected,
  setActiveMadinId
} from "./services/db";

import DashboardView from "./components/DashboardView";
import SusunRabView from "./components/SusunRabView";
import ArsipRabView from "./components/ArsipRabView";
import PengaturanView from "./components/PengaturanView";
import CetakPreview from "./components/CetakPreview";
import MenuBelanjaView from "./components/belanja/MenuBelanjaView";
import MadinSelector from "./components/belanja/MadinSelector";
import AktivasiLembagaModal from "./components/AktivasiLembagaModal";
import PortalLoginLembaga from "./components/PortalLoginLembaga";
import { 
  getActiveTenant, 
  ActiveTenant, 
  clearActiveTenant, 
  isDeveloperSession, 
  setDeveloperSession 
} from "./services/tenantService";

function DomeIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 2a1 1 0 0 0 0 2" />
      <path d="M12 4C8.5 5.5 7 8 7 13h10c0-5-1.5-7.5-5-9z" fill="currentColor" fillOpacity="0.15" />
      <rect x="5" y="13" width="14" height="3" rx="0.5" fill="currentColor" fillOpacity="0.25" />
      <path d="M9 16v4M15 16v4M12 16v4" />
    </svg>
  );
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [navParam, setNavParam] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global Data State
  const [profil, setProfil] = useState<ProfilLembaga | null>(null);
  const [rabList, setRabList] = useState<RABData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sheetsConnected, setSheetsConnected] = useState<boolean>(isSheetsConnected());

  // Multi-Tenant Session State
  const [activeTenant, setActiveTenant] = useState<ActiveTenant | null>(getActiveTenant());
  const [isDevMode, setIsDevMode] = useState<boolean>(isDeveloperSession());
  const [showAktivasiModal, setShowAktivasiModal] = useState<boolean>(false);
  const [initialTenantCode, setInitialTenantCode] = useState<string>("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Reload everything helper
  const loadAllData = async () => {
    setLoading(true);
    try {
      const p = await getProfil();
      const r = await getRabList();
      setProfil(p);
      setRabList(r);
      setSheetsConnected(isSheetsConnected());
      setActiveTenant(getActiveTenant());
      setIsDevMode(isDeveloperSession());
    } catch (e) {
      console.error("Gagal memuat data awal:", e);
    } finally {
      setLoading(false);
    }
  };

  // On Mount: Load Profile and check query parameter for ?kode=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kode = params.get("kode");
    if (kode) {
      setInitialTenantCode(kode.toUpperCase());
      const current = getActiveTenant();
      if (!current || current.kode !== kode.toUpperCase()) {
        setShowAktivasiModal(true);
      }
    }
    loadAllData();
  }, []);

  const handleTenantActivated = async (tenant: ActiveTenant, isDev: boolean = false) => {
    setActiveTenant(tenant);
    setIsDevMode(isDev);
    setDeveloperSession(isDev);
    await loadAllData();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    clearActiveTenant();
    setActiveTenant(null);
    setIsDevMode(false);
    setDeveloperSession(false);
    setRabList([]);
    setInitialTenantCode("");
    try {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {}
  };

  // Navigation Controller
  const handleNavigate = (tab: string, param: any = null) => {
    setActiveTab(tab);
    setNavParam(param);
    setMobileMenuOpen(false);
    // Scroll window to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switch Active Madin (Multi-Tenant handler)
  const handleMadinChanged = async (newMadinId: string) => {
    setActiveMadinId(newMadinId);
    await loadAllData();
  };

  // Profile Save Handler
  const handleSaveProfil = async (updatedProfil: ProfilLembaga): Promise<boolean> => {
    try {
      const ok = await saveProfil(updatedProfil);
      if (ok) {
        setProfil(updatedProfil);
        setSheetsConnected(isSheetsConnected());
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // RAB Save Handler
  const handleSaveRab = async (rab: RABData): Promise<boolean> => {
    try {
      const ok = await saveRab(rab);
      if (ok) {
        // Refresh local list
        const newList = await getRabList();
        setRabList(newList);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // RAB Deletion Handler
  const handleDeleteRab = async (tahun: string): Promise<boolean> => {
    try {
      const ok = await deleteRab(tahun);
      if (ok) {
        const newList = await getRabList();
        setRabList(newList);
        // If we deleted the year we were viewing or editing, reset parameters
        if (navParam?.editTahun === tahun || navParam?.previewTahun === tahun) {
          setNavParam(null);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // RAB Duplication Handler
  const handleDuplicateRab = async (sourceTahun: string, targetTahun: string): Promise<boolean> => {
    try {
      const sourceRab = rabList.find(r => r.tahun === sourceTahun);
      if (!sourceRab) return false;

      // Deep clone source RAB structure
      const duplicatedRab: RABData = JSON.parse(JSON.stringify(sourceRab));
      duplicatedRab.tahun = targetTahun;
      duplicatedRab.createdAt = new Date().toISOString();
      duplicatedRab.updatedAt = new Date().toISOString();

      // Recalculate component sub-items to make sure everything has unique ids
      duplicatedRab.komponenList.forEach(comp => {
        comp.items.forEach(item => {
          item.id = Math.random().toString(36).substring(2, 9);
        });
      });

      const ok = await saveRab(duplicatedRab);
      if (ok) {
        const newList = await getRabList();
        setRabList(newList);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Dynamic Content Router
  const renderContent = () => {
    if (!profil) return null;

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView 
            profil={profil}
            rabList={rabList}
            onNavigate={handleNavigate}
            isSheetsConnected={sheetsConnected}
            onDeleteRab={handleDeleteRab}
          />
        );
      case "susun":
        return (
          <SusunRabView 
            profil={profil}
            rabList={rabList}
            initialTahun={navParam?.editTahun || null}
            onSaveRab={handleSaveRab}
            onNavigate={handleNavigate}
          />
        );
      case "arsip":
        return (
          <ArsipRabView 
            rabList={rabList}
            onNavigate={handleNavigate}
            onDeleteRab={handleDeleteRab}
            onDuplicateRab={handleDuplicateRab}
          />
        );
      case "belanja":
        return (
          <MenuBelanjaView 
            profil={profil}
            rabList={rabList}
            initialSubTab={navParam?.subTab || "kwitansi"}
            onNavigate={handleNavigate}
          />
        );
      case "pengaturan":
        return (
          <PengaturanView 
            profil={profil}
            onSaveProfil={handleSaveProfil}
            onRefreshAllData={loadAllData}
            isDeveloper={isDevMode || activeTenant?.kode === "ADMIN-MASTER"}
          />
        );
      case "cetak":
        const targetTahun = navParam?.previewTahun || (rabList[0]?.tahun || "");
        const matchedRab = rabList.find(r => r.tahun === targetTahun);
        if (!matchedRab) {
          return (
            <div className="bg-white p-8 rounded-xl text-center border shadow-xs space-y-3">
              <p className="text-sm text-slate-500 font-bold">RAB tahun anggaran {targetTahun} tidak ditemukan.</p>
              <button 
                onClick={() => handleNavigate("arsip")}
                className="bg-brand-green hover:bg-brand-green-light text-white px-4 py-2 rounded-lg text-xs font-bold"
              >
                Kembali ke Arsip
              </button>
            </div>
          );
        }
        return (
          <CetakPreview 
            rab={matchedRab}
            profil={profil}
            onBack={() => handleNavigate("arsip")}
          />
        );
      default:
        return <div className="p-8">Halaman Tidak Ditemukan.</div>;
    }
  };

  // Navigation Items array
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "susun", label: "Susun RAB", icon: Layers },
    { id: "arsip", label: "Arsip RAB", icon: FolderKanban },
    { id: "belanja", label: "Menu Belanja (SPJ)", icon: ShoppingBag },
    { id: "pengaturan", label: "Pengaturan Lembaga", icon: Settings },
  ];

  // Loading spinner overlay
  if (loading && !profil && (activeTenant || isDevMode)) {
    return (
      <div className="fixed inset-0 bg-brand-krem flex flex-col items-center justify-center gap-3 text-sm font-semibold text-brand-green-dark">
        <RefreshCw className="w-8 h-8 text-brand-gold animate-spin" />
        Memuat Portal SANTRI BPPGDS...
      </div>
    );
  }

  // Multi-Tenant Gatekeeper: Jangan tampilkan dashboard jika belum login!
  if (!activeTenant && !isDevMode) {
    return (
      <PortalLoginLembaga
        onSuccess={handleTenantActivated}
        initialCode={initialTenantCode}
      />
    );
  }

  return (
    <div 
      className="min-h-screen bg-brand-krem flex text-slate-800 font-sans"
    >
      
      {/* SIDEBAR NAVIGATION - DESKTOP (Hidden on Print) */}
      <aside 
        className="w-72 bg-gradient-to-b from-brand-green-dark to-[#0E1B25] text-white hidden lg:flex flex-col shrink-0 border-r border-brand-gold/10 print:hidden"
        id="sidebar-nav"
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-xl border border-brand-gold/30 shadow-inner shrink-0 backdrop-blur-xs">
              <img
                src="https://res.cloudinary.com/maswardi/image/upload/v1789741665/Screenshot_2026-09-18_211854_ja9rap.png"
                alt="Logo SANTRI"
                className="h-11 w-auto max-w-[54px] object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-base tracking-wider font-display text-white uppercase leading-none">SANTRI</p>
              <p className="text-[9px] text-brand-gold font-bold tracking-tight mt-1 leading-tight" title="Sistem Administrasi & Transparansi Realisasi Hibah">
                Sistem Administrasi &amp; Transparansi Realisasi Hibah
              </p>
            </div>
          </div>

          {/* Kartu Identitas Lembaga Terverifikasi */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isDevMode ? "Mode Pengembang" : `Kode: ${activeTenant?.kode}`}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[10px] text-rose-300 hover:text-rose-100 flex items-center gap-1 hover:underline cursor-pointer bg-white/5 hover:bg-rose-500/20 px-2 py-0.5 rounded transition"
                title="Keluar dari akun lembaga ini"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>

            <div className="font-bold text-xs text-white leading-snug line-clamp-2" title={activeTenant?.namaLembaga || profil?.namaLembaga}>
              {activeTenant?.namaLembaga || profil?.namaLembaga}
            </div>

            {/* Connected sheet status */}
            <div className={`flex items-center gap-1.5 border px-2 py-1 rounded-md text-[10px] font-bold ${
              sheetsConnected 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
            }`}>
              <Database className={`w-3 h-3 shrink-0 ${sheetsConnected ? "text-emerald-400" : "text-brand-gold"}`} />
              <span className="truncate">
                {sheetsConnected ? "Sheets Cloud Terhubung" : "Mode Offline (Lokal)"}
              </span>
            </div>
          </div>
        </div>

        {/* Menu list */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive 
                    ? "bg-brand-green text-white shadow-md border-l-3 border-brand-gold" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 opacity-85 transition-colors ${isActive ? "text-brand-gold" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/5 space-y-2 text-[10px] text-slate-400">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-500/30 transition cursor-pointer mb-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar / Ganti Lembaga</span>
          </button>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-gold" />
            <span>Thn Ajaran Berjalan: {new Date().getFullYear()}</span>
          </div>
          <p className="text-[9px] text-slate-500 font-medium">
            SANTRI &copy; {new Date().getFullYear()} — BPPGDS Madrasah Diniyah
          </p>
        </div>
      </aside>

      {/* MOBILE MENU NAVIGATION & TOP BAR (Hidden on Print) */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-wrapper">
        
        {/* Top Header Bar */}
        <header className="bg-brand-green-dark border-b border-brand-gold/10 px-4 py-3 flex items-center justify-between lg:hidden print:hidden shrink-0 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-white/10 rounded-lg border border-brand-gold/25 shrink-0">
              <img
                src="https://res.cloudinary.com/maswardi/image/upload/v1789741665/Screenshot_2026-09-18_211854_ja9rap.png"
                alt="Logo SANTRI"
                className="h-9 w-auto max-w-[46px] object-contain"
              />
            </div>
            <div>
              <p className="font-extrabold text-sm tracking-wider uppercase text-white leading-none font-display">SANTRI</p>
              <p className="text-[8.5px] text-brand-gold font-bold tracking-tight">Sistem Administrasi &amp; Transparansi Realisasi Hibah</p>
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-brand-gold/25 text-brand-gold hover:bg-brand-green cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Lembaga Identity Bar */}
        <div className="px-4 py-2 bg-brand-green-dark/95 border-b border-brand-gold/10 lg:hidden print:hidden flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" />
            <span className="font-bold truncate text-[11px]">
              {activeTenant?.namaLembaga || profil?.namaLembaga}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold shrink-0 border border-brand-gold/30">
            {activeTenant?.kode || "DEV"}
          </span>
        </div>

        {/* Mobile menu panel dropdown */}
        {mobileMenuOpen && (
          <div className="bg-brand-green-dark text-white p-4 space-y-1.5 lg:hidden border-b border-brand-gold/10 print:hidden shrink-0">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive 
                      ? "bg-brand-green text-white border-l-3 border-brand-gold" 
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-gold" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}

            <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-gold font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isDevMode ? "Mode Pengembang" : `Kode: ${activeTenant?.kode}`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-rose-300 hover:text-rose-100 font-bold flex items-center gap-1 text-[11px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Keluar</span>
                </button>
              </div>
              <div className="text-xs font-bold text-white leading-tight line-clamp-2">
                {activeTenant?.namaLembaga || profil?.namaLembaga}
              </div>
            </div>

            <div className="border-t border-white/5 mt-2 pt-2 flex items-center justify-between text-[9px] text-slate-400">
              <span className={`font-bold ${sheetsConnected ? "text-emerald-400" : "text-brand-gold"}`}>
                {sheetsConnected ? "● Sheets Terhubung" : "● Mode Offline (Lokal)"}
              </span>
              <span>TA {new Date().getFullYear()}</span>
            </div>
          </div>
        )}

        {/* MAIN BODY CANVAS VIEW PORT */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between px-3.5 py-3 md:px-6 md:py-4 max-w-7xl w-full mx-auto">
          <div className="flex-1">
            {renderContent()}
          </div>

          {/* Universal Footer for all pages */}
          <footer className="mt-3 pt-2.5 pb-0.5 border-t border-slate-200/80 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium shrink-0 print:hidden">
            <img 
              src="https://res.cloudinary.com/maswardi/image/upload/v1789812095/Gemini_Generated_Image_u5xoh7u5xoh7u5xo_ltbsgz.jpg" 
              alt="Logo Arunika Kreatif Media" 
              className="h-4 w-auto object-contain rounded-xs shadow-2xs"
            />
            <span>&copy; 2026 Arunika Kreatif Media. All Rights Reserved</span>
          </footer>
        </main>

      </div>

      {/* Modal Aktivasi Kode Lembaga (Multi-Tenant) */}
      <AktivasiLembagaModal
        isOpen={showAktivasiModal}
        onClose={() => setShowAktivasiModal(false)}
        onSuccess={handleTenantActivated}
        initialCode={initialTenantCode}
      />

      {/* Modal Konfirmasi Keluar (In-App Logout Dialog) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isDevMode ? "Mode Pengembang / Super Admin" : `Lembaga: ${activeTenant?.kode || "-"}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin keluar dari sesi ini? Anda dapat masuk kembali kapan saja menggunakan <strong>Kode Lembaga</strong> dan <strong>PIN</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

