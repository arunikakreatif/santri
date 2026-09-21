/**
 * Utility untuk konversi angka ke kalimat terbilang Bahasa Indonesia
 * Contoh: 5400000 -> "Lima Juta Empat Ratus Ribu Rupiah"
 */

const SATUAN = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas"
];

function angkaKeKata(n: number): string {
  if (n < 12) {
    return SATUAN[n];
  } else if (n < 20) {
    return angkaKeKata(n - 10) + " Belas";
  } else if (n < 100) {
    const sisa = n % 10;
    return SATUAN[Math.floor(n / 10)] + " Puluh" + (sisa > 0 ? " " + SATUAN[sisa] : "");
  } else if (n < 200) {
    const sisa = n - 100;
    return "Seratus" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  } else if (n < 1000) {
    const sisa = n % 100;
    return SATUAN[Math.floor(n / 100)] + " Ratus" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  } else if (n < 2000) {
    const sisa = n - 1000;
    return "Seribu" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  } else if (n < 1000000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    return angkaKeKata(ribu) + " Ribu" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  } else if (n < 1000000000) {
    const juta = Math.floor(n / 1000000);
    const sisa = n % 1000000;
    return angkaKeKata(juta) + " Juta" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  } else if (n < 1000000000000) {
    const milyar = Math.floor(n / 1000000000);
    const sisa = n % 1000000000;
    return angkaKeKata(milyar) + " Milyar" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  } else if (n < 1000000000000000) {
    const triliun = Math.floor(n / 1000000000000);
    const sisa = n % 1000000000000;
    return angkaKeKata(triliun) + " Triliun" + (sisa > 0 ? " " + angkaKeKata(sisa) : "");
  }
  return n.toString();
}

export function terbilang(nominal: number): string {
  if (isNaN(nominal) || nominal === null || nominal === undefined) {
    return "Nol Rupiah";
  }
  const bulat = Math.floor(Math.abs(nominal));
  if (bulat === 0) {
    return "Nol Rupiah";
  }
  const hasil = angkaKeKata(bulat).trim();
  // Format Title Case yang rapi dan tambahkan Rupiah
  return `${hasil} Rupiah`;
}

export const generateTerbilangRupiah = terbilang;
