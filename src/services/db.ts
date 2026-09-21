/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ProfilLembaga, 
  RABData, 
  KOMPONEN_DEFAULT_LIST,
  PenerimaanDana,
  Kwitansi,
  BkpRow,
  BkuBulanData,
  BkuItem,
  RABItemWithBudget
} from "../types";

// Generates unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Multi-Madin Master Data
export const MADIN_DEFAULT_LIST: ProfilLembaga[] = [
  {
    id: "madin-baiturrohman",
    namaLembaga: 'MADRASAH DINIYAH "BAITURROHMAN"',
    nsm: "311235120145",
    alamat: "Jl. Kyai Ageng Gribig No. 12, Kelurahan Sukomaju, Kecamatan Kawedanan, Kabupaten Magetan",
    logo: "", // Base64 or empty
    namaKepala: "KH. MUHAMMAD SYAFII, S.Pd.I.",
    namaBendahara: "UST. ABDUL WAHID, S.Pd.I.",
    kotaTanggal: "Magetan, 31 Desember 2025",
    sumberDanaOptions: ["DAU", "BKK"],
    desa: "Sukomaju",
    kecamatan: "Kawedanan",
    kabupaten: "Magetan"
  },
  {
    id: "madin-alhidayah",
    namaLembaga: 'MADRASAH DINIYAH "AL-HIDAYAH"',
    nsm: "311235120188",
    alamat: "Jl. Diponegoro No. 45, Desa Bogem, Kecamatan Kawedanan, Kabupaten Magetan",
    logo: "",
    namaKepala: "UST. H. MANSYUR, M.Pd.I.",
    namaBendahara: "USTZH. SITI MARYAM, S.Pd.",
    kotaTanggal: "Magetan, 31 Desember 2025",
    sumberDanaOptions: ["DAU", "BKK"],
    desa: "Bogem",
    kecamatan: "Kawedanan",
    kabupaten: "Magetan"
  }
];

// Default Profile Data (pointing to active or first Madin)
export const PROFIL_DEFAULT: ProfilLembaga = MADIN_DEFAULT_LIST[0];

// Fixed IDs for initial item linking
const ID_HONOR = "item-honor-2025-01";
const ID_KITAB_AQIDAH = "item-kitab-2025-01";
const ID_KITAB_SAFINAH = "item-kitab-2025-02";
const ID_KITAB_KHULASHOH = "item-kitab-2025-03";

// Realistic Mock RAB for 2025
export const RAB_DEFAULT_2025: RABData = {
  id: "rab-2025-baiturrohman",
  madinId: "madin-baiturrohman",
  tahun: "2025",
  sumberDana: "DAU",
  totalAnggaran: 19520000,
  paguAnggaran: 20000000,
  createdAt: new Date("2025-01-05T08:00:00Z").toISOString(),
  updatedAt: new Date("2025-01-05T10:30:00Z").toISOString(),
  komponenList: [
    {
      nama: "Pembayaran honorarium guru / ustadz / ustadzah",
      items: [
        { id: ID_HONOR, uraian: "Honorarium Rutin Ustadz/Ustadzah Pengajar", jumlah: 2, satuan: "Orang", volume: 12, satuanVolume: "Bulan", satuanHarga: 200000, total: 4800000 }
      ]
    },
    {
      nama: "Pembelian/pengadaan buku teks pelajaran",
      items: [
        { id: ID_KITAB_AQIDAH, uraian: "Kitab Aqidatul Awam (Tauhid)", jumlah: 30, satuan: "Buku", volume: 1, satuanVolume: "Tahun", satuanHarga: 15000, total: 450000 },
        { id: ID_KITAB_SAFINAH, uraian: "Kitab Safinatun Najah (Fiqih)", jumlah: 30, satuan: "Buku", volume: 1, satuanVolume: "Tahun", satuanHarga: 12000, total: 360000 },
        { id: ID_KITAB_KHULASHOH, uraian: "Kitab Khulashoh Nurul Yaqin (Sejarah)", jumlah: 30, satuan: "Buku", volume: 1, satuanVolume: "Tahun", satuanHarga: 20000, total: 600000 }
      ]
    },
    {
      nama: "Kegiatan PPDB (penerimaan siswa baru)",
      items: [
        { id: generateId(), uraian: "Cetak Formulir Pendaftaran PPDB", jumlah: 100, satuan: "Lembar", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 1000, total: 100000 },
        { id: generateId(), uraian: "Banner Sosialisasi PPDB (3x1 meter)", jumlah: 2, satuan: "Buah", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 75000, total: 150000 },
        { id: generateId(), uraian: "Konsumsi Rapat Panitia PPDB", jumlah: 10, satuan: "Orang", volume: 2, satuanVolume: "Hari", satuanHarga: 20000, total: 400000 }
      ]
    },
    {
      nama: "Kegiatan pembelajaran & PBM",
      items: [
        { id: generateId(), uraian: "Buku Absensi & Jurnal Kelas", jumlah: 6, satuan: "Buku", volume: 1, satuanVolume: "Tahun", satuanHarga: 15000, total: 90000 },
        { id: generateId(), uraian: "Alat Peraga Praktikum Wudhu & Shalat", jumlah: 2, satuan: "Set", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 250000, total: 500000 },
        { id: generateId(), uraian: "Pendaftaran & Konsumsi Lomba Porseni", jumlah: 5, satuan: "Orang", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 100000, total: 500000 }
      ]
    },
    {
      nama: "Penggandaan bahan pembelajaran, surat, soal ujian/ulangan, berkas",
      items: [
        { id: generateId(), uraian: "Cetak Lembar Soal Penilaian Akhir Semester (PAS)", jumlah: 60, satuan: "Siswa", volume: 2, satuanVolume: "Semester", satuanHarga: 10000, total: 1200000 },
        { id: generateId(), uraian: "Cetak Buku Raport Santri Diniyah", jumlah: 60, satuan: "Buah", volume: 1, satuanVolume: "Tahun", satuanHarga: 15000, total: 900000 }
      ]
    },
    {
      nama: "Pengadaan bahan habis pakai",
      items: [
        { id: generateId(), uraian: "Kertas HVS A4 80gr untuk administrasi", jumlah: 6, satuan: "Rim", volume: 1, satuanVolume: "Tahun", satuanHarga: 55000, total: 330000 },
        { id: generateId(), uraian: "Tinta Printer Hitam & Warna (Epson)", jumlah: 4, satuan: "Botol", volume: 1, satuanVolume: "Tahun", satuanHarga: 110000, total: 440000 },
        { id: generateId(), uraian: "Konsumsi Rapat Wali Santri & Komite Madrasah", jumlah: 40, satuan: "Orang", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 25000, total: 1000000 }
      ]
    },
    {
      nama: "Peningkatan mutu pendidik",
      items: [
        { id: generateId(), uraian: "Transport Mengikuti Workshop Kurikulum KKG", jumlah: 4, satuan: "Orang", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 150000, total: 600000 },
        { id: generateId(), uraian: "Konsumsi Rapat Guru & Peningkatan Kompetensi", jumlah: 10, satuan: "Orang", volume: 1, satuanVolume: "Kegiatan", satuanHarga: 30000, total: 300000 }
      ]
    },
    {
      nama: "Operasional & manajemen pengelolaan BPPDGS",
      items: [
        { id: generateId(), uraian: "Transport/Insentif Bendahara Mengelola Dana", jumlah: 1, satuan: "Orang", volume: 12, satuanVolume: "Bulan", satuanHarga: 250000, total: 3000000 },
        { id: generateId(), uraian: "Transport/Insentif Penanggung Jawab Program", jumlah: 1, satuan: "Orang", volume: 12, satuanVolume: "Bulan", satuanHarga: 300000, total: 3600000 },
        { id: generateId(), uraian: "Penyusunan & Penggandaan Berkas Laporan LPJ", jumlah: 4, satuan: "Bendel", volume: 1, satuanVolume: "Tahun", satuanHarga: 50000, total: 200000 }
      ]
    }
  ]
};

