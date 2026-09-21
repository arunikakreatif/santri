/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProfilLembaga {
  id?: string;
  namaLembaga: string;
  nsm: string;
  alamat: string;
  logo: string; // Base64 data URL or image URL
  namaKepala: string;
  nipKepala?: string;
  namaBendahara?: string;
  nipBendahara?: string;
  kotaTanggal: string; // Format: "Magetan, 31 Desember 2025"
  sumberDanaOptions: string[];
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
}

export interface RABItem {
  id: string;
  uraian: string;
  jumlah: number;      // Quantity/Qty (e.g. 2)
  satuan: string;      // Unit of quantity (e.g. Orang)
  volume: number;      // Frequency/Multiplier (e.g. 12)
  satuanVolume: string;// Unit of volume (e.g. Bulan)
  satuanHarga: number; // Unit Price in IDR
  total: number;       // calculated as: jumlah * volume * satuanHarga
}

export interface RABItemWithBudget extends RABItem {
  komponenNama: string;
  jumlah_anggaran: number; // same as total
  total_terpakai: number;
  sisa_anggaran: number;
}

export interface RABKomponen {
  nama: string;
  items: RABItem[];
}

export interface RABData {
  id?: string;
  madinId?: string;
  tahun: string;
  sumberDana: string;
  totalAnggaran: number;
  paguAnggaran?: number;
  komponenList: RABKomponen[];
  createdAt: string;
  updatedAt: string;
}

// === FITUR BELANJA & KEUANGAN ===

export interface PenerimaanDana {
  id: string;
  madinId: string;
  tahun: string; // e.g. "2025"
  tanggal: string; // e.g. "2025-01-10"
  sumberDana: string; // e.g. "DAU Kabupaten" or "DAU"
  jumlah: number; // e.g. 20000000
  keterangan?: string;
  createdAt?: string;
}

export interface KwitansiItemRealisasi {
  id: string;
  rabItemId: string;
  kodeKomponen?: string;
  uraianItem: string;
  jumlahRealisasi: number;
  volumeRealisasi?: number;
  satuanRealisasi?: string;
  hargaSatuan?: number;
}

export interface Kwitansi {
  id: string;
  madinId: string;
  tahun: string;
  nomorKwitansi: string; // e.g. "01/DAU/2025"
  sumberDana: string; // e.g. "DAU Kabupaten"
  tanggal: string; // YYYY-MM-DD
  telahTerimaDari: string; // e.g. "Bendahara Madrasah Diniyah Baiturrohman"
  penerima: string; // Name of person or vendor receiving money
  items: KwitansiItemRealisasi[];
  totalJumlah: number;
  uraianPembayaran: string;
  terbilang: string;
  namaKepala: string;
  namaBendahara: string;
  namaPenerima: string;
  createdAt?: string;
}

export interface BkpRow {
  id: string;
  tanggal: string;
  uraian: string;
  noBukti: string;
  penerimaan: number;
  pengeluaran: number;
  saldo: number;
  isPenerimaanAwal?: boolean;
}

export interface BkuItem {
  tanggal: string;
  uraian: string;
  noBukti: string;
  jumlah: number;
}

export interface BkuBulanData {
  bulan: number; // 1-12
  tahun: string;
  saldoBulanLalu: number;
  penerimaanList: BkuItem[];
  pengeluaranList: BkuItem[];
  totalPenerimaan: number;
  totalPengeluaran: number;
  saldoAkhirBulan: number;
}

export const KOMPONEN_DEFAULT_LIST = [
  "Pembayaran honorarium guru / ustadz / ustadzah",
  "Pembelian/pengadaan buku teks pelajaran",
  "Kegiatan PPDB (penerimaan siswa baru)",
  "Kegiatan pembelajaran & PBM",
  "Penggandaan bahan pembelajaran, surat, soal ujian/ulangan, berkas",
  "Pengadaan bahan habis pakai",
  "Peningkatan mutu pendidik",
  "Operasional & manajemen pengelolaan BPPDGS"
];

export interface KomponenDetail {
  id: string;
  nama: string; // Saved in DB (maps to KOMPONEN_DEFAULT_LIST)
  label: string; // Display name
  deskripsi: string;
  boleh: string[];
  tidakBoleh: string[];
}

