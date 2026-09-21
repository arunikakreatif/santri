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
  ExternalLink, 
  X, 
  Sparkles, 
  RefreshCw, 
  LogOut,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { 
  getActiveTenant, 
  authenticateTenant, 
  clearActiveTenant, 
  getMasterRegistryUrl,
  setMasterRegistryUrl,
  TenantAuthData 
} from "../services/tenantService";

interface AktivasiLembagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tenant: TenantAuthData) => void;
  initialCode?: string;
}

export default function AktivasiLembagaModal({
  isOpen,
  onClose,
  onSuccess,
  initialCode = ""
}: AktivasiLembagaModalProps) {
  const [activeTenant, setActiveTenantState] = useState<TenantAuthData | null>(getActiveTenant());
  const [kode, setKode] = useState<string>(initialCode);
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Advanced developer option (Master URL)
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [masterUrl, setMasterUrl] = useState<string>(getMasterRegistryUrl());

  useEffect(() => {
    if (isOpen) {
      setActiveTenantState(getActiveTenant());
      if (initialCode) {
        setKode(initialCode.toUpperCase());
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialCode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await authenticateTenant(kode, pin, masterUrl);
      if (res.success && res.data) {
        setSuccessMsg(`Berhasil terhubung ke ${res.data.namaLembaga}!`);
        setActiveTenantState(res.data);
        setTimeout(() => {
          onSuccess(res.data!);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message || "Gagal melakukan aktivasi kode lembaga.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat memverifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari lembaga ini? Anda dapat masuk kembali dengan kode unik.")) {
      clearActiveTenant();
      setActiveTenantState(null);
      setKode("");
      setPin("");
      setSuccessMsg("Berhasil keluar dari akun lembaga.");
    }
  };

  const handleSaveMasterUrl = () => {
    setMasterRegistryUrl(masterUrl);
    alert("URL Master Registry pengembang berhasil disimpan!");
    setShowConfig(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                {activeTenant ? "Akun Lembaga Aktif" : "Aktivasi Akses Madrasah"}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Multi-Tenant SANTRI BPPDGS
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          
          {/* Status jika sudah login */}
          {activeTenant ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    Sedang Terhubung:
                  </p>
                  <p className="font-bold text-sm text-slate-800 mt-0.5 leading-snug">
                    {activeTenant.namaLembaga}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">
                      Kode: {activeTenant.kode}
                    </span>
                    {activeTenant.nsm && (
                      <span className="text-slate-500 font-mono">
                        NSM: {activeTenant.nsm}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700">
                  Spreadsheet terhubung aktif
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Ganti / Keluar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Silakan masukkan <strong>Kode Unik Lembaga</strong> dan <strong>PIN</strong> yang telah diberikan oleh pengembang/koordinator untuk menyambungkan aplikasi ke Google Spreadsheet madrasah Anda.
              </p>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Unik Lembaga
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={kode}
                      onChange={(e) => setKode(e.target.value.toUpperCase())}
                      placeholder="Contoh: MD01, MD02, atau BAITURROHMAN"
                      className="w-full pl-9 pr-3 py-2 text-sm uppercase font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN / Password Lembaga <span className="text-slate-400 font-normal">(jika diatur)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Masukkan PIN / Sandi"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !kode.trim()}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memverifikasi Kode...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Aktivasi &amp; Hubungkan Data
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Konfigurasi Master Registry bagi Pengembang */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium transition cursor-pointer"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showConfig ? "rotate-90" : ""}`} />
              Pengaturan URL Master Registry (Pengembang)
            </button>

            {showConfig && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="text-[11px] text-slate-600">
                  Tautan Google Apps Script dari <strong>Spreadsheet Pusat Pengembang</strong> yang memvalidasi kode unik:
                </p>
                <input
                  type="url"
                  value={masterUrl}
                  onChange={(e) => setMasterUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-2.5 py-1.5 text-[11px] font-mono rounded border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={handleSaveMasterUrl}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-[11px] font-bold"
                >
                  Simpan URL Master
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