// Initial Penerimaan Dana default
export const PENERIMAAN_DANA_DEFAULT: PenerimaanDana[] = [
  {
    id: "pen-2025-baiturrohman",
    madinId: "madin-baiturrohman",
    tahun: "2025",
    tanggal: "2025-01-10",
    sumberDana: "DAU Kabupaten",
    jumlah: 20000000,
    keterangan: "Pencairan Dana Hibah DAU Kabupaten TA 2025",
    createdAt: new Date("2025-01-10T08:00:00Z").toISOString()
  },
  {
    id: "pen-2026-baiturrohman",
    madinId: "madin-baiturrohman",
    tahun: "2026",
    tanggal: "2026-09-01",
    sumberDana: "DAU Kabupaten",
    jumlah: 20000000,
    keterangan: "Pencairan Dana Hibah DAU Kabupaten TA 2026",
    createdAt: new Date("2026-09-01T08:00:00Z").toISOString()
  }
];

// Initial Kwitansi sample default
export const KWITANSI_DEFAULT: Kwitansi[] = [
  {
    id: "kwt-2025-01",
    madinId: "madin-baiturrohman",
    tahun: "2025",
    nomorKwitansi: "01/DAU/2025",
    sumberDana: "DAU Kabupaten",
    tanggal: "2025-01-25",
    telahTerimaDari: 'Bendahara Madrasah Diniyah "BAITURROHMAN"',
    penerima: "Ust. Ahmad Fauzi (Perwakilan Pengajar)",
    items: [
      {
        id: "kwt-item-1",
        rabItemId: ID_HONOR,
        uraianItem: "Honorarium Rutin Ustadz/Ustadzah Pengajar Bulan Januari (2 Orang)",
        jumlahRealisasi: 400000
      }
    ],
    totalJumlah: 400000,
    uraianPembayaran: "Pembayaran Honorarium Rutin Ustadz/Ustadzah Pengajar Bulan Januari (2 Orang)",
    terbilang: "Empat Ratus Ribu Rupiah",
    namaKepala: "KH. MUHAMMAD SYAFII, S.Pd.I.",
    namaBendahara: "UST. ABDUL WAHID, S.Pd.I.",
    namaPenerima: "Ust. Ahmad Fauzi",
    createdAt: new Date("2025-01-25T09:00:00Z").toISOString()
  },
  {
    id: "kwt-2025-02",
    madinId: "madin-baiturrohman",
    tahun: "2025",
    nomorKwitansi: "02/DAU/2025",
    sumberDana: "DAU Kabupaten",
    tanggal: "2025-02-12",
    telahTerimaDari: 'Bendahara Madrasah Diniyah "BAITURROHMAN"',
    penerima: "Toko Kitab Makmur",
    items: [
      {
        id: "kwt-item-2a",
        rabItemId: ID_KITAB_AQIDAH,
        uraianItem: "Kitab Aqidatul Awam (Tauhid) 30 Buku",
        jumlahRealisasi: 450000
      },
      {
        id: "kwt-item-2b",
        rabItemId: ID_KITAB_SAFINAH,
        uraianItem: "Kitab Safinatun Najah (Fiqih) 30 Buku",
        jumlahRealisasi: 360000
      }
    ],
    totalJumlah: 810000,
    uraianPembayaran: "Pengadaan Kitab Aqidatul Awam (Tauhid) 30 Buku dan Kitab Safinatun Najah (Fiqih) 30 Buku",
    terbilang: "Delapan Ratus Sepuluh Ribu Rupiah",
    namaKepala: "KH. MUHAMMAD SYAFII, S.Pd.I.",
    namaBendahara: "UST. ABDUL WAHID, S.Pd.I.",
    namaPenerima: "Toko Kitab Makmur (H. Sobirin)",
    createdAt: new Date("2025-02-12T10:00:00Z").toISOString()
  }
];

