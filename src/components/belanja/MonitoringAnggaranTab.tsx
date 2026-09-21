/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  BarChart3, 
  Search, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  PieChart,
  ShieldCheck,
  Building2
} from "lucide-react";
import { RABItemWithBudget, ProfilLembaga } from "../../types";

interface MonitoringAnggaranTabProps {
  profil: ProfilLembaga;
  tahun: string;
  items: RABItemWithBudget[];
  onNavigateToKwitansi: () => void;
}

export default function MonitoringAnggaranTab({
  profil,
  tahun,
  items,
  onNavigateToKwitansi
}: MonitoringAnggaranTabProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Summary computations
  const totalAnggaran = items.reduce((sum, it) => sum + it.jumlah_anggaran, 0);
  const totalTerpakai = items.reduce((sum, it) => sum + it.total_terpakai, 0);
  const totalSisa = items.reduce((sum, it) => sum + it.sisa_anggaran, 0);
  const persentaseTotal = totalAnggaran > 0 ? (totalTerpakai / totalAnggaran) * 100 : 0;

  // Filter items
  const filteredItems = items.filter(it => {
    const matchSearch = 
      it.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.komponenNama.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "HABIS") {
      return matchSearch && it.sisa_anggaran === 0 && it.total_terpakai > 0;
    }
    if (statusFilter === "MENIPIS") {
      const pct = it.jumlah_anggaran > 0 ? (it.total_terpakai / it.jumlah_anggaran) * 100 : 0;
      return matchSearch && pct >= 80 && it.sisa_anggaran > 0;
    }
    if (statusFilter === "BELUM") {
      return matchSearch && it.total_terpakai === 0;
    }
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner KPI Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Monitoring Penyerapan Anggaran RAB TA {tahun}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {profil.namaLembaga} — Tracking realisasi belanja langsung terhadap pos anggaran RAB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToKwitansi}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              + Buat Belanja Kwitansi
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Realisasi Penyerapan: {persentaseTotal.toFixed(1)}%</span>
            <span>
              Rp {totalTerpakai.toLocaleString("id-ID")} / Rp {totalAnggaran.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, persentaseTotal)}%` }}
            />
          </div>
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Pagu/Penyusunan RAB</span>
            <p className="text-base font-black text-slate-900 mt-0.5">Rp {totalAnggaran.toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Terealisasi (Terpakai)</span>
            <p className="text-base font-black text-emerald-900 mt-0.5">Rp {totalTerpakai.toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase">Total Sisa Anggaran Tersedia</span>
            <p className="text-base font-black text-blue-900 mt-0.5">Rp {totalSisa.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari uraian pos belanja atau komponen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">Semua Status ({items.length})</option>
            <option value="BELUM">Belum Ada Realisasi</option>
            <option value="MENIPIS">Anggaran Menipis (≥80%)</option>
            <option value="HABIS">Anggaran Habis (100%)</option>
          </select>
        </div>
      </div>

      {/* Items Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Komponen & Uraian Item Belanja</th>
                <th className="p-4 text-center">Volume</th>
                <th className="p-4 text-right">Harga Satuan</th>
                <th className="p-4 text-right">Jumlah Anggaran</th>
                <th className="p-4 text-right">Total Terpakai</th>
                <th className="p-4 text-right">Sisa Anggaran</th>
                <th className="p-4 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const percent = item.jumlah_anggaran > 0 ? (item.total_terpakai / item.jumlah_anggaran) * 100 : 0;
                
                let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                let badgeText = "Belum Terpakai";
                if (item.sisa_anggaran === 0 && item.total_terpakai > 0) {
                  badgeColor = "bg-red-100 text-red-800 border-red-200";
                  badgeText = "Habis";
                } else if (percent >= 80) {
                  badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                  badgeText = "Menipis";
                } else if (percent > 0) {
                  badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  badgeText = `${percent.toFixed(0)}% Terpakai`;
                }

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/75 transition">
                    <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-xs">{item.uraian}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.komponenNama}</p>
                    </td>
                    <td className="p-4 text-center text-slate-700 font-medium">
                      {item.jumlah} {item.satuan} x {item.volume} {item.satuanVolume}
                    </td>
                    <td className="p-4 text-right text-slate-700">
                      Rp {item.satuanHarga.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      Rp {item.jumlah_anggaran.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-right font-semibold text-amber-800">
                      Rp {item.total_terpakai.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-right font-bold text-blue-900 text-sm">
                      Rp {item.sisa_anggaran.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
