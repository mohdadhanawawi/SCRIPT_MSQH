// Google Apps Script backend for the Script Ketua Unit / Penyelia webapp.
//
// Setup: Google Sheets -> Extensions -> Apps Script -> replace default code with this file
// -> Deploy -> New deployment -> type "Web app" -> Execute as "Me" -> Who has access "Anyone"
// -> Deploy -> copy the /exec URL into config.js (API_URL) in the webapp repo.

var SHEET_NAME = "Records";
var FIELDS = [
  "kawasanId",
  "kawasan",
  "nama",
  "jumlahStaf",
  "kondisiPesakit",
  "jumlahAset",
  "unitBer",
  "pintuKeselamatan",
  "laluanKeselamatan",
  "jumlahFireExt",
  "lokasiFireExt",
  "lokasiHandRub",
  "lokasiWasteBin",
  "protokolKecemasan",
  "kpiDipantau",
  "pencapaianTerkini",
  "lokasiBorangAduan",
  "savedAt",
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(FIELDS);
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var records = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue; // skip blank rows
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
    records.push(obj);
  }
  return jsonResponse_({ ok: true, records: records });
}

function findRowIndex_(sheet, kawasanId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === kawasanId) return i + 2;
  }
  return -1;
}

function upsertRow_(sheet, data) {
  var rowValues = FIELDS.map(function (field) {
    return data[field] !== undefined && data[field] !== null ? data[field] : "";
  });
  var rowIndex = findRowIndex_(sheet, data.kawasanId);
  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, FIELDS.length).setValues([rowValues]);
  }
}

function deleteRow_(sheet, kawasanId) {
  var rowIndex = findRowIndex_(sheet, kawasanId);
  if (rowIndex !== -1) sheet.deleteRow(rowIndex);
}

function doPost(e) {
  var sheet = getSheet_();
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ ok: false, error: "Invalid JSON body" });
  }

  if (payload.action === "save" && payload.data && payload.data.kawasanId) {
    payload.data.savedAt = new Date().toISOString();
    upsertRow_(sheet, payload.data);
    return jsonResponse_({ ok: true, savedAt: payload.data.savedAt });
  }

  if (payload.action === "delete" && payload.kawasanId) {
    deleteRow_(sheet, payload.kawasanId);
    return jsonResponse_({ ok: true });
  }

  return jsonResponse_({ ok: false, error: "Unknown action or missing fields" });
}