// Initial setup helper to pre-fill LocalStorage if empty
export const initializeLocalStorage = () => {
  // Multi-Madin List
  if (!localStorage.getItem("madin_list")) {
    localStorage.setItem("madin_list", JSON.stringify(MADIN_DEFAULT_LIST));
  }
  if (!localStorage.getItem("active_madin_id")) {
    localStorage.setItem("active_madin_id", "madin-baiturrohman");
  }

  // Legacy compatibility: rab_profil
  if (!localStorage.getItem("rab_profil")) {
    localStorage.setItem("rab_profil", JSON.stringify(PROFIL_DEFAULT));
  }

  // RAB List
  if (!localStorage.getItem("rab_list")) {
    localStorage.setItem("rab_list", JSON.stringify([RAB_DEFAULT_2025]));
  } else {
    // Ensure existing RABs have madinId
    try {
      const list: RABData[] = JSON.parse(localStorage.getItem("rab_list") || "[]");
      let changed = false;
      list.forEach(r => {
        if (!r.madinId) {
          r.madinId = "madin-baiturrohman";
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("rab_list", JSON.stringify(list));
      }
    } catch (e) {
      // ignore
    }
  }

  // Penerimaan Dana List
  if (!localStorage.getItem("penerimaan_dana_list")) {
    localStorage.setItem("penerimaan_dana_list", JSON.stringify(PENERIMAAN_DANA_DEFAULT));
  }

  // Kwitansi List
  if (!localStorage.getItem("kwitansi_list")) {
    localStorage.setItem("kwitansi_list", JSON.stringify(KWITANSI_DEFAULT));
  }
};

// Initialize right away when imported
initializeLocalStorage();

// --- GOOGLE APPS SCRIPT SETTINGS & NORMALIZATION ---

export const normalizeAppsScriptUrl = (rawUrl: string): string => {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  // Strip outer quotes
  url = url.replace(/^["']+|["']+$/g, "").trim();

  // If user accidentally pasted the spreadsheet URL, it's not a Web App endpoint
  if (url.includes("docs.google.com/spreadsheets")) {
    return "";
  }

  // If it's a script.google.com URL:
  if (url.includes("script.google.com/macros/s/")) {
    // Strip trailing query parameters if already present
    const basePart = url.split("?")[0];
    if (basePart.endsWith("/dev")) {
      url = basePart.replace(/\/dev$/, "/exec");
    } else if (!basePart.endsWith("/exec")) {
      url = basePart.replace(/\/+$/, "") + "/exec";
    } else {
      url = basePart;
    }
  }

  return url;
};

export const isValidAppsScriptUrl = (rawUrl: string): boolean => {
  const norm = normalizeAppsScriptUrl(rawUrl);
  return !!norm && norm.startsWith("https://script.google.com/macros/s/") && norm.endsWith("/exec");
};

export const getAppsScriptUrl = (): string => {
  const raw = localStorage.getItem("rab_apps_script_url") || "";
  return normalizeAppsScriptUrl(raw);
};

export const setAppsScriptUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) {
    localStorage.removeItem("rab_apps_script_url");
    return;
  }
  const normalized = normalizeAppsScriptUrl(trimmed);
  if (normalized) {
    localStorage.setItem("rab_apps_script_url", normalized);
  } else {
    // If it's invalid (e.g. spreadsheet URL), save as-is so user can see what they typed and fix it
    localStorage.setItem("rab_apps_script_url", trimmed);
  }
};

export const isSheetsConnected = (): boolean => {
  const raw = localStorage.getItem("rab_apps_script_url") || "";
  return isValidAppsScriptUrl(raw);
};

/**
 * Sends a JSON POST request to Google Apps Script safely without breaking on errors.
 */
const postToAppsScript = async (payload: any): Promise<{ success: boolean; error?: string }> => {
  const url = getAppsScriptUrl();
  if (!url || !isValidAppsScriptUrl(url)) {
    return { success: false, error: "URL Apps Script belum valid atau belum disetel." };
  }

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors", // Use no-cors to prevent preflight CORS block on Apps Script Web App
      headers: {
        "Content-Type": "text/plain" // Apps Script doPost gets this nicely as e.postData.contents
      },
      body: JSON.stringify(payload)
    });
    return { success: true };
  } catch (error: any) {
    console.warn("Gagal sinkronisasi data ke Google Sheets (tetap tersimpan di penyimpanan lokal):", error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
};

const getFromAppsScript = async (action: string, extraParams: string = ""): Promise<any> => {
  const url = getAppsScriptUrl();
  if (!url || !isValidAppsScriptUrl(url)) {
    return null;
  }

  const separator = url.includes("?") ? "&" : "?";
  const fetchUrl = `${url}${separator}action=${action}${extraParams}`;

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.warn(`Sinkronisasi Google Sheets (${action}) mengembalikan status HTTP ${response.status}. Menggunakan data lokal.`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.warn(`Sinkronisasi Google Sheets (${action}) tidak dapat dihubungi (${error?.message || error}). Menggunakan data lokal.`);
    return null;
  }
};

// --- PROFIL LEMBAGA & MULTI-MADIN SERVICE ---

export const getMadinList = (): ProfilLembaga[] => {
  const local = localStorage.getItem("madin_list");
  if (!local) {
    localStorage.setItem("madin_list", JSON.stringify(MADIN_DEFAULT_LIST));
    return MADIN_DEFAULT_LIST;
  }
  try {
    const parsed: ProfilLembaga[] = JSON.parse(local);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    // fallback
  }
  return MADIN_DEFAULT_LIST;
};

export const getActiveMadinId = (): string => {
  const activeId = localStorage.getItem("active_madin_id");
  if (activeId) return activeId;
  const list = getMadinList();
  const firstId = list[0]?.id || "madin-baiturrohman";
  localStorage.setItem("active_madin_id", firstId);
  return firstId;
};

export const setActiveMadinId = (id: string): void => {
  localStorage.setItem("active_madin_id", id);
  const list = getMadinList();
  const found = list.find(m => m.id === id);
  if (found) {
    localStorage.setItem("rab_profil", JSON.stringify(found));
  }
};

export const cleanKabupatenName = (kab?: string): string => {
  if (!kab) return "Magetan";
  // Pisahkan jika ada koma (misal: "Magetan, 31 Desember 2026" -> "Magetan")
  let clean = kab.split(",")[0].trim();
  // Hilangkan prefix "Kabupaten", "Kab.", atau "Kota" jika ada
  clean = clean.replace(/^(kab\.?|kabupaten|kota)\s+/i, "").trim();
  // Bersihkan karakter angka sisa jika ada tanggal yang tertinggal
  clean = clean.replace(/\d+/g, "").trim();
  return clean || "Magetan";
};

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Menghitung tanggal hari kerja terakhir dalam suatu bulan (Senin - Jumat)
 * Jika hari terakhir bulan jatuh di hari Minggu, mundur 2 hari ke Jumat.
 * Jika jatuh di hari Sabtu, mundur 1 hari ke Jumat.
 */
export const getLastWorkingDayOfMonth = (year: number, month: number): number => {
  const lastDay = new Date(year, month, 0);
  const dayOfWeek = lastDay.getDay(); // 0 = Minggu, 6 = Sabtu
  let date = lastDay.getDate();

  if (dayOfWeek === 0) {
    date -= 2;
  } else if (dayOfWeek === 6) {
    date -= 1;
  }
  return Math.max(1, date);
};

/**
 * Menghasilkan teks tempat dan tanggal penutupan buku resmi:
 * Contoh: "Magetan, 30 September 2026" atau "Magetan, 31 Desember 2026"
 */
export const getTanggalPenutupanBuku = (kabupaten: string | undefined, year: number | string, month: number): string => {
  const y = Number(year) || new Date().getFullYear();
  const m = Math.max(1, Math.min(12, Number(month) || 1));
  const day = getLastWorkingDayOfMonth(y, m);
  const cleanKab = cleanKabupatenName(kabupaten);
  const namaBln = NAMA_BULAN[m - 1];
  return `${cleanKab}, ${day} ${namaBln} ${y}`;
};

/**
 * Menghasilkan teks tempat dan tanggal tanda tangan BKP:
 * Menggunakan tanggal terakhir hari kerja pada bulan transaksi terakhir (Senin - Jumat).
 * Contoh: jika transaksi terakhir tanggal 18 September 2026,
 * maka titimangsa adalah hari kerja terakhir bulan September 2026:
 * "Magetan, 30 September 2026"
 */
export const getTanggalTtdTransaksiTerakhir = (
  kabupaten: string | undefined,
  tanggalTerakhir: string | null | undefined,
  fallbackYear: string | number
): string => {
  let targetYear = Number(fallbackYear) || new Date().getFullYear();
  let targetMonth = 12;

  if (tanggalTerakhir) {
    const parts = tanggalTerakhir.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        targetYear = y;
        targetMonth = m;
      }
    } else {
      const dt = new Date(tanggalTerakhir);
      if (!isNaN(dt.getTime())) {
        targetYear = dt.getFullYear();
        targetMonth = dt.getMonth() + 1;
      }
    }
  }

  return getTanggalPenutupanBuku(kabupaten, targetYear, targetMonth);
};

