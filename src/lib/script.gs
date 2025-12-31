/**
 * URUSDIRI CENTRAL PROXY - TABULAR VERSION + GOOGLE DRIVE STORAGE
 * Data disimpan dalam format tabel. Gambar diupload ke Google Drive jika URL Folder btersedia.
 */

function doPost(e) {
  const res = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openByUrl(data.sheetUrl);

    if (data.action === "push") {
      const folderId = extractFolderId(data.folderUrl);
      const processedPayload = processImages(data.payload, folderId);
      saveTabularData(ss, processedPayload);
      return res.setContent(JSON.stringify({ status: "success" }));
    } else if (data.action === "pull") {
      const payload = getTabularData(ss);
      return res.setContent(JSON.stringify({ status: "success", payload: payload }));
    }
  } catch (err) {
    return res.setContent(JSON.stringify({ status: "error", message: err.toString() }));
  }
}

/**
 * Ekstrak Folder ID dari URL Google Drive
 */
function extractFolderId(folderLink) {
  if (!folderLink) return null;
  const match = folderLink.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Proses upload gambar ke Google Drive dan ganti base64 dengan URL
 */
function processImages(payload, folderId) {
  if (!folderId || !payload.reflections) return payload;

  payload.reflections = payload.reflections.map(r => {
    if (r.images && r.images.length > 0) {
      r.images = r.images.map((img, idx) => {
        // Jika sudah berupa URL (e.g. docs.google.com), jangan upload lagi
        if (img.startsWith('http')) return img;
        
        // Upload Base64 ke Drive
        try {
          const fileName = "UrusDiri_" + r.id + "_" + idx + ".jpg";
          const base64Data = img.split(",")[1];
          const contentType = img.split(":")[1].split(";")[0];
          const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
          const folder = DriveApp.getFolderById(folderId);
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          return "https://drive.usercontent.google.com/download?id=" + file.getId() + "&export=download";
        } catch (e) {
          return "Error: " + e.toString();
        }
      });
    }
    return r;
  });
  
  return payload;
}

/**
 * Simpan data ke Spreadsheet dalam format tabel
 */
function saveTabularData(ss, data) {
  const refSheet = getOrCreateSheet(ss, "Refleksi");
  refSheet.clearContents();
  refSheet.appendRow(["ID", "Tanggal", "Hari Ini", "Hambatan", "Perubahan Kecil", "Rencana Besok", "Links Foto"]);
  
  data.reflections.forEach((r) => {
    refSheet.appendRow([
      r.id, 
      r.date, 
      r.winOfDay, 
      r.hurdle, 
      r.smallChange, 
      (r.priorities || []).join(", "),
      (r.images || []).join("\n")
    ]);
  });

  // 2. Simpan Prioritas (Master)
  const prioSheet = getOrCreateSheet(ss, "Prioritas_Aktif");
  prioSheet.clearContents().appendRow(["ID", "Tugas", "Status", "Update Terakhir"]);
  data.priorities.forEach(p => {
    prioSheet.appendRow([p.id, p.text, p.completed ? "SELESAI" : "BELUM", p.updatedAt]);
  });

  // 3. Simpan Rutinitas
  const routSheet = getOrCreateSheet(ss, "Rutinitas_Master");
  routSheet.clearContents().appendRow(["ID", "Waktu", "Kegiatan", "Kategori", "Status Hari Ini"]);
  data.routines.forEach(r => {
    routSheet.appendRow([r.id, `${r.startTime}-${r.endTime}`, r.activity, r.category, r.completedAt ? "CEKLIS" : "-"]);
  });

  // 4. Simpan Catatan
  const noteSheet = getOrCreateSheet(ss, "Catatan");
  noteSheet.clearContents().appendRow(["ID", "Judul", "Isi", "Dibuat"]);
  data.notes.forEach(n => {
    noteSheet.appendRow([n.id, n.title, n.content, n.createdAt]);
  });
  
  // Format Header
  [refSheet, prioSheet, routSheet, noteSheet].forEach(s => {
    s.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
    s.setFrozenRows(1);
  });

  // 5. Simpan JSON utuh di sheet tersembunyi agar Pull 100% akurat
  let metaSheet = getOrCreateSheet(ss, "_SYNC_METADATA_");
  metaSheet.clearContents();
  metaSheet.getRange("A1").setValue(JSON.stringify(data));
  try { metaSheet.hideSheet(); } catch(e) {}
}

/**
 * Ambil data JSON dari sheet tersembunyi
 */
function getTabularData(ss) {
  let metaSheet = ss.getSheetByName("_SYNC_METADATA_");
  if (!metaSheet) return null;
  const jsonStr = metaSheet.getRange("A1").getValue();
  return jsonStr ? JSON.parse(jsonStr) : null;
}

/**
 * Utilitas helper untuk mendapatkan atau membuat sheet
 */
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  return sheet;
}

/**
 * JALANKAN INI SEKALI SAJA DI EDITOR UNTUK MEMBERIKAN IZIN
 */
function initPermissions() {
  DriveApp.getRootFolder();
  SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Izin Google Drive & Spreadsheet berhasil diberikan!");
}