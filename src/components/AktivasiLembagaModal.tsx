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
  X, 
  Sparkles, 
  RefreshCw, 
  LogOut,
  ShieldCheck,
  ArrowRight,
  Database,
  Check,
  CalendarCheck,
  FileCheck2
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
  onLogout?: () => void;
  initialCode?: string;
}

export default function AktivasiLembagaModal({
  isOpen,
  onClose,
  onSuccess,
  onLogout,
  initialCode = ""
}: AktivasiLembagaModalProps) {
  const [activeTenant, setActiveTenantState] = useState<TenantAuthData | null>(getActiveTenant());
  const [kode, setKode] = useState<string>(initialCode);
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      const res = await authenticateTenant(kode, pin);
      if (res.success && res.data) {
        setSuccessMsg(`Berhasil terhubung ke ${res.data.namaLembaga}!`);
        setActiveTenantState(res.data);
        setTimeout(() => {
          onSuccess(res.data!);
        }, 500);
      } else {
        setErrorMsg(res.message || "Gagal melakukan aktivasi kode lembaga.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat memverifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerLogout = () => {
    onClose();
    if (onLogout) {
      onLogout();
    } else {
      clearActiveTenant();
      setActiveTenantState(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER - ISLAMIC PRESTIGE STYLE */}
        <div className="bg-gradient-to-r from-brand-green-dark via-[#0E271D] to-[#0A1B14] text-white p-6 relative border-b border-brand-gold/30">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/40 uppercase tracking-wider">
                  BPPGDS Madrasah Diniyah
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-white font-display mt-0.5 leading-tight">
                Selamat Datang di SANTRI
              </h3>
              <p className="text-xs text-slate-300">
                Sistem Administrasi &amp; Transparansi Realisasi Hibah
              </p>
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5">
          
          {/* TAMPILAN SAMBUTAN UTAMA JIKA SUDAH LOGIN / TERHUBUNG */}
          {activeTenant ? (
            <div className="space-y-4">
              
              {/* Status Banner "Sistem Siap Dijalankan" */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200/80 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-xs shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                        Sistem Siap Dijalankan
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        Terverifikasi
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Akun lembaga Anda telah terhubung secara resmi. Seluruh modul administrasi, anggaran, dan pelaporan SPJ telah terisolasi aman untuk madrasah Anda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kartu Profil Lembaga Terhubung */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nama Lembaga Terdaftar:
                  </span>
                  <p className="font-extrabold text-sm text-brand-green-dark mt-0.5 leading-snug">
                    {activeTenant.namaLembaga}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-medium block">Kode Akses:</span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">
                      {activeTenant.kode}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-medium block">Nomor Statistik (NSM):</span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">
                      {activeTenant.nsm || "311235120145"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Database &amp; Spreadsheet Siap Aktif</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Thn: {new Date().getFullYear()}
                  </span>
                </div>
              </div>

              {/* Fitur yang Siap Dijalankan */}
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Kelengkapan Berkas Siap Kelola:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                    <span>Penyusunan Rencana Anggaran (RAB)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                    <span>Buku Kas Umum (BKU) Otomatis</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                    <span>Kwitansi Belanja &amp; Tanda Bukti</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                    <span>Cetak Lembar SPJ Resmi BPPGDS</span>
                  </div>
                </div>
              </div>

              {/* Tombol Utama Mulai Kerja */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-green to-emerald-700 hover:from-emerald-700 hover:to-brand-green text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-brand-gold" />
                  <span>Mulai Kelola Anggaran &amp; SPJ</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Ingin mengganti akun?</span>
                  <button
                    type="button"
                    onClick={handleTriggerLogout}
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Keluar / Ganti Lembaga</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* FORM JIKA BELUM LOGIN (CADANGAN) */
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Silakan masukkan <strong>Kode Akses Lembaga</strong> dan <strong>PIN</strong> untuk mengakses data khusus madrasah Anda.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Akses Lembaga:
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value.toUpperCase())}
                    placeholder="Contoh: MD01, MD02"
                    className="w-full pl-9 pr-3 py-2 text-sm uppercase font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Keamanan Lembaga:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masukkan PIN"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !kode.trim()}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-brand-gold" />
                    <span>Masuk ke Portal Lembaga</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