/**
 * Format alamat kop yang bersih dari teks tanggal
 */
export const formatAlamatKop = (alamat?: string, kecamatan?: string, kabupaten?: string): string => {
  const cleanKab = cleanKabupatenName(kabupaten);
  const cleanKec = (kecamatan || "").replace(/^(kec\.?|kecamatan)\s+/i, "").split(",")[0].trim();
  // Hilangkan teks tanggal atau imbuhan di akhir alamat jika ada
  const cleanAlm = (alamat || "")
    .replace(/,\s*\d+\s+[A-Za-z]+\s+\d{4}.*$/i, "")
    .replace(/,\s*\d{2}\/\d{2}\/\d{4}.*$/i, "")
    .trim();

  const parts: string[] = [];
  if (cleanAlm) parts.push(cleanAlm);
  if (cleanKec) parts.push(`Kec. ${cleanKec}`);
  if (cleanKab) parts.push(`Kab. ${cleanKab}`);
  return parts.join(", ");
};

export const getActiveMadin = (): ProfilLembaga => {
  const activeId = getActiveMadinId();
  const list = getMadinList();
  const found = list.find(m => m.id === activeId) || list[0] || PROFIL_DEFAULT;

  // Auto-heal jika kabupaten tercampur tanggal (misal: "Magetan, 31 Desember 2026")
  if (found && found.kabupaten && (found.kabupaten.includes(",") || /\d{4}/.test(found.kabupaten))) {
    const rawKab = found.kabupaten;
    found.kabupaten = cleanKabupatenName(rawKab);
    if (!found.kotaTanggal || found.kotaTanggal.includes("2025")) {
      found.kotaTanggal = rawKab;
    }
    saveMadin(found);
  }
  return found;
};

export const saveMadin = async (madin: ProfilLembaga): Promise<boolean> => {
  const list = getMadinList();
  const sanitizedMadin: ProfilLembaga = {
    ...madin,
    kabupaten: cleanKabupatenName(madin.kabupaten)
  };
  const idx = list.findIndex(m => m.id === sanitizedMadin.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...sanitizedMadin };
  } else {
    list.push({ ...sanitizedMadin, id: sanitizedMadin.id || `madin-${generateId()}` });
  }
  localStorage.setItem("madin_list", JSON.stringify(list));

  if (sanitizedMadin.id === getActiveMadinId()) {
    localStorage.setItem("rab_profil", JSON.stringify(sanitizedMadin));
  }
  return true;
};

export const createMadin = async (data: Partial<ProfilLembaga>): Promise<ProfilLembaga> => {
  const list = getMadinList();
  const newId = `madin-${generateId()}`;
  const newMadin: ProfilLembaga = {
    id: newId,
    namaLembaga: data.namaLembaga || "MADRASAH DINIYAH BARU",
    nsm: data.nsm || "311235120999",
    alamat: data.alamat || "Jl. Raya Madrasah No. 01",
    logo: data.logo || "",
    namaKepala: data.namaKepala || "KEPALA MADIN",
    namaBendahara: data.namaBendahara || "BENDAHARA MADIN",
    kotaTanggal: data.kotaTanggal || "Magetan, 31 Desember 2025",
    sumberDanaOptions: ["DAU", "BKK"],
    desa: data.desa || "Desa",
    kecamatan: data.kecamatan || "Kecamatan",
    kabupaten: cleanKabupatenName(data.kabupaten || "Magetan")
  };
  list.push(newMadin);
  localStorage.setItem("madin_list", JSON.stringify(list));
  setActiveMadinId(newId);
  return newMadin;
};

export const deleteMadin = async (id: string): Promise<boolean> => {
  const list = getMadinList();
  if (list.length <= 1) {
    return false; // Minimal 1 Madin harus tetap ada
  }
  const filtered = list.filter(m => m.id !== id);
  localStorage.setItem("madin_list", JSON.stringify(filtered));
  if (getActiveMadinId() === id) {
    setActiveMadinId(filtered[0].id || "madin-baiturrohman");
  }
  return true;
};

