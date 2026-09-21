/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MASTER_REGISTRY_APPS_SCRIPT = `/**
 * GOOGLE APPS SCRIPT: MASTER REGISTRY TENANT - SANTRI BPPDGS
 * -------------------------------------------------------------------------
 * Script ini dipasang di Google Spreadsheet PUSAT milik Pengembang / Admin.
 * Berfungsi untuk memvalidasi Kode Unik Lembaga & PIN saat pertama kali login,
 * serta mengembalikan URL Web App Spreadsheet masing-masing madrasah.
 */

// Fungsi untuk dijalankan manual pertama kali (Klik Run / Jalankan pada setupMasterRegistry)
function setupMasterRegistry() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Script ini harus dibuka melalui menu: Ekstensi > Apps Script di dalam Google Spreadsheet.");
  }
  var sheet = inisialisasiMasterSheet(ss);
  Logger.log("✅ Inisialisasi Master Sheet berhasil! Sheet 'Daftar_Lembaga' siap digunakan.");
  return "Inisialisasi Master Sheet berhasil!";
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var params = {};
  if (e && e.parameter) {
    params = e.parameter;
  }
  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      for (var key in body) {
        params[key] = body[key];
      }
    } catch(err) {}
  }

  var action = (params.action || "").trim().toLowerCase();
  var result = { success: false, message: "Action tidak dikenal." };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Spreadsheet aktif tidak ditemukan. Pastikan script ini terikat (container-bound) ke Spreadsheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = ss.getSheetByName("Daftar_Lembaga");
    if (!sheet) {
      sheet = inisialisasiMasterSheet(ss);
    }

    if (action === "auth" || action === "verify_code") {
      var kodeInput = String(params.kode || "").trim().toUpperCase();
      var pinInput = String(params.pin || "").trim();

      if (!kodeInput) {
        result = { success: false, message: "Kode lembaga wajib diisi." };
      } else {
        var data = sheet.getDataRange().getValues();
        var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
        var colKode = headers.indexOf("kode");
        var colPin = headers.indexOf("pin");
        var colNama = headers.indexOf("nama_lembaga");
        var colNsm = headers.indexOf("nsm");
        var colUrl = headers.indexOf("url_apps_script");
        var colStatus = headers.indexOf("status");

        if (colKode === -1 || colUrl === -1) {
          result = { success: false, message: "Format kolom spreadsheet master belum sesuai." };
        } else {
          var found = null;
          for (var i = 1; i < data.length; i++) {
            var row = data[i];
            var rowKode = String(row[colKode] || "").trim().toUpperCase();
            var rowPin = colPin >= 0 ? String(row[colPin] || "").trim() : "";
            var rowStatus = colStatus >= 0 ? String(row[colStatus] || "").trim().toUpperCase() : "AKTIF";

            if (rowKode === kodeInput) {
              if (rowStatus === "NONAKTIF" || rowStatus === "SUSPEND") {
                result = { success: false, message: "Akses lembaga dinonaktifkan oleh administrator." };
                found = true;
                break;
              }
              // Jika kolom PIN ada isinya, cek PIN
              if (rowPin && pinInput && rowPin !== pinInput) {
                result = { success: false, message: "PIN / Password lembaga salah." };
                found = true;
                break;
              }
              if (rowPin && !pinInput) {
                result = { success: false, message: "PIN lembaga wajib dimasukkan." };
                found = true;
                break;
              }

              found = true;
              result = {
                success: true,
                message: "Aktivasi berhasil!",
                data: {
                  kode: rowKode,
                  namaLembaga: colNama >= 0 ? String(row[colNama] || "").trim() : "",
                  nsm: colNsm >= 0 ? String(row[colNsm] || "").trim() : "",
                  appsScriptUrl: String(row[colUrl] || "").trim()
                }
              };
              break;
            }
          }

          if (!found) {
            result = { success: false, message: "Kode lembaga tidak terdaftar." };
          }
        }
      }
    } else if (action === "ping") {
      result = { success: true, message: "Master Registry Santri Online." };
    }
  } catch (error) {
    result = { success: false, message: "Kesalahan server master: " + error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function inisialisasiMasterSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  var sheet = ss.getSheetByName("Daftar_Lembaga");
  if (!sheet) {
    sheet = ss.insertSheet("Daftar_Lembaga");
  }
  var headers = ["kode", "pin", "nama_lembaga", "nsm", "url_apps_script", "status", "keterangan"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  
  // Contoh baris awal jika kosong
  if (sheet.getLastRow() <= 1) {
    var contoh = [
      ["MD01", "1234", "MADRASAH DINIYAH \\"BAITURROHMAN\\"", "311235120145", "https://script.google.com/macros/s/AKfycb.../exec", "AKTIF", "Contoh Akun Madin 1"],
      ["MD02", "1234", "MADRASAH DINIYAH \\"AL-HIDAYAH\\"", "311235120188", "https://script.google.com/macros/s/AKfycx.../exec", "AKTIF", "Contoh Akun Madin 2"]
    ];
    sheet.getRange(2, 1, contoh.length, headers.length).setValues(contoh);
  }
  return sheet;
}
`;
