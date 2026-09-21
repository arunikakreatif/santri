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
  KeyRound
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
import { getActiveTenant, ActiveTenant } from "./services/tenantService";

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
  const [showAktivasiModal, setShowAktivasiModal] = useState<boolean>(false);
  const [initialTenantCode, setInitialTenantCode] = useState<string>("");

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
      setInitialTenantCode(kode);
      const current = getActiveTenant();
      if (!current || current.kode !== kode.toUpperCase()) {
        setShowAktivasiModal(true);
      }
    }
    loadAllData();
  }, []);

  const handleTenantActivated = async (tenant: ActiveTenant) => {
    setActiveTenant(tenant);
    await loadAllData();
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
  if (loading && !profil) {
    return (
      <div className="fixed inset-0 bg-brand-krem flex flex-col items-center justify-center gap-3 text-sm font-semibold text-brand-green-dark">
        <RefreshCw className="w-8 h-8 text-brand-gold animate-spin" />
        Memuat Portal RAB Madrasah Diniyah...
      </div>
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

          {/* Connected sheet name or local state with golden brand styling for offline */}
          <div className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${
            sheetsConnected 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
          }`}>
            <Database className={`w-3.5 h-3.5 shrink-0 ${sheetsConnected ? "text-emerald-400" : "text-brand-gold"}`} />
            <span className="truncate">
              {sheetsConnected ? "Sheets Terhubung" : "Mode Offline (Lokal)"}
            </span>
          </div>

          {/* Multi-Tenant Access Key Button */}
          <button
            type="button"
            onClick={() => setShowAktivasiModal(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-brand-gold border border-brand-gold/25 transition cursor-pointer"
            title="Aktivasi atau ganti kode akses madrasah"
          >
            <span className="flex items-center gap-1.5 truncate">
              <KeyRound className="w-3.5 h-3.5 shrink-0 text-brand-gold" />
              <span className="truncate">
                {activeTenant ? `Akses: ${activeTenant.kode}` : "Aktivasi Kode Lembaga"}
              </span>
            </span>
            <span className="text-[9px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded font-bold uppercase">
              {activeTenant ? "Ganti" : "Login"}
            </span>
          </button>

          {/* Multi-Tenant Madin Selector */}
          {profil && (
            <div className="pt-1">
              <MadinSelector currentMadin={profil} onMadinChanged={handleMadinChanged} />
            </div>
          )}
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
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-gold" />
            <span>Thn Ajaran Berjalan: {new Date().getFullYear()}</span>
          </div>
          <p className="text-[9px] text-slate-500 font-medium">
            SANTRI &copy; {new Date().getFullYear()} — BPPDGS Madrasah Diniyah
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

        {/* Mobile Madin Selector Bar */}
        {profil && (
          <div className="px-4 py-2.5 bg-brand-green-dark border-b border-brand-gold/10 lg:hidden print:hidden">
            <MadinSelector currentMadin={profil} onMadinChanged={handleMadinChanged} />
          </div>
        )}

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
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAktivasiModal(true);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/25 transition cursor-pointer mt-1"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-gold" />
                <span>{activeTenant ? `Akses: ${activeTenant.kode} (${activeTenant.namaLembaga})` : "Aktivasi Kode Lembaga"}</span>
              </span>
              <span className="text-[9px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded uppercase font-bold">
                {activeTenant ? "Ganti" : "Login"}
              </span>
            </button>

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
    </div>
  );
}