export const KOMPONEN_DETAILS: KomponenDetail[] = [
  {
    id: "honorarium",
    nama: "Pembayaran honorarium guru / ustadz / ustadzah",
    label: "Pembayaran honorarium guru / ustadz / ustadzah",
    deskripsi: "Pemberian honorarium / insentif rutin bulanan bagi ustadz, ustadzah, guru pengajar, dan tenaga kependidikan madrasah diniyah.",
    boleh: [
      "Pembayaran honorarium rutin bulanan ustadz / ustadzah pengajar madrasah diniyah",
      "Pembayaran honorarium kepala madrasah dan tenaga kependidikan/tata usaha",
      "Besaran honorarium disesuaikan dengan alokasi pagu anggaran dan beban tugas yang disepakati"
    ],
    tidakBoleh: [
      "Pembayaran honor ganda dari sumber dana yang sama untuk waktu dan pos yang sama",
      "Pembayaran honorarium kepada personel yang tidak aktif melaksanakan tugas pembelajaran atau administrasi"
    ]
  },
  {
    id: "buku",
    nama: "Pembelian/pengadaan buku teks pelajaran",
    label: "Pembelian/pengadaan buku teks pelajaran",
    deskripsi: "Penyediaan buku teks pelajaran sebagai inventaris lembaga, yang boleh dipinjamkan ke siswa/santri.",
    boleh: [
      "Pembelian/pengadaan buku teks pelajaran keagamaan maupun umum",
      "Buku dicatat sebagai inventaris lembaga",
      "Buku boleh dipinjamkan secara gratis kepada siswa/santri"
    ],
    tidakBoleh: [
      "Pembelian buku komersial non-pelajaran",
      "Buku hak milik pribadi siswa yang tidak dicatat sebagai inventaris"
    ]
  },
  {
    id: "ppdb",
    nama: "Kegiatan PPDB (penerimaan siswa baru)",
    label: "Kegiatan PPDB (penerimaan siswa baru)",
    deskripsi: "Pembiayaan operasional pelaksanaan pendaftaran dan penerimaan siswa/santri baru.",
    boleh: [
      "Biaya administrasi pendaftaran & pendaftaran ulang",
      "Penggandaan berkas pendaftaran/formulir & brosur sosialisasi",
      "Konsumsi rapat panitia PPDB"
    ],
    tidakBoleh: [
      "Pembayaran honor atau upah panitia PPDB"
    ]
  },
  {
    id: "pbm",
    nama: "Kegiatan pembelajaran & PBM",
    label: "Kegiatan pembelajaran & PBM",
    deskripsi: "Pelaksanaan remedial, pengayaan, pemantapan ujian, olahraga, kesenian, KIR, pramuka, PMR, UKS.",
    boleh: [
      "Pembelian bahan/alat ajar dan alat peraga pendukung",
      "Pembelian bahan/alat praktikum, olahraga, dan kesenian",
      "Biaya mengikuti lomba resmi (biaya pendaftaran, transport, dan konsumsi)"
    ],
    tidakBoleh: [
      "Pembayaran honor atau upah guru pembimbing atau instruktur kegiatan"
    ]
  },
  {
    id: "penggandaan",
    nama: "Penggandaan bahan pembelajaran, surat, soal ujian/ulangan, berkas",
    label: "Penggandaan bahan pembelajaran, surat, soal ujian/ulangan, berkas",
    deskripsi: "Penggandaan dokumen kegiatan pembelajaran dan administrasi umum lembaga.",
    boleh: [
      "Penggandaan bahan pembelajaran / materi ajar",
      "Penggandaan surat-menyurat resmi lembaga",
      "Penggandaan soal ujian atau ulangan (harian/semester)",
      "Penggandaan berkas lembaga (umum/administrasi)"
    ],
    tidakBoleh: [
      "Penggandaan berkas atau dokumen pribadi pengurus/guru"
    ]
  },
  {
    id: "atk_habispakai",
    nama: "Pengadaan bahan habis pakai",
    label: "Pengadaan bahan habis pakai",
    deskripsi: "Penyediaan alat tulis kantor, publikasi pendidikan, konsumsi harian lembaga, serta rapat komite.",
    boleh: [
      "Pembelian ATK administrasi kantor dan bahan pembelajaran",
      "Langganan koran atau majalah pendidikan",
      "Konsumsi harian operasional madrasah",
      "Konsumsi rapat dengan orang tua santri / komite madrasah"
    ],
    tidakBoleh: [
      "Pembelian barang modal / aset tetap non-habis pakai yang bernilai tinggi"
    ]
  },
  {
    id: "mutu",
    nama: "Peningkatan mutu pendidik",
    label: "Peningkatan mutu pendidik",
    deskripsi: "Peningkatan kompetensi guru/ustadz melalui keikutsertaan pelatihan resmi.",
    boleh: [
      "Biaya transport mengikuti pelatihan kompetensi",
      "Konsumsi peserta pelatihan",
      "Keikutsertaan forum KKG/MGMP, KKKS/MKKS (hanya berupa transport dan konsumsi)"
    ],
    tidakBoleh: [
      "Apabila lembaga sudah mendapatkan hibah/block grant KKG/MGMP sejenis di tahun yang sama, dana BPPDGS tidak boleh dipakai untuk keperluan yang sama"
    ]
  },
  {
    id: "operasional",
    nama: "Operasional & manajemen pengelolaan BPPDGS",
    label: "Operasional & manajemen pengelolaan BPPDGS",
    deskripsi: "Pembiayaan penyusunan pelaporan dan operasional pengelolaan dana hibah BPPDGS.",
    boleh: [
      "Pembelian ATK khusus program BPPDGS",
      "Penggandaan berkas laporan pertanggungjawaban (LPJ)",
      "Biaya surat-menyurat program",
      "Insentif / transport bendahara & penanggung jawab program untuk mengelola dana, membuat pertanggungjawaban, dan menyusun laporan"
    ],
    tidakBoleh: [
      "Pembayaran insentif bagi personel di luar bendahara dan penanggung jawab program",
      "Penggunaan anggaran melebihi batas ketentuan operasional"
    ]
  }
];

export const SATUAN_BARANG_SUGGESTIONS = [
  "Orang",
  "Lembar",
  "Rim",
  "Buah",
  "Paket",
  "Bendel",
  "Unit",
  "Kardus",
  "Buku",
  "Set",
  "Meter",
  "Pcs"
];

export const SATUAN_VOLUME_SUGGESTIONS = [
  "Bulan",
  "Kegiatan",
  "Tahun",
  "Hari",
  "Kali",
  "Paket",
  "Semester"
];
