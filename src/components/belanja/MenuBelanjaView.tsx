/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShoppingBag, 
  Coins, 
  Receipt, 
  FileSpreadsheet, 
  Wallet, 
  BarChart3, 
  Calendar,
  Building2,
  AlertCircle,
  FileText
} from "lucide-react";
import { 
  ProfilLembaga, 
  RABData, 
  PenerimaanDana, 
  Kwitansi, 
  RABItemWithBudget 
} from "../../types";
import { 
  getPenerimaanDanaList, 
  getKwitansiList, 
  calculateBkpRows,
  getRabItemsWithBudget
} from "../../services/db";

import PenerimaanDanaTab from "./PenerimaanDanaTab";
import KwitansiTab from "./KwitansiTab";
import BkpTab from "./BkpTab";
import BkuTab from "./BkuTab";
import LppTab from "./LppTab";
import MonitoringAnggaranTab from "./MonitoringAnggaranTab";

interface MenuBelanjaViewProps {
  profil: ProfilLembaga;
  rabList: RABData[];
  initialSubTab?: string;
  onNavigate: (tab: string, param?: any) => void;
}

export default function MenuBelanjaView({
  profil,
  rabList,
  initialSubTab = "kwitansi",
  onNavigate
}: MenuBelanjaViewProps) {
  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentY = new Date().getFullYear().toString();
    years.add(currentY);
    rabList.forEach(r => years.add(r.tahun));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [rabList]);

  // Selected Year
  const [selectedTahun, setSelectedTahun] = useState<string>(
    availableYears[0] || new Date().getFullYear().toString()
  );

  // Belanja Datasets for active Madin and Tahun
  const [penerimaanList, setPenerimaanList] = useState<PenerimaanDana[]>([]);
  const [kwitansiList, setKwitansiList] = useState<Kwitansi[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Load Belanja Data
  const loadBelanjaData = () => {
    const pList = getPenerimaanDanaList(profil.id);
    const kList = getKwitansiList(profil.id, selectedTahun);
    setPenerimaanList(pList);
    setKwitansiList(kList);
  };

  useEffect(() => {
    loadBelanjaData();
  }, [profil.id, selectedTahun, refreshKey]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Find RAB for selected year
  const activeRab = useMemo(() => {
    return rabList.find(r => r.tahun === selectedTahun) || null;
  }, [rabList, selectedTahun]);

  // Derived Budgeting Items
  const rabItemsWithBudget: RABItemWithBudget[] = useMemo(() => {
    if (!activeRab) return [];
    return getRabItemsWithBudget(activeRab, kwitansiList);
  }, [activeRab, kwitansiList]);

  // BKP data
  const bkpData = useMemo(() => {
    return calculateBkpRows(profil.id || "madin-baiturrohman", selectedTahun);
  }, [profil.id, selectedTahun, refreshKey, kwitansiList, penerimaanList]);

  // Active penerimaan for selected year
  const currentYearPenerimaan = useMemo(() => {
    return penerimaanList.find(p => p.tahun === selectedTahun) || null;
  }, [penerimaanList, selectedTahun]);

  // Sub-tabs list
  const subTabs = [
    { id: "penerimaan", label: "Penerimaan Dana Hibah", icon: Coins, count: currentYearPenerimaan ? 1 : 0 },
    { id: "kwitansi", label: "Kwitansi Belanja", icon: Receipt, count: kwitansiList.length },
    { id: "bkp", label: "Buku Kas Pembantu", icon: FileSpreadsheet },
    { id: "bku", label: "Buku Kas Umum", icon: Wallet },
    { id: "lpp", label: "Laporan Pelaksanaan (LPP)", icon: FileText, count: activeRab?.komponenList?.reduce((acc, c) => acc + (c.items ? c.items.length : 0), 0) || 0 },
    { id: "monitoring", label: "Monitoring Anggaran RAB", icon: BarChart3, count: rabItemsWithBudget.length },
  ];

  return (
    <div className="space-y-6" id="menu-belanja-container">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/30">
                MODUL REALISASI & SPJ
              </span>
              <span className="text-slate-400 text-xs font-semibold">
                ● Multi-Madin Aktif
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">
              Menu Belanja & Buku Kas
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pengelolaan pencairan hibah, transaksi kwitansi belanja realisasi, otomatisasi pembukuan <strong>Format 11 (Buku Kas Pembantu)</strong> dan <strong>Buku Kas Umum</strong> per Madrasah Diniyah.
            </p>
          </div>

          {/* Selector Tahun Anggaran */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0 space-y-1.5">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
              Tahun Anggaran Berjalan
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="bg-slate-900 text-white font-bold text-sm px-3 py-1.5 rounded-xl border border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>TA {yr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip inside Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Pencairan Dana (Hibah)</span>
            <p className="text-base md:text-lg font-black text-emerald-400 mt-0.5">
              Rp {(currentYearPenerimaan?.jumlah || 0).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Belanja Kwitansi</span>
            <p className="text-base md:text-lg font-black text-amber-300 mt-0.5">
              Rp {bkpData.totalPengeluaran.toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Sisa Kas Tersedia</span>
            <p className="text-base md:text-lg font-black text-blue-300 mt-0.5">
              Rp {bkpData.saldoAkhir.toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Jumlah Kwitansi</span>
            <p className="text-base md:text-lg font-black text-white mt-0.5">
              {kwitansiList.length} Lembar
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 print:hidden">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Tab View Content */}
      <div className="pt-2">
        {activeSubTab === "penerimaan" && (
          <PenerimaanDanaTab
            profil={profil}
            penerimaanList={penerimaanList}
            onRefresh={handleRefresh}
            onNavigateToBelanja={(t) => setActiveSubTab(t)}
          />
        )}

        {activeSubTab === "kwitansi" && (
          <KwitansiTab
            profil={profil}
            kwitansiList={kwitansiList}
            activeRab={activeRab}
            selectedTahun={selectedTahun}
            onRefresh={handleRefresh}
          />
        )}

        {activeSubTab === "bkp" && (
          <BkpTab
            profil={profil}
            tahun={selectedTahun}
            bkpData={bkpData}
            onNavigateToPenerimaan={() => setActiveSubTab("penerimaan")}
            onNavigateToKwitansi={() => setActiveSubTab("kwitansi")}
          />
        )}

        {activeSubTab === "bku" && (
          <BkuTab
            profil={profil}
            tahun={selectedTahun}
          />
        )}

        {activeSubTab === "lpp" && (
          <LppTab
            profil={profil}
            rab={activeRab}
            tahun={selectedTahun}
            onNavigateToRab={() => onNavigate("susun", { editTahun: selectedTahun })}
          />
        )}

        {activeSubTab === "monitoring" && (
          <MonitoringAnggaranTab
            profil={profil}
            tahun={selectedTahun}
            items={rabItemsWithBudget}
            onNavigateToKwitansi={() => setActiveSubTab("kwitansi")}
          />
        )}
      </div>

    </div>
  );
}