export const getProfil = async (forceRemote: boolean = false): Promise<ProfilLembaga> => {
  // Delegate to active Madin
  let active = getActiveMadin();

  if (isSheetsConnected()) {
    try {
      const res = await getFromAppsScript("get_profil");
      if (res && res.success && res.data && typeof res.data === "object") {
        const d = res.data;
        // Merge only non-empty fields from remote sheet
        const merged: ProfilLembaga = {
          ...active,
          namaLembaga: d.namaLembaga ? String(d.namaLembaga).trim() : active.namaLembaga,
          nsm: d.nsm ? String(d.nsm).trim() : active.nsm,
          alamat: d.alamat ? String(d.alamat).trim() : active.alamat,
          desa: d.desa ? String(d.desa).trim() : (active.desa || ""),
          kecamatan: d.kecamatan ? String(d.kecamatan).trim() : (active.kecamatan || ""),
          kabupaten: d.kabupaten ? String(d.kabupaten).trim() : (active.kabupaten || ""),
          namaKepala: d.namaKepala ? String(d.namaKepala).trim() : active.namaKepala,
          namaBendahara: d.namaBendahara ? String(d.namaBendahara).trim() : (active.namaBendahara || ""),
          nipKepala: d.nipKepala ? String(d.nipKepala).trim() : (active.nipKepala || ""),
          nipBendahara: d.nipBendahara ? String(d.nipBendahara).trim() : (active.nipBendahara || ""),
          kotaTanggal: d.kotaTanggal ? String(d.kotaTanggal).trim() : active.kotaTanggal,
          logo: d.logo ? String(d.logo).trim() : active.logo,
          sumberDanaOptions: Array.isArray(d.sumberDanaOptions) && d.sumberDanaOptions.length > 0 
            ? d.sumberDanaOptions 
            : (active.sumberDanaOptions || ["DAU", "BKK"])
        };
        await saveMadin(merged);
        return merged;
      }
    } catch (e: any) {
      console.warn("Sinkronisasi profil dari Sheets gagal, gunakan lokal:", e?.message || e);
    }
  }

  let fallbackUpdated = false;

  if (!active.sumberDanaOptions || active.sumberDanaOptions.length === 0) {
    active.sumberDanaOptions = ["DAU", "BKK"];
    fallbackUpdated = true;
  }
  if (!active.namaBendahara) {
    active.namaBendahara = "UST. ABDUL WAHID, S.Pd.I.";
    fallbackUpdated = true;
  }

  if (fallbackUpdated) {
    saveMadin(active);
  }

  return active;
};

export const syncAllDataFromSheets = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSheetsConnected()) {
    return { success: false, message: "URL Google Sheets Web App belum terhubung." };
  }
  try {
    await getProfil(true);
    await getRabList();

    try {
      const penRes = await getFromAppsScript("get_penerimaan_dana");
      if (penRes && penRes.success && Array.isArray(penRes.data) && penRes.data.length > 0) {
        localStorage.setItem("penerimaan_dana_list", JSON.stringify(penRes.data));
      }
    } catch (e) {}

    try {
      const kwtRes = await getFromAppsScript("get_kwitansi_list");
      if (kwtRes && kwtRes.success && Array.isArray(kwtRes.data) && kwtRes.data.length > 0) {
        localStorage.setItem("kwitansi_list", JSON.stringify(kwtRes.data));
      }
    } catch (e) {}

    return { success: true, message: "Data Profil, RAB, dan Transaksi berhasil disinkronkan dengan Google Sheets!" };
  } catch (err: any) {
    return { success: false, message: "Gagal sinkronisasi data: " + (err?.message || err) };
  }
};

export const saveProfil = async (profil: ProfilLembaga): Promise<boolean> => {
  const activeId = getActiveMadinId();
  const updated: ProfilLembaga = {
    ...profil,
    id: profil.id || activeId
  };
  await saveMadin(updated);

  // Sync to remote if sheets connected
  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "save_profil",
        data: updated
      });
    } catch (e: any) {
      console.warn("Sinkronisasi profil ke Google Sheets tertunda/gagal:", e?.message || e);
    }
  }
  return true;
};

// --- RAB SERVICE ---

export const getRabList = async (madinId?: string): Promise<RABData[]> => {
  const targetMadinId = madinId || getActiveMadinId();
  const localData = localStorage.getItem("rab_list");
  let fallback: RABData[] = localData ? JSON.parse(localData) : [RAB_DEFAULT_2025];

  if (isSheetsConnected()) {
    try {
      const remoteData = await getFromAppsScript("get_rab_list");
      if (remoteData && remoteData.success && Array.isArray(remoteData.data)) {
        const sortedData = remoteData.data.sort((a: any, b: any) => parseInt(b.tahun) - parseInt(a.tahun));
        localStorage.setItem("rab_list", JSON.stringify(sortedData));
        fallback = sortedData;
      }
    } catch (e: any) {
      console.warn("Menggunakan Daftar RAB dari LocalStorage:", e?.message || e);
    }
  }

  // Filter by Madin ID (with fallback for legacy items)
  return fallback
    .filter(r => (r.madinId || "madin-baiturrohman") === targetMadinId)
    .sort((a: any, b: any) => parseInt(b.tahun) - parseInt(a.tahun));
};

export const getRab = async (tahun: string, madinId?: string): Promise<RABData | null> => {
  const list = await getRabList(madinId);
  const found = list.find(r => r.tahun === tahun);
  return found || null;
};

export const saveRab = async (rab: RABData): Promise<boolean> => {
  const targetMadinId = rab.madinId || getActiveMadinId();
  const localData = localStorage.getItem("rab_list");
  let allRabs: RABData[] = localData ? JSON.parse(localData) : [];

  const updatedRab: RABData = {
    ...rab,
    madinId: targetMadinId,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = allRabs.findIndex(
    r => r.tahun === rab.tahun && (r.madinId || "madin-baiturrohman") === targetMadinId
  );
  
  if (existingIndex >= 0) {
    allRabs[existingIndex] = updatedRab;
  } else {
    updatedRab.createdAt = new Date().toISOString();
    allRabs.push(updatedRab);
  }

  localStorage.setItem("rab_list", JSON.stringify(allRabs));

  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "save_rab",
        data: updatedRab
      });
    } catch (e: any) {
      console.warn(`Sinkronisasi RAB ${rab.tahun} ke Google Sheets tertunda/gagal:`, e?.message || e);
    }
  }
  return true;
};

