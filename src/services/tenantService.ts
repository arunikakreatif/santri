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

/**
 * Mendapatkan URL Google Apps Script Master Registry
 */
export const getMasterRegistryUrl = (): string => {
  return localStorage.getItem(STORAGE_KEY_MASTER_URL) || "";
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
  // Optional: URL Apps Script madrasah dibersihkan agar aman saat ganti akun
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
        appsScriptUrl: resData.data.appsScriptUrl,
        authenticatedAt: new Date().toISOString()
      };

      // Simpan session tenant & sambungkan otomatis ke spreadsheet madrasah
      setActiveTenant(tenantInfo);
      setAppsScriptUrl(tenantInfo.appsScriptUrl);

      // Cari atau buat profil madin lokal yang sesuai
      const list = getMadinList();
      let matched = list.find(m => m.nsm === tenantInfo.nsm || m.namaLembaga.toLowerCase() === tenantInfo.namaLembaga.toLowerCase());
      if (matched) {
        setActiveMadinId(matched.id || "madin-baiturrohman");
      } else {
        const created = await createMadin({
          namaLembaga: tenantInfo.namaLembaga,
          nsm: tenantInfo.nsm || "311235120000"
        });
        setActiveMadinId(created.id || "madin-baiturrohman");
      }

      // Tarik data awal dari sheet madrasah
      try {
        await syncAllDataFromSheets();
      } catch (err) {}

      return { success: true, message: "Aktivasi lembaga berhasil!", data: tenantInfo };
    } catch (e: any) {
      return { success: false, message: `Gagal menghubungi Master Registry: ${e?.message || e}` };
    }
  }

  // JIKA BELUM ADA MASTER REGISTRY URL (Mode Direct / Mandiri):
  // Memungkinkan memasukkan kode dan langsung login lokal
  const tenantInfo: TenantAuthData = {
    kode: cleanKode,
    namaLembaga: `MADRASAH DINIYAH ${cleanKode}`,
    appsScriptUrl: "",
    authenticatedAt: new Date().toISOString()
  };

  setActiveTenant(tenantInfo);
  return { 
    success: true, 
    message: "Masuk dengan kode lembaga lokal.", 
    data: tenantInfo 
  };
};
