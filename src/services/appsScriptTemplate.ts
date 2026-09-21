/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT DATABASE - RAB MADRASAH DINIYAH (BPPDGS)
 * -----------------------------------------------------------------
 * ID Spreadsheet: 1qpwmTBXZiHUj-ULJQC8f3KkJrePZoZjqlpDvMJHisDsZtV7iGS64NZdc
 */

// ID Spreadsheet Google Anda
var SPREADSHEET_ID = "1qpwmTBXZiHUj-ULJQC8f3KkJrePZoZjqlpDvMJHisDsZtV7iGS64NZdc";

/**
 * ⭐️ FUNGSI 1: INSIALISASI MANUAL DI EDITOR APPS SCRIPT
 * Pilih fungsi 'inisialisasiDatabase' di toolbar atas Apps Script, lalu klik 'Jalankan' (Run).
 * Ketiga sheet (Profil_Lembaga, Daftar_RAB, Rincian_RAB) akan langsung terbuat seketika!
 */
function inisialisasiDatabase() {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Gagal membuka spreadsheet. Pastikan script ini dibuka dari menu Ekstensi > Apps Script di Spreadsheet Anda.");
  }
  initSheets(ss);
  var sheetNames = ss.getSheets().map(function(s) { return s.getName(); });
  Logger.log("✅ SUKSES! Sheet database berhasil dibuat di Spreadsheet: " + ss.getName());
  Logger.log("Daftar sheet sekarang: " + sheetNames.join(", "));
  return "Berhasil membuat sheet: " + sheetNames.join(", ");
}