export const deleteRab = async (tahun: string, madinId?: string): Promise<boolean> => {
  const targetMadinId = madinId || getActiveMadinId();
  const localData = localStorage.getItem("rab_list");
  let allRabs: RABData[] = localData ? JSON.parse(localData) : [];
  
  const filtered = allRabs.filter(
    r => !(r.tahun === tahun && (r.madinId === targetMadinId || !r.madinId || targetMadinId === "madin-baiturrohman"))
  );
  localStorage.setItem("rab_list", JSON.stringify(filtered));

  // Hapus juga data pencairan dana hibah terkait tahun ini
  const rawPen = localStorage.getItem("penerimaan_dana_list");
  if (rawPen) {
    try {
      let penList: PenerimaanDana[] = JSON.parse(rawPen);
      penList = penList.filter(
        p => !(p.tahun === tahun && (p.madinId === targetMadinId || !p.madinId || targetMadinId === "madin-baiturrohman"))
      );
      localStorage.setItem("penerimaan_dana_list", JSON.stringify(penList));
    } catch (e) {
      // ignore
    }
  }

  // Hapus juga data kwitansi transaksi belanja terkait tahun ini
  const rawKwt = localStorage.getItem("kwitansi_list");
  if (rawKwt) {
    try {
      let kwtList: Kwitansi[] = JSON.parse(rawKwt);
      kwtList = kwtList.filter(
        k => !(k.tahun === tahun && (k.madinId === targetMadinId || !k.madinId || targetMadinId === "madin-baiturrohman"))
      );
      localStorage.setItem("kwitansi_list", JSON.stringify(kwtList));
    } catch (e) {
      // ignore
    }
  }

  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "delete_rab",
        tahun: tahun
      });
      await postToAppsScript({
        action: "delete_penerimaan_dana",
        tahun: tahun,
        madinId: targetMadinId
      });
    } catch (e: any) {
      console.warn(`Sinkronisasi hapus RAB ${tahun} ke Google Sheets tertunda/gagal:`, e?.message || e);
    }
  }
  return true;
};

// === MENU PENERIMAAN DANA HIBAH (TAHUNAN) ===

export const getPenerimaanDanaList = (madinId?: string): PenerimaanDana[] => {
  const targetMadinId = madinId || getActiveMadinId();
  const raw = localStorage.getItem("penerimaan_dana_list");
  if (!raw) return [];
  try {
    const list: PenerimaanDana[] = JSON.parse(raw);
    return list
      .filter(p => p.madinId === targetMadinId)
      .sort((a, b) => parseInt(b.tahun) - parseInt(a.tahun));
  } catch (e) {
    return [];
  }
};

export const getPenerimaanDana = (madinId: string, tahun: string): PenerimaanDana | null => {
  const list = getPenerimaanDanaList(madinId);
  const existing = list.find(p => p.tahun === tahun);
  return existing || null;
};

export const savePenerimaanDana = async (data: PenerimaanDana): Promise<{ success: boolean; message?: string }> => {
  const raw = localStorage.getItem("penerimaan_dana_list");
  let list: PenerimaanDana[] = raw ? JSON.parse(raw) : [];

  // Validasi ketat: HANYA DIISI 1 KALI per tahun anggaran per Madin
  const duplicate = list.find(
    p => p.madinId === data.madinId && p.tahun === data.tahun && p.id !== data.id
  );
  if (duplicate) {
    return {
      success: false,
      message: `Penerimaan Dana Hibah Tahun Anggaran ${data.tahun} sudah pernah diinput sebelumnya sebesar Rp ${duplicate.jumlah.toLocaleString("id-ID")}. Pengisian dana hibah hanya diizinkan 1 kali per tahun anggaran per Madin.`
    };
  }

  const existingIndex = list.findIndex(p => p.id === data.id);
  const entryToSave: PenerimaanDana = {
    ...data,
    id: data.id || `pen-${generateId()}`,
    createdAt: data.createdAt || new Date().toISOString()
  };

  if (existingIndex >= 0) {
    list[existingIndex] = entryToSave;
  } else {
    list.push(entryToSave);
  }

  localStorage.setItem("penerimaan_dana_list", JSON.stringify(list));

  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "save_penerimaan_dana",
        data: entryToSave
      });
    } catch (e: any) {
      console.warn("Sinkronisasi penerimaan dana ke Sheets tertunda:", e?.message || e);
    }
  }

  return { success: true };
};

export const deletePenerimaanDana = async (id: string, tahun?: string, madinId?: string): Promise<boolean> => {
  const raw = localStorage.getItem("penerimaan_dana_list");
  if (!raw) return false;
  let list: PenerimaanDana[] = JSON.parse(raw);
  const targetId = String(id || "").trim();
  const targetMadinId = madinId || getActiveMadinId();

  list = list.filter(p => {
    if (targetId && String(p.id).trim() === targetId) return false;
    if (tahun && String(p.tahun).trim() === String(tahun).trim() && (p.madinId === targetMadinId || !p.madinId || targetMadinId === "madin-baiturrohman")) return false;
    return true;
  });

  localStorage.setItem("penerimaan_dana_list", JSON.stringify(list));

  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "delete_penerimaan_dana",
        id: targetId,
        tahun: tahun,
        madinId: targetMadinId
      });
    } catch (e: any) {
      console.warn("Sinkronisasi hapus penerimaan dana ke Sheets tertunda:", e?.message || e);
    }
  }

  return true;
};

// === MENU BELANJA & FORM KWITANSI ===

export const getKwitansiList = (madinId?: string, tahun?: string): Kwitansi[] => {
  const targetMadinId = madinId || getActiveMadinId();
  const raw = localStorage.getItem("kwitansi_list");
  if (!raw) return [];
  try {
    let list: Kwitansi[] = JSON.parse(raw);
    list = list.filter(k => k.madinId === targetMadinId);
    if (tahun) {
      list = list.filter(k => k.tahun === tahun);
    }
    return list.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  } catch (e) {
    return [];
  }
};

