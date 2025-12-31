/**
 * URUSDIRI CENTRAL PROXY SCRIPT
 * Gunakan satu script ini untuk semua Google Sheet user.
 */

// Gunakan token ini agar tidak sembarang orang bisa memakai script-mu
const ACCESS_TOKEN = "GANTI_DENGAN_TOKEN_RAHASIAMU"; 

function doPost(e) {
  const res = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Cek Token Akses
    if (data.token !== ACCESS_TOKEN) {
      return res.setContent(JSON.stringify({ status: "error", message: "Invalid Access Token" }));
    }

    // 2. Cek Sheet URL
    const sheetUrl = data.sheetUrl;
    if (!sheetUrl) {
      return res.setContent(JSON.stringify({ status: "error", message: "Google Sheet URL is missing" }));
    }

    // 3. Coba Buka Sheet (Akan gagal jika belum di-share ke Everyone with link)
    let ss;
    try {
      ss = SpreadsheetApp.openByUrl(sheetUrl);
    } catch (e) {
      return res.setContent(JSON.stringify({ 
        status: "error", 
        message: "Akses Ditolak: Pastikan Sheet diatur ke 'Anyone with the link can EDIT'" 
      }));
    }

    // 4. Proses Push/Pull
    if (data.action === "push") {
      saveToSheet(ss, data.payload);
      return res.setContent(JSON.stringify({ status: "success", message: "Data berhasil disimpan ke Spreadsheet Anda!" }));
    } else if (data.action === "pull") {
      const payload = getFromSheet(ss);
      return res.setContent(JSON.stringify({ status: "success", payload: payload }));
    }

  } catch (err) {
    return res.setContent(JSON.stringify({ status: "error", message: "Server Error: " + err.toString() }));
  }
}

// Fungsi pembantu simpan & baca tetap sama seperti sebelumnya, tapi menerima objek Spreadsheet (ss)
function saveToSheet(ss, payload) {
  let sheet = ss.getSheetByName("APP_DATA") || ss.insertSheet("APP_DATA");
  sheet.getRange("A1:B1").setValues([["FULL_BACKUP_JSON", "LAST_UPDATED"]]);
  sheet.getRange("A2").setValue(JSON.stringify(payload));
  sheet.getRange("B2").setValue(new Date().toISOString());
  
  // Update readable history
  let historySheet = ss.getSheetByName("HISTORY_LOG") || ss.insertSheet("HISTORY_LOG");
  historySheet.clearContents();
  historySheet.appendRow(["ID", "Date", "Win Of Day", "Hurdle"]);
  payload.reflections.forEach(r => historySheet.appendRow([r.id, r.date, r.winOfDay, r.hurdle]));
}

function getFromSheet(ss) {
  const sheet = ss.getSheetByName("APP_DATA");
  return sheet ? JSON.parse(sheet.getRange("A2").getValue()) : null;
}