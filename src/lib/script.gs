/**
 * URUSDIRI CENTRAL PROXY - TABULAR VERSION (NO TOKEN)
 * Data disimpan dalam format tabel yang rapi.
 */

function doPost(e) {
  const res = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openByUrl(data.sheetUrl);

    if (data.action === "push") {
      saveTabularData(ss, data.payload);
      return res.setContent(JSON.stringify({ status: "success" }));
    } else if (data.action === "pull") {
      const payload = getTabularData(ss);
      return res.setContent(JSON.stringify({ status: "success", payload: payload }));
    }
  } catch (err) {
    return res.setContent(JSON.stringify({ status: "error", message: err.toString() }));
  }
}

function saveTabularData(ss, data) {
  // 1. Simpan Refleksi
  const refSheet = getOrCreateSheet(ss, "Refleksi");
  refSheet.clearContents().appendRow(["ID", "Tanggal", "Hari Ini", "Hambatan", "Perubahan Kecil", "Rencana Besok"]);
  data.reflections.forEach(r => {
    refSheet.appendRow([r.id, r.date, r.winOfDay, r.hurdle, r.smallChange, (r.priorities || []).join(", ")]);
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

function getTabularData(ss) {
  let metaSheet = ss.getSheetByName("_SYNC_METADATA_");
  if (!metaSheet) return null;
  const jsonStr = metaSheet.getRange("A1").getValue();
  return jsonStr ? JSON.parse(jsonStr) : null;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  return sheet;
}