export const getKwitansi = (id: string): Kwitansi | null => {
  const raw = localStorage.getItem("kwitansi_list");
  if (!raw) return null;
  const list: Kwitansi[] = JSON.parse(raw);
  return list.find(k => k.id === id) || null;
};

export const generateNextNomorKwitansi = (madinId: string, tahun: string, sumberDana: string): string => {
  const kwitansiList = getKwitansiList(madinId, tahun);
  const cleanKode = (sumberDana.split(/\s+/)[0] || "DAU").toUpperCase();

  const matching = kwitansiList.filter(k => {
    const kKode = (k.sumberDana || "").toUpperCase();
    return kKode.includes(cleanKode) || (k.nomorKwitansi || "").includes(`/${cleanKode}/`);
  });

  let maxNum = 0;
  matching.forEach(k => {
    const match = k.nomorKwitansi.match(/^(\d+)\//);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(2, "0");
  return `${formattedNum}/${cleanKode}/${tahun}`;
};

export const saveKwitansi = async (kwitansi: Kwitansi): Promise<{ success: boolean; message?: string }> => {
  const raw = localStorage.getItem("kwitansi_list");
  let list: Kwitansi[] = raw ? JSON.parse(raw) : [];

  // Validasi: Nomor Kwitansi unik per sumber dana per tahun anggaran
  const duplicate = list.find(k => 
    k.madinId === kwitansi.madinId && 
    k.tahun === kwitansi.tahun && 
    k.nomorKwitansi.trim().toLowerCase() === kwitansi.nomorKwitansi.trim().toLowerCase() && 
    k.id !== kwitansi.id
  );

  if (duplicate) {
    return {
      success: false,
      message: `Nomor Kwitansi "${kwitansi.nomorKwitansi}" sudah pernah digunakan pada transaksi lain untuk tahun anggaran ${kwitansi.tahun}. Nomor kwitansi harus unik.`
    };
  }

  const existingIndex = list.findIndex(k => k.id === kwitansi.id);
  const toSave: Kwitansi = {
    ...kwitansi,
    id: kwitansi.id || `kwt-${generateId()}`,
    createdAt: kwitansi.createdAt || new Date().toISOString()
  };

  if (existingIndex >= 0) {
    list[existingIndex] = toSave;
  } else {
    list.push(toSave);
  }

  localStorage.setItem("kwitansi_list", JSON.stringify(list));

  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "save_kwitansi",
        data: toSave
      });
    } catch (e: any) {
      console.warn("Sinkronisasi kwitansi ke Google Sheets tertunda:", e?.message || e);
    }
  }

  return { success: true };
};

export const deleteKwitansi = async (id: string): Promise<boolean> => {
  const raw = localStorage.getItem("kwitansi_list");
  if (!raw) return false;
  let list: Kwitansi[] = JSON.parse(raw);
  const targetId = String(id).trim();
  list = list.filter(k => String(k.id).trim() !== targetId);
  localStorage.setItem("kwitansi_list", JSON.stringify(list));

  if (isSheetsConnected()) {
    try {
      await postToAppsScript({
        action: "delete_kwitansi",
        id: targetId
      });
    } catch (e: any) {
      console.warn("Sinkronisasi hapus kwitansi ke Google Sheets tertunda:", e?.message || e);
    }
  }

  return true;
};

// === DATA ITEM RAB DENGAN DERIVED BUDGETING ===

export const getRabItemsWithBudget = (rab: RABData, kwitansiList: Kwitansi[]): RABItemWithBudget[] => {
  if (!rab || !rab.komponenList) return [];

  // Map realisasi akumulasi per item RAB
  const realisasiMap: Record<string, number> = {};
  kwitansiList.forEach(kwt => {
    if (kwt.items && Array.isArray(kwt.items)) {
      kwt.items.forEach(it => {
        if (it.rabItemId) {
          realisasiMap[it.rabItemId] = (realisasiMap[it.rabItemId] || 0) + (it.jumlahRealisasi || 0);
        }
      });
    }
  });

  const result: RABItemWithBudget[] = [];
  rab.komponenList.forEach(comp => {
    comp.items.forEach(item => {
      const totalTerpakai = realisasiMap[item.id] || 0;
      const sisaAnggaran = Math.max(0, item.total - totalTerpakai);
      result.push({
        ...item,
        komponenNama: comp.nama,
        jumlah_anggaran: item.total,
        total_terpakai: totalTerpakai,
        sisa_anggaran: sisaAnggaran
      });
    });
  });

  return result;
};

// === AUTO-POSTING BKP (BUKU KAS PEMBANTU - FORMAT 11) ===

export const calculateBkpRows = (madinId: string, tahun: string): { 
  rows: BkpRow[]; 
  totalPenerimaan: number; 
  totalPengeluaran: number; 
  saldoAkhir: number;
} => {
  const penerimaan = getPenerimaanDana(madinId, tahun);
  const kwitansiList = getKwitansiList(madinId, tahun);

  // 1. Urutkan kwitansi berdasarkan tanggal secara ascending (dari tanggal kecil sampai besar)
  const sortedKwitansi = [...kwitansiList].sort((a, b) => {
    const diff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    if (diff !== 0) return diff;
    return (a.nomorKwitansi || "").localeCompare(b.nomorKwitansi || "", undefined, { numeric: true });
  });

  const rows: BkpRow[] = [];
  let runningSaldo = 0;
  let totalPenerimaan = 0;
  let totalPengeluaran = 0;

  // Baris pertama: Penerimaan Dana Hibah di awal tahun anggaran
  if (penerimaan) {
    runningSaldo += penerimaan.jumlah;
    totalPenerimaan += penerimaan.jumlah;
    rows.push({
      id: `penerimaan-awal-${penerimaan.id}`,
      tanggal: penerimaan.tanggal,
      uraian: `Penerimaan Pencairan Dana Hibah (${penerimaan.sumberDana}) Tahun Anggaran ${tahun}`,
      noBukti: "DANA-HIBAH",
      penerimaan: penerimaan.jumlah,
      pengeluaran: 0,
      saldo: runningSaldo,
      isPenerimaanAwal: true
    });
  }

  // Baris transaksi belanja:
  // Sesuai instruksi: Uraian transaksi BKP sama dengan uraian transaksi BKU (1 baris per kwitansi)
  sortedKwitansi.forEach(kwt => {
    runningSaldo -= kwt.totalJumlah;
    totalPengeluaran += kwt.totalJumlah;
    rows.push({
      id: `bkp-${kwt.id}`,
      tanggal: kwt.tanggal,
      uraian: kwt.uraianPembayaran, // SAMA dengan uraian BKU!
      noBukti: kwt.nomorKwitansi,
      penerimaan: 0,
      pengeluaran: kwt.totalJumlah,
      saldo: runningSaldo
    });
  });

  return {
    rows,
    totalPenerimaan,
    totalPengeluaran,
    saldoAkhir: runningSaldo
  };
};