/**
 * ⭐️ FUNGSI 2: MENU OTOMATIS DI GOOGLE SHEETS
 * Saat Anda membuka / me-refresh file Spreadsheet, menu '⚙️ Database RAB'
 * akan muncul otomatis di toolbar atas Google Sheets.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('⚙️ Database RAB')
      .addItem('🛠️ Buat / Inisialisasi Sheet Otomatis', 'inisialisasiDatabase')
      .addToUi();
  } catch(e) {
    console.warn("onOpen UI error:", e);
  }
}

function getSpreadsheet() {
  var ss = null;
  // 1. Coba getActiveSpreadsheet terlebih dahulu (jika script dibuka dari menu Ekstensi)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch(e) {}

  // 2. Jika bukan container-bound, buka lewat ID
  if (!ss && SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch(err) {
      console.warn("Gagal membuka dengan openById:", err);
    }
  }

  // 3. Fallback
  if (!ss) {
    try {
      ss = SpreadsheetApp.openById("1qpwmTBXZiHUj-ULJQC8f3KkJrePZoZjqlpDvMJHisDsZtV7iGS64NZdc");
    } catch(e) {}
  }

  return ss;
}

function doGet(e) {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      return createResponse({ success: false, message: "Spreadsheet tidak ditemukan. Periksa ID Spreadsheet." });
    }
    
    // Selalu pastikan sheet ada saat ada request masuk
    initSheets(ss);
    
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'init_sheets';
    
    if (action === 'ping' || action === 'init' || action === 'init_sheets') {
      var sheets = ss.getSheets().map(function(s) { return s.getName(); });
      return createResponse({ 
        success: true, 
        message: "Koneksi berhasil! Sheet Profil_Lembaga, Daftar_RAB, dan Rincian_RAB telah terbentuk.",
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        sheets: sheets
      });
    }
    
    if (action === 'get_profil') {
      var sheet = ss.getSheetByName('Profil_Lembaga') || 
                  ss.getSheetByName('Profil') || 
                  ss.getSheetByName('Profil Lembaga') || 
                  ss.getSheetByName('Data Profil') ||
                  ss.getSheetByName('Profil_Madin');
      if (!sheet) {
        return createResponse({ success: false, message: "Sheet Profil_Lembaga atau Profil belum ditemukan." });
      }
      var data = sheet.getDataRange().getValues();
      var profil = {};

      function normalizeKey(k) {
        var str = (k || '').toString().trim().toLowerCase();
        if (/nama.*lembaga|nama.*madin|nama.*sekolah|^madrasah|^sekolah/i.test(str)) return 'namaLembaga';
        if (/^nsm|no.*statistik/i.test(str)) return 'nsm';
        if (/nama.*kepala|^kepala/i.test(str)) return 'namaKepala';
        if (/nama.*bendahara|^bendahara/i.test(str)) return 'namaBendahara';
        if (/nip.*kepala|niy.*kepala/i.test(str)) return 'nipKepala';
        if (/nip.*bendahara|niy.*bendahara/i.test(str)) return 'nipBendahara';
        if (/^alamat|^jalan/i.test(str)) return 'alamat';
        if (/^desa|^kelurahan/i.test(str)) return 'desa';
        if (/^kecamatan/i.test(str)) return 'kecamatan';
        if (/kota.*tanggal|tempat.*tanggal/i.test(str)) return 'kotaTanggal';
        if (/^kabupaten|^kota/i.test(str)) return 'kabupaten';
        if (/sumber.*dana/i.test(str)) return 'sumberDanaOptions';
        return k.toString().trim();
      }

      // Deteksi apakah format baris horizontal (Baris 1 = Kolom, Baris 2 = Nilai)
      var isVertical = true;
      if (data.length >= 2 && data[0].length >= 3) {
        var hStr = data[0].join(' ').toLowerCase();
        if ((hStr.indexOf('nama') !== -1 || hStr.indexOf('madrasah') !== -1 || hStr.indexOf('nsm') !== -1) && 
            data[0][0].toString().toLowerCase() !== 'key') {
          isVertical = false;
        }
      }

      if (isVertical) {
        for (var i = 1; i < data.length; i++) {
          var rawKey = data[i][0];
          var val = data[i][1];
          if (rawKey !== '' && rawKey !== null && rawKey !== undefined) {
            var normKey = normalizeKey(rawKey);
            if (normKey === 'sumberDanaOptions') {
              try {
                profil[normKey] = JSON.parse(val);
              } catch(e) {
                profil[normKey] = val.toString().split(',').map(function(s) { return s.trim(); });
              }
            } else {
              profil[normKey] = val !== undefined && val !== null ? val.toString().trim() : '';
            }
          }
        }
      } else {
        var headers = data[0];
        var rowVal = data[1] || [];
        for (var c = 0; c < headers.length; c++) {
          var h = headers[c];
          if (h) {
            var normKey = normalizeKey(h);
            var val = rowVal[c];
            if (normKey === 'sumberDanaOptions') {
              try {
                profil[normKey] = JSON.parse(val);
              } catch(e) {
                profil[normKey] = val ? val.toString().split(',').map(function(s) { return s.trim(); }) : ['DAU', 'BKK'];
              }
            } else {
              profil[normKey] = val !== undefined && val !== null ? val.toString().trim() : '';
            }
          }
        }
      }

      return createResponse({ success: true, data: profil });
    }

    if (action === 'get_penerimaan_dana') {
      var sheetPen = ss.getSheetByName('Penerimaan_Dana');
      var dataPen = sheetPen ? sheetPen.getDataRange().getValues() : [];
      var listPen = [];
      for (var i = 1; i < dataPen.length; i++) {
        if (dataPen[i][0]) {
          listPen.push({
            id: dataPen[i][0].toString(),
            madinId: dataPen[i][1] ? dataPen[i][1].toString() : '',
            tahun: dataPen[i][2] ? dataPen[i][2].toString() : '',
            tanggal: dataPen[i][3] ? dataPen[i][3].toString() : '',
            sumberDana: dataPen[i][4] ? dataPen[i][4].toString() : '',
            jumlah: Number(dataPen[i][5]) || 0,
            keterangan: dataPen[i][6] ? dataPen[i][6].toString() : '',
            createdAt: dataPen[i][7] ? dataPen[i][7].toString() : ''
          });
        }
      }
      return createResponse({ success: true, data: listPen });
    }

    if (action === 'get_kwitansi_list') {
      var sheetKwt = ss.getSheetByName('Kwitansi_Belanja');
      var dataKwt = sheetKwt ? sheetKwt.getDataRange().getValues() : [];
      var listKwt = [];
      for (var i = 1; i < dataKwt.length; i++) {
        if (dataKwt[i][0]) {
          var jsonStr = dataKwt[i][9];
          if (jsonStr) {
            try {
              listKwt.push(JSON.parse(jsonStr));
            } catch(e) {
              listKwt.push({
                id: dataKwt[i][0].toString(),
                madinId: dataKwt[i][1] ? dataKwt[i][1].toString() : '',
                tahun: dataKwt[i][2] ? dataKwt[i][2].toString() : '',
                nomorKwitansi: dataKwt[i][3] ? dataKwt[i][3].toString() : '',
                tanggal: dataKwt[i][4] ? dataKwt[i][4].toString() : '',
                sumberDana: dataKwt[i][5] ? dataKwt[i][5].toString() : '',
                penerima: dataKwt[i][6] ? dataKwt[i][6].toString() : '',
                totalJumlah: Number(dataKwt[i][7]) || 0,
                uraianPembayaran: dataKwt[i][8] ? dataKwt[i][8].toString() : ''
              });
            }
          }
        }
      }
      return createResponse({ success: true, data: listKwt });
    }
    
    if (action === 'get_rab_list') {
      var sheet = ss.getSheetByName('Daftar_RAB');
      var data = sheet ? sheet.getDataRange().getValues() : [];
      var list = [];
      for (var i = 1; i < data.length; i++) {
        var tahun = data[i][0];
        var sumberDana = data[i][1];
        var totalAnggaran = Number(data[i][2]);
        var rabJson = data[i][3];
        if (tahun) {
          try {
            var rabObj = JSON.parse(rabJson);
            list.push(rabObj);
          } catch(err) {
            list.push({
              tahun: tahun.toString(),
              sumberDana: sumberDana,
              totalAnggaran: totalAnggaran,
              komponenList: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      return createResponse({ success: true, data: list });
    }
    
    return createResponse({ success: false, message: "Action doGet tidak dikenal: " + action });
  } catch(err) {
    return createResponse({ success: false, message: "Error pada doGet: " + err.message });
  }
}

function doPost(e) {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      return createResponse({ success: false, message: "Spreadsheet tidak ditemukan." });
    }
    initSheets(ss);
    
    var postData;
    try {
      postData = JSON.parse(e.postData.contents);
    } catch(err) {
      return createResponse({ success: false, message: "Format payload JSON tidak valid: " + err.message });
    }
    
    var action = postData.action;
    
    if (action === 'save_profil') {
      var sheet = ss.getSheetByName('Profil_Lembaga');
      if (!sheet) {
        sheet = ss.insertSheet('Profil_Lembaga');
      }
      sheet.clear();
      sheet.appendRow(['Key', 'Value']);
      sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#dcfce7');
      
      var profil = postData.data;
      for (var key in profil) {
        if (profil.hasOwnProperty(key)) {
          var val = profil[key];
          if (Array.isArray(val)) {
            val = JSON.stringify(val);
          }
          sheet.appendRow([key, val]);
        }
      }
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "Profil lembaga berhasil disimpan." });
    }
    
    if (action === 'save_rab') {
      var rab = postData.data;
      var tahun = rab.tahun.toString();
      
      // 1. Simpan ke Daftar_RAB (Master JSON)
      var sheetDaftar = ss.getSheetByName('Daftar_RAB');
      if (!sheetDaftar) sheetDaftar = ss.insertSheet('Daftar_RAB');
      var dataDaftar = sheetDaftar.getDataRange().getValues();
      var rowIdx = -1;
      for (var i = 1; i < dataDaftar.length; i++) {
        if (dataDaftar[i][0].toString() === tahun) {
          rowIdx = i + 1; // 1-indexed
          break;
        }
      }
      
      var rowData = [
        tahun,
        rab.sumberDana,
        rab.totalAnggaran,
        JSON.stringify(rab)
      ];
      
      if (rowIdx > 0) {
        sheetDaftar.getRange(rowIdx, 1, 1, 4).setValues([rowData]);
      } else {
        sheetDaftar.appendRow(rowData);
      }
      
      // 2. Simpan ke Rincian_RAB (Tabel Rata untuk Laporan / Filter)
      var sheetRincian = ss.getSheetByName('Rincian_RAB');
      if (!sheetRincian) sheetRincian = ss.insertSheet('Rincian_RAB');
      var dataRincian = sheetRincian.getDataRange().getValues();
      
      // Hapus rincian tahun yang sama terlebih dahulu agar tidak duplikat
      for (var i = dataRincian.length - 1; i >= 1; i--) {
        if (dataRincian[i][0].toString() === tahun) {
          sheetRincian.deleteRow(i + 1);
        }
      }
      
      // Masukkan rincian baris baru
      rab.komponenList.forEach(function(komponen) {
        komponen.items.forEach(function(item) {
          sheetRincian.appendRow([
            tahun,
            komponen.nama,
            item.uraian,
            item.jumlah,
            item.satuan,
            item.volume,
            item.satuanVolume,
            item.satuanHarga,
            item.total
          ]);
        });
      });
      
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "RAB Tahun " + tahun + " berhasil disimpan." });
    }
    
    if (action === 'delete_rab') {
      var tahun = postData.tahun.toString();
      
      // Hapus dari Daftar_RAB
      var sheetDaftar = ss.getSheetByName('Daftar_RAB');
      if (sheetDaftar) {
        var dataDaftar = sheetDaftar.getDataRange().getValues();
        for (var i = dataDaftar.length - 1; i >= 1; i--) {
          if (dataDaftar[i][0].toString() === tahun) {
            sheetDaftar.deleteRow(i + 1);
          }
        }
      }
      
      // Hapus dari Rincian_RAB
      var sheetRincian = ss.getSheetByName('Rincian_RAB');
      if (sheetRincian) {
        var dataRincian = sheetRincian.getDataRange().getValues();
        for (var i = dataRincian.length - 1; i >= 1; i--) {
          if (dataRincian[i][0].toString() === tahun) {
            sheetRincian.deleteRow(i + 1);
          }
        }
      }
      
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "RAB Tahun " + tahun + " berhasil dihapus." });
    }

    if (action === 'save_penerimaan_dana') {
      var pen = postData.data;
      var sheetPen = ss.getSheetByName('Penerimaan_Dana');
      if (!sheetPen) sheetPen = ss.insertSheet('Penerimaan_Dana');
      var dataPen = sheetPen.getDataRange().getValues();
      var penRow = -1;
      for (var i = 1; i < dataPen.length; i++) {
        if (dataPen[i][0].toString() === pen.id.toString()) {
          penRow = i + 1;
          break;
        }
      }
      var penRowData = [
        pen.id,
        pen.madinId || '',
        pen.tahun,
        pen.tanggal,
        pen.sumberDana,
        pen.jumlah,
        pen.keterangan || '',
        pen.createdAt || new Date().toISOString()
      ];
      if (penRow > 0) {
        sheetPen.getRange(penRow, 1, 1, 8).setValues([penRowData]);
      } else {
        sheetPen.appendRow(penRowData);
      }
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "Penerimaan dana berhasil dicatat." });
    }

    if (action === 'delete_penerimaan_dana') {
      var penId = (postData.id || '').toString();
      var sheetPen = ss.getSheetByName('Penerimaan_Dana');
      if (sheetPen) {
        var dataPen = sheetPen.getDataRange().getValues();
        for (var i = dataPen.length - 1; i >= 1; i--) {
          if (dataPen[i][0].toString() === penId) {
            sheetPen.deleteRow(i + 1);
          }
        }
      }
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "Penerimaan dana berhasil dihapus." });
    }

    if (action === 'save_kwitansi') {
      var kwt = postData.data;
      var sheetKwt = ss.getSheetByName('Kwitansi_Belanja');
      if (!sheetKwt) sheetKwt = ss.insertSheet('Kwitansi_Belanja');
      var dataKwt = sheetKwt.getDataRange().getValues();
      var kwtRow = -1;
      for (var i = 1; i < dataKwt.length; i++) {
        if (dataKwt[i][0].toString() === kwt.id.toString()) {
          kwtRow = i + 1;
          break;
        }
      }
      var kwtRowData = [
        kwt.id,
        kwt.madinId || '',
        kwt.tahun,
        kwt.nomorKwitansi,
        kwt.tanggal,
        kwt.sumberDana,
        kwt.penerima,
        kwt.totalJumlah,
        kwt.uraianPembayaran,
        JSON.stringify(kwt)
      ];
      if (kwtRow > 0) {
        sheetKwt.getRange(kwtRow, 1, 1, 10).setValues([kwtRowData]);
      } else {
        sheetKwt.appendRow(kwtRowData);
      }

      // Rincian_Belanja (Flat table item belanja)
      var sheetRincianKwt = ss.getSheetByName('Rincian_Belanja');
      if (!sheetRincianKwt) sheetRincianKwt = ss.insertSheet('Rincian_Belanja');
      var dataRincianKwt = sheetRincianKwt.getDataRange().getValues();
      for (var i = dataRincianKwt.length - 1; i >= 1; i--) {
        if (dataRincianKwt[i][0].toString() === kwt.id.toString()) {
          sheetRincianKwt.deleteRow(i + 1);
        }
      }
      if (Array.isArray(kwt.items)) {
        kwt.items.forEach(function(item) {
          sheetRincianKwt.appendRow([
            kwt.id,
            kwt.madinId || '',
            kwt.tahun,
            kwt.nomorKwitansi,
            kwt.tanggal,
            item.namaKomponen || '',
            item.uraianItem || '',
            item.jumlahRealisasi || 0
          ]);
        });
      }

      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "Kwitansi belanja berhasil disimpan." });
    }

    if (action === 'delete_kwitansi') {
      var kwtId = (postData.id || '').toString();
      var sheetKwt = ss.getSheetByName('Kwitansi_Belanja');
      if (sheetKwt) {
        var dataKwt = sheetKwt.getDataRange().getValues();
        for (var i = dataKwt.length - 1; i >= 1; i--) {
          if (dataKwt[i][0].toString() === kwtId) {
            sheetKwt.deleteRow(i + 1);
          }
        }
      }
      var sheetRincianKwt = ss.getSheetByName('Rincian_Belanja');
      if (sheetRincianKwt) {
        var dataRincianKwt = sheetRincianKwt.getDataRange().getValues();
        for (var i = dataRincianKwt.length - 1; i >= 1; i--) {
          if (dataRincianKwt[i][0].toString() === kwtId) {
            sheetRincianKwt.deleteRow(i + 1);
          }
        }
      }
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: "Kwitansi belanja berhasil dihapus." });
    }
    
    return createResponse({ success: false, message: "Action doPost tidak dikenal: " + action });
  } catch(err) {
    return createResponse({ success: false, message: "Error pada doPost: " + err.message });
  }
}

// Fungsi inisialisasi sheet otomatis
function initSheets(ss) {
  if (!ss) return;
  
  // 1. Profil_Lembaga
  var s1 = ss.getSheetByName('Profil_Lembaga');
  if (!s1) {
    s1 = ss.insertSheet('Profil_Lembaga');
  }
  if (s1.getLastRow() === 0) {
    s1.appendRow(['Key', 'Value']);
    s1.getRange('A1:B1').setFontWeight('bold').setBackground('#dcfce7');
  }
  
  // 2. Daftar_RAB
  var s2 = ss.getSheetByName('Daftar_RAB');
  if (!s2) {
    s2 = ss.insertSheet('Daftar_RAB');
  }
  if (s2.getLastRow() === 0) {
    s2.appendRow(['Tahun', 'Sumber_Dana', 'Total_Anggaran', 'Data_RAB']);
    s2.getRange('A1:D1').setFontWeight('bold').setBackground('#e0e7ff');
  }
  
  // 3. Rincian_RAB
  var s3 = ss.getSheetByName('Rincian_RAB');
  if (!s3) {
    s3 = ss.insertSheet('Rincian_RAB');
  }
  if (s3.getLastRow() === 0) {
    s3.appendRow(['Tahun', 'Komponen', 'Uraian', 'Jumlah', 'Satuan', 'Volume', 'Satuan_Volume', 'Harga_Satuan', 'Total_Harga']);
    s3.getRange('A1:I1').setFontWeight('bold').setBackground('#fef3c7');
  }

  // 4. Penerimaan_Dana (Dana Hibah Tahunan per Madin)
  var s4 = ss.getSheetByName('Penerimaan_Dana');
  if (!s4) {
    s4 = ss.insertSheet('Penerimaan_Dana');
  }
  if (s4.getLastRow() === 0) {
    s4.appendRow(['ID', 'Madin_ID', 'Tahun', 'Tanggal', 'Sumber_Dana', 'Jumlah', 'Keterangan', 'CreatedAt']);
    s4.getRange('A1:H1').setFontWeight('bold').setBackground('#dbeafe');
  }

  // 5. Kwitansi_Belanja (Master Kwitansi SPJ)
  var s5 = ss.getSheetByName('Kwitansi_Belanja');
  if (!s5) {
    s5 = ss.insertSheet('Kwitansi_Belanja');
  }
  if (s5.getLastRow() === 0) {
    s5.appendRow(['ID', 'Madin_ID', 'Tahun', 'No_Kwitansi', 'Tanggal', 'Sumber_Dana', 'Penerima', 'Total_Jumlah', 'Uraian', 'Data_JSON']);
    s5.getRange('A1:J1').setFontWeight('bold').setBackground('#dcfce7');
  }

  // 6. Rincian_Belanja (Flat Item Belanja per Kwitansi)
  var s6 = ss.getSheetByName('Rincian_Belanja');
  if (!s6) {
    s6 = ss.insertSheet('Rincian_Belanja');
  }
  if (s6.getLastRow() === 0) {
    s6.appendRow(['ID_Kwitansi', 'Madin_ID', 'Tahun', 'No_Kwitansi', 'Tanggal', 'Pos_Komponen', 'Uraian_Item', 'Jumlah_Realisasi']);
    s6.getRange('A1:H1').setFontWeight('bold').setBackground('#fce7f3');
  }
  
  // 7. Hapus sheet kosong bawaan (Sheet1 / Lembar1) jika sudah ada sheet lain
  var defaultNames = ['Sheet1', 'Sheet 1', 'Lembar1', 'Lembar 1'];
  defaultNames.forEach(function(name) {
    var defSheet = ss.getSheetByName(name);
    if (defSheet && ss.getSheets().length > 3) {
      if (defSheet.getLastRow() <= 1 && defSheet.getLastColumn() <= 1) {
        try {
          ss.deleteSheet(defSheet);
        } catch(e) {}
      }
    }
  });

  // Terapkan perubahan ke spreadsheet seketika
  SpreadsheetApp.flush();
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const SHEET_STRUCTURE_DOC = [
  {
    sheetName: "Profil_Lembaga",
    description: "Menyimpan pengaturan profil sekolah/madrasah diniyah.",
    columns: ["Key (Kolom A)", "Value (Kolom B)"],
    example: [
      { key: "namaLembaga", val: 'MADRASAH DINIYAH "BAITURROHMAN"' },
      { key: "nsm", val: "311235120145" },
      { key: "alamat", val: "Jl. Kyai Ageng Gribig No. 12, Magetan" },
      { key: "namaKepala", val: "KH. MUHAMMAD SYAFII, S.Pd.I." }
    ]
  },
  {
    sheetName: "Daftar_RAB",
    description: "Menyimpan rangkuman RAB per Tahun Anggaran dalam format JSON terstruktur.",
    columns: ["Tahun", "Sumber_Dana", "Total_Anggaran", "Data_RAB (Format JSON)"],
    example: [
      { key: "2025", val: "DAU | Rp 17.285.000 | { ... seluruh data rincian ... }" }
    ]
  },
  {
    sheetName: "Rincian_RAB",
    description: "Tabel rata (flat table) seluruh rincian RAB dari semua tahun, sangat praktis untuk dicetak langsung dari Google Sheets, disaring (Filter), atau dibuat laporan Pivot.",
    columns: ["Tahun", "Komponen", "Uraian", "Jumlah", "Satuan", "Volume", "Satuan_Volume", "Harga_Satuan", "Total_Harga"],
    example: [
      { key: "2025", val: "Honor Ustadz/Ustadzah | Ustadz Kepala Madrasah | 1 | Orang | 12 | Bulan | 500000 | 6000000" }
    ]
  },
  {
    sheetName: "Penerimaan_Dana",
    description: "Pencatatan tanggal dan jumlah pencairan dana hibah tahunan (pembuka saldo BKP dan BKU).",
    columns: ["ID", "Madin_ID", "Tahun", "Tanggal", "Sumber_Dana", "Jumlah", "Keterangan", "CreatedAt"],
    example: [
      { key: "2025", val: "DAU | Rp 20.000.000 | 17/01/2025 | Pencairan Hibah APBD Kab. Magetan" }
    ]
  },
  {
    sheetName: "Kwitansi_Belanja",
    description: "Daftar kwitansi realisasi belanja SPJ beserta penerima, tanggal, dan jumlah rupiah.",
    columns: ["ID", "Madin_ID", "Tahun", "No_Kwitansi", "Tanggal", "Sumber_Dana", "Penerima", "Total_Jumlah", "Uraian", "Data_JSON"],
    example: [
      { key: "01/DAU/2025", val: "Mahmudi | Rp 10.800.000 | Honorarium 6 Ustadz x 6 Bulan" }
    ]
  },
  {
    sheetName: "Rincian_Belanja",
    description: "Tabel rata seluruh item pengeluaran riil per kwitansi belanja untuk audit SPJ.",
    columns: ["ID_Kwitansi", "Madin_ID", "Tahun", "No_Kwitansi", "Tanggal", "Pos_Komponen", "Uraian_Item", "Jumlah_Realisasi"],
    example: [
      { key: "01/DAU/2025", val: "Honorarium guru | Honorarium 6 Ustadz | Rp 10.800.000" }
    ]
  }
];

export const STEP_BY_STEP_GUIDE = [
  "Buka dokumen Google Spreadsheet Anda (ID: 1qpwmTBXZiHUj-ULJQC8f3KkJrePZoZjqlpDvMJHisDsZtV7iGS64NZdc) di browser.",
  "Klik menu 'Ekstensi' (Extensions) di bilah menu atas, lalu pilih 'Apps Script'.",
  "Hapus semua baris kode bawaan yang ada di editor script (hapus 'function myFunction() {}').",
  "Salin (copy) seluruh kode Google Apps Script di bawah ini, lalu paste ke dalam editor script.",
  "Klik tombol Simpan (ikon disket di bar atas editor script).",
  "👉 CARA CEPAT MEMBUAT SHEET: Di toolbar atas Apps Script, pastikan fungsi yang terpilih adalah 'inisialisasiDatabase', lalu klik tombol 'Jalankan' (Run). Berikan otorisasi izin jika diminta. Ketiga sheet (Profil_Lembaga, Daftar_RAB, Rincian_RAB) akan langsung terbuat seketika!",
  "Klik tombol 'Terapkan' (Deploy) di sudut kanan atas > pilih 'Penerapan baru' (New deployment).",
  "Di pop-up penerapan baru, klik ikon gir di sebelah 'Pilih jenis' (Select type) lalu pilih 'Aplikasi Web' (Web App).",
  "Isi konfigurasi berikut:\n- Deskripsi: API Database RAB BPPDGS\n- Jalankan sebagai: 'Saya (email Anda)'\n- Siapa yang memiliki akses: Pilihlah 'Siapa saja' (Anyone) agar aplikasi web dapat mengirim & membaca data.",
  "Klik tombol 'Terapkan' (Deploy). Google akan meminta Anda memberikan otorisasi keamanan. Klik 'Berikan akses' (Authorize access), pilih akun Google Anda, klik 'Advanced' (Lanjutan), lalu klik 'Buka Untitled project (tidak aman)' / 'Go to ... (unsafe)', lalu klik 'Izinkan' (Allow).",
  "Setelah berhasil diterapkan, Google akan menampilkan 'URL Aplikasi Web' (berakhiran /exec). Salin URL tersebut.",
  "Kembali ke aplikasi ini, paste URL tersebut di kolom 'Google Apps Script Web App URL', lalu klik tombol 'Uji Koneksi & Inisialisasi Sheet'."
];
