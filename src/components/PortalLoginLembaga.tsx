/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Terminal,
  Eye,
  EyeOff,
  HelpCircle,
  BookOpen
} from "lucide-react";
import { 
  authenticateTenant, 
  getMasterRegistryUrl, 
  setMasterRegistryUrl,
  TenantAuthData 
} from "../services/tenantService";

interface PortalLoginLembagaProps {
  onSuccess: (tenant: TenantAuthData, isDevMode?: boolean) => void;
  initialCode?: string;
}

export default function PortalLoginLembaga({
  onSuccess,
  initialCode = ""
}: PortalLoginLembagaProps) {
  const [kode, setKode] = useState<string>(initialCode);
  const [pin, setPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mode Pengembang (Developer / Super Admin)
  const [isDevModalOpen, setIsDevModalOpen] = useState<boolean>(false);
  const [devPin, setDevPin] = useState<string>("");
  const [devMasterUrl, setDevMasterUrl] = useState<string>(getMasterRegistryUrl());
  const [devError, setDevError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setKode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Login Lembaga Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanKode = kode.trim().toUpperCase();
    if (!cleanKode) {
      setErrorMsg("Harap masukkan Kode Lembaga (misal: MD01, MD02).");
      return;
    }

    setLoading(true);
    try {
      const res = await authenticateTenant(cleanKode, pin);
      if (res.success && res.data) {
        setSuccessMsg(`Otorisasi Berhasil! Mengalihkan ke ${res.data.namaLembaga}...`);
        setTimeout(() => {
          onSuccess(res.data!, false);
        }, 600);
      } else {
        setErrorMsg(res.message || "Kode Lembaga atau PIN tidak cocok dengan Master Registry.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menghubungi server Master Registry.");
    } finally {
      setLoading(false);
    }
  };

  // Demo Login (Baiturrohman)
  const handleQuickDemo = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authenticateTenant("MD01", "1234");
      if (res.success && res.data) {
        onSuccess(res.data, false);
      } else {
        // Fallback demo
        const demoTenant: TenantAuthData = {
          kode: "MD01",
          namaLembaga: 'MADRASAH DINIYAH "BAITURROHMAN"',
          nsm: "311235120145",
          appsScriptUrl: "",
          authenticatedAt: new Date().toISOString()
        };
        onSuccess(demoTenant, false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Login Super Admin / Pengembang
  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setDevError(null);

    // PIN Pengembang default: 9999 atau admin
    if (devPin.trim() === "9999" || devPin.trim().toLowerCase() === "admin") {
      if (devMasterUrl.trim()) {
        setMasterRegistryUrl(devMasterUrl.trim());
      }
      const adminTenant: TenantAuthData = {
        kode: "ADMIN-MASTER",
        namaLembaga: "PORTAL PENGEMBANG & SUPER ADMIN",
        nsm: "000000000000",
        appsScriptUrl: devMasterUrl.trim(),
        authenticatedAt: new Date().toISOString()
      };
      setIsDevModalOpen(false);
      onSuccess(adminTenant, true);
    } else {
      setDevError("PIN Pengembang salah (Gunakan: 9999).");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1713] via-[#0E241B] to-[#0A1510] flex flex-col justify-between text-slate-100 font-sans relative overflow-hidden selection:bg-brand-gold selection:text-brand-green-dark">
      
      {/* Background Islamic Geometric Pattern Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#C5A859_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Top Ambient Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full border-b border-white/10 bg-black/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-xl border border-brand-gold/40 shadow-inner">
            <img
              src="https://res.cloudinary.com/maswardi/image/upload/v1789741665/Screenshot_2026-09-18_211854_ja9rap.png"
              alt="Logo SANTRI"
              className="h-9 w-auto max-w-[46px] object-contain"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wider font-display text-white uppercase leading-none flex items-center gap-2">
              SANTRI
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/40 tracking-normal normal-case">
                BPPGDS Madrasah Diniyah
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Sistem Administrasi &amp; Transparansi Realisasi Hibah
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDevModalOpen(true)}
          className="text-xs text-slate-400 hover:text-brand-gold flex items-center gap-1.5 transition py-1.5 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-brand-gold" />
          <span className="hidden sm:inline">Akses Pengembang</span>
        </button>
      </header>

      {/* Main Login Card Center */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 text-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-brand-green-dark to-[#0E241B] text-white p-6 text-center relative border-b border-brand-gold/20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold mb-3 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight font-display text-white">
              Portal Masuk Lembaga
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
              Masukkan <strong>Kode Lembaga</strong> dan <strong>PIN</strong> untuk mengakses data khusus madrasah Anda.
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Alert Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Input Kode Lembaga */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Kode Akses Lembaga
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus={!kode}
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: MD01, MD02"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green uppercase transition"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Kode unik yang terdaftar pada Master Registry BPPGDS.
              </span>
            </div>

            {/* Input PIN Keamanan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                PIN Keamanan Lembaga
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan 4-6 digit PIN"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                PIN rahasia untuk menjaga kerahasiaan data madrasah.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-green to-emerald-700 hover:from-emerald-700 hover:to-brand-green text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-brand-gold" />
                  <span>Masuk ke Portal Lembaga</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                  Atau Akses Cepat
                </span>
              </div>
            </div>

            {/* Quick Demo Button */}
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-brand-gold/50 bg-slate-50 hover:bg-emerald-50/50 text-slate-600 hover:text-brand-green-dark text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              <span>Coba Akun Percontohan (MD01 - Baiturrohman)</span>
            </button>
          </form>

          {/* Card Footer Info */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-center text-[11px] text-slate-500">
            Data madrasah terisolasi aman &bull; Tersinkronisasi ke Google Sheets masing-masing.
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400 border-t border-white/5 bg-black/20">
        <p className="font-medium">
          &copy; {new Date().getFullYear()} SANTRI &bull; BPPGDS Madrasah Diniyah Takmiliyah &bull; Arunika Kreatif Media
        </p>
      </footer>

      {/* MODAL AKSES PENGEMBANG / SUPER ADMIN */}
      {isDevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-brand-gold" />
                <h3 className="font-bold text-sm">Akses Pengembang / Super Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDevLogin} className="p-5 space-y-4 text-xs">
              {devError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {devError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN Pengembang / Super Admin:
                </label>
                <input
                  type="password"
                  value={devPin}
                  onChange={(e) => setDevPin(e.target.value)}
                  placeholder="Masukkan PIN (Default: 9999)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-green font-mono text-sm"
                  autoFocus
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  PIN bawaan pengembang: <code className="font-bold text-slate-700">9999</code>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL Master Registry Google Apps Script (/exec):
                </label>
                <input
                  type="url"
                  value={devMasterUrl}
                  onChange={(e) => setDevMasterUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-green font-mono text-xs text-slate-800"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  URL ini menjadi pusat verifikasi seluruh kode madrasah se-kabupaten.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDevModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Masuk Mode Pengembang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