// === AUTO-POSTING BKU (BUKU KAS UMUM) ===

export const calculateBkuMonth = (madinId: string, tahun: string, targetBulan: number): BkuBulanData => {
  const penerimaan = getPenerimaanDana(madinId, tahun);
  const kwitansiList = getKwitansiList(madinId, tahun);

  // Cari bulan pencairan dana:
  const penerimaanDate = penerimaan ? new Date(penerimaan.tanggal) : null;
  const penerimaanMonth = (penerimaanDate && !isNaN(penerimaanDate.getTime())) 
    ? (penerimaanDate.getMonth() + 1) 
    : 1;

  let previousSaldoAkhir = 0;

  for (let m = 1; m <= targetBulan; m++) {
    // Saldo bulan lalu adalah saldo kas penutupan bulan sebelumnya (bulan 1 saldo lalu = 0)
    const saldoBulanLalu = m === 1 ? 0 : previousSaldoAkhir;
    const penerimaanList: BkuItem[] = [];

    // Jika pencairan dana terjadi pada bulan m ini:
    if (penerimaan && penerimaan.jumlah > 0 && penerimaanMonth === m) {
      penerimaanList.push({
        tanggal: penerimaan.tanggal,
        uraian: `Penerimaan Pencairan Dana Hibah (${penerimaan.sumberDana || "DAU"}) TA ${tahun}`,
        noBukti: "DANA-HIBAH",
        jumlah: penerimaan.jumlah
      });
    }

    const sumPenerimaanBulanIni = penerimaanList.reduce((acc, curr) => acc + curr.jumlah, 0);
    const totalPenerimaan = saldoBulanLalu + sumPenerimaanBulanIni;

    // Filter kwitansi transaksi belanja bulan m & urutkan tanggal dari kecil ke besar
    const monthKwitansi = kwitansiList
      .filter(kwt => {
        const d = new Date(kwt.tanggal);
        return (d.getMonth() + 1) === m;
      })
      .sort((a, b) => {
        const diff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
        if (diff !== 0) return diff;
        return (a.nomorKwitansi || "").localeCompare(b.nomorKwitansi || "", undefined, { numeric: true });
      });

    // 1 baris ringkasan per kwitansi di kolom pengeluaran
    const pengeluaranList: BkuItem[] = monthKwitansi.map(kwt => ({
      tanggal: kwt.tanggal,
      uraian: kwt.uraianPembayaran,
      noBukti: kwt.nomorKwitansi,
      jumlah: kwt.totalJumlah
    }));

    const totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + curr.jumlah, 0);
    const saldoAkhirBulan = totalPenerimaan - totalPengeluaran;

    previousSaldoAkhir = saldoAkhirBulan;

    if (m === targetBulan) {
      return {
        bulan: m,
        tahun,
        saldoBulanLalu,
        penerimaanList,
        pengeluaranList,
        totalPenerimaan,
        totalPengeluaran,
        saldoAkhirBulan
      };
    }
  }

  return {
    bulan: targetBulan,
    tahun,
    saldoBulanLalu: 0,
    penerimaanList: [],
    pengeluaranList: [],
    totalPenerimaan: 0,
    totalPengeluaran: 0,
    saldoAkhirBulan: 0
  };
};

// --- DIAGNOSTICS SERVICE ---

export const testGoogleSheetsConnection = async (url: string): Promise<{ success: boolean; message: string; sheets?: string[] }> => {
  if (!url || !url.trim()) {
    return { success: false, message: "URL Google Apps Script kosong. Silakan salin URL Web App Anda." };
  }

  const trimmed = url.trim();

  // If user pasted Google Sheets document link instead of Apps Script Web App link
  if (trimmed.includes("docs.google.com/spreadsheets")) {
    return {
      success: false,
      message: "URL yang dimasukkan adalah link dokumen spreadsheet ('docs.google.com'), bukan URL Web App. Buka spreadsheet Anda, klik menu Ekstensi > Apps Script > Terapkan (Deploy) > Penerapan baru > Aplikasi Web > Siapa saja > Terapkan, lalu salin URL yang berakhiran /exec."
    };
  }

  const normalized = normalizeAppsScriptUrl(trimmed);
  if (!normalized || !isValidAppsScriptUrl(normalized)) {
    return {
      success: false,
      message: "Format URL tidak valid. URL Aplikasi Web Google Apps Script harus berformat: https://script.google.com/macros/s/.../exec"
    };
  }

  const separator = normalized.includes("?") ? "&" : "?";
  const testUrl = `${normalized}${separator}action=init_sheets`;

  try {
    const response = await fetch(testUrl);
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: "HTTP Error 404: Endpoint Web App tidak ditemukan. Pastikan URL Web App benar dan telah diterapkan (Deploy > Penerapan Baru > Web App) dengan izin 'Siapa saja'."
        };
      }
      return { success: false, message: `Server mengembalikan status HTTP ${response.status}.` };
    }
    const data = await response.json();
    if (data && data.success) {
      return { 
        success: true, 
        message: data.message || "Koneksi berhasil! Google Sheets siap digunakan.",
        sheets: data.sheets
      };
    }
    return { success: false, message: data.message || "Respon server tidak valid atau Apps Script belum dikonfigurasi dengan benar." };
  } catch (error: any) {
    console.warn("Kesalahan pengujian koneksi:", error?.message || error);
    return { 
      success: false, 
      message: `Gagal terhubung ke Google Sheets (${error?.message || error}). Pastikan Anda telah menerapkan (deploy) Apps Script sebagai Web App dan memberikan izin 'Anyone' (Siapa saja).` 
    };
  }
};
