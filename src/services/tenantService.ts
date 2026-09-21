/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setAppsScriptUrl, syncAllDataFromSheets, getProfil, createMadin, setActiveMadinId, getMadinList } from "./db";
import { ProfilLembaga } from "../types";

export interface TenantAuthData {
  kode: string;
  pin?: string;
  namaLembaga: string;
  nsm?: string;
  appsScriptUrl: string;
  authenticatedAt: string;
}

export type ActiveTenant = TenantAuthData;

const STORAGE_KEY_TENANT = "santri_active_tenant";
const STORAGE_KEY_MASTER_URL = "santri_master_registry_url";
const STORAGE_KEY_DEV_MODE = "santri_developer_mode";

/**
 * Memeriksa apakah pengguna login sebagai Pengembang / Super Admin
 */
export const isDeveloperSession = (): boolean => {
  return sessionStorage.getItem(STORAGE_KEY_DEV_MODE) === "true";
};

export const setDeveloperSession = (isDev: boolean): void => {
  if (isDev) {
    sessionStorage.setItem(STORAGE_KEY_DEV_MODE, "true");
  } else {
    sessionStorage.removeItem(STORAGE_KEY_DEV_MODE);
  }
};

/**
 * Mendapatkan URL Google Apps Script Master Registry
 */
export const getMasterRegistryUrl = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY_MASTER_URL);
  if (stored && stored.trim()) return stored.trim();
  const envUrl = (import.meta.env?.VITE_MASTER_REGISTRY_URL as string) || "";
  return envUrl.trim();
};

/**
 * Menyimpan URL Google Apps Script Master Registry
 */
export const setMasterRegistryUrl = (url: string): void => {
  if (!url.trim()) {
    localStorage.removeItem(STORAGE_KEY_MASTER_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_MASTER_URL, url.trim());
  }
};

/**
 * Mengambil data tenant yang sedang aktif login
 */
export const getActiveTenant = (): TenantAuthData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TENANT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

/**
 * Memeriksa apakah aplikasi sedang memiliki tenant aktif terautentikasi
 */
export const hasActiveTenant = (): boolean => {
  return !!getActiveTenant();
};

/**
 * Simpan data tenant aktif ke localStorage
 */
export const setActiveTenant = (tenant: TenantAuthData): void => {
  localStorage.setItem(STORAGE_KEY_TENANT, JSON.stringify(tenant));
};

/**
 * Logout / Keluar dari tenant saat ini
 */
export const clearActiveTenant = (): void => {
  localStorage.removeItem(STORAGE_KEY_TENANT);
  sessionStorage.removeItem(STORAGE_KEY_DEV_MODE);
  localStorage.removeItem("rab_apps_script_url");
};

/**
 * Login / Aktivasi tenant dengan kode unik & PIN
 */
export const authenticateTenant = async (
  kode: string, 
  pin: string = "",
  overrideMasterUrl?: string
): Promise<{ success: boolean; message: string; data?: TenantAuthData }> => {
  const cleanKode = kode.trim().toUpperCase();
  const cleanPin = pin.trim();

  if (!cleanKode) {
    return { success: false, message: "Kode lembaga wajib diisi." };
  }

  const masterUrl = (overrideMasterUrl || getMasterRegistryUrl()).trim();

  // Target madin ID terisolasi berdasarkan kode lembaga (misal: "madin-md01", "madin-md02")
  const targetMadinId = cleanKode === "MD01" ? "madin-baiturrohman" : `madin-${cleanKode.toLowerCase()}`;

  // Jika URL Master Registry sudah disetel oleh pengembang di sistem:
  if (masterUrl) {
    try {
      const target = `${masterUrl}?action=auth&kode=${encodeURIComponent(cleanKode)}&pin=${encodeURIComponent(cleanPin)}`;
      const resp = await fetch(target, { method: "GET" });
      if (!resp.ok) {
        return { success: false, message: `Server master mengembalikan status ${resp.status}.` };
      }
      const resData = await resp.json();
      if (!resData.success) {
        return { success: false, message: resData.message || "Gagal verifikasi kode lembaga." };
      }

      const tenantInfo: TenantAuthData = {
        kode: resData.data.kode,
        namaLembaga: resData.data.namaLembaga || `MADRASAH DINIYAH ${cleanKode}`,
        nsm: resData.data.nsm || "",
        appsScriptUrl: resData.data.appsScriptUrl || "",
        authenticatedAt: new Date().toISOString()
      };

      // Simpan session tenant & sambungkan otomatis ke spreadsheet madrasah
      setActiveTenant(tenantInfo);
      if (tenantInfo.appsScriptUrl) {
        setAppsScriptUrl(tenantInfo.appsScriptUrl);
      }

      // Cari atau buat profil madin lokal yang terisolasi untuk lembaga ini
      const list = getMadinList();
      let matched = list.find(m => m.id === targetMadinId || (tenantInfo.nsm && m.nsm === tenantInfo.nsm));
      if (matched) {
        // Update nama dan NSM jika berbeda
        matched.namaLembaga = tenantInfo.namaLembaga;
        if (tenantInfo.nsm) matched.nsm = tenantInfo.nsm;
        setActiveMadinId(matched.id || targetMadinId);
      } else {
        const created = await createMadin({
          id: targetMadinId,
          namaLembaga: tenantInfo.namaLembaga,
          nsm: tenantInfo.nsm || "311235120000"
        });
        setActiveMadinId(created.id || targetMadinId);
      }

      // Tarik data awal dari sheet madrasah jika url tersedia
      if (tenantInfo.appsScriptUrl) {
        try {
          await syncAllDataFromSheets();
        } catch (err) {}
      }

      return { success: true, message: "Aktivasi lembaga berhasil!", data: tenantInfo };
    } catch (e: any) {
      return { success: false, message: `Gagal menghubungi Master Registry: ${e?.message || e}` };
    }
  }

  // JIKA BELUM ADA MASTER REGISTRY URL (Mode Direct / Mandiri):
  // Memungkinkan memasukkan kode dan langsung login lokal
  const tenantInfo: TenantAuthData = {
    kode: cleanKode,
    namaLembaga: cleanKode === "MD01" ? 'MADRASAH DINIYAH "BAITURROHMAN"' : `MADRASAH DINIYAH ${cleanKode}`,
    appsScriptUrl: "",
    authenticatedAt: new Date().toISOString()
  };

  setActiveTenant(tenantInfo);
  setActiveMadinId(targetMadinId);

  return { 
    success: true, 
    message: "Masuk dengan kode lembaga lokal.", 
    data: tenantInfo 
  };
};
