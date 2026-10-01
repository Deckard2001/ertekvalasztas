/**
 * Schwartz-értéktérkép – minimális háttér egy Google Táblázatban.
 * Telepítés: lásd README.md („Csoportos mód”).
 * Csak a 21 nyers választ, a csoportkódot és egy véletlen azonosítót tárolja.
 */
var SHEET_NAME = 'valaszok';

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'add') return add_(p);
    if (p.action === 'list') return list_(p.s);
    return json_({ ok: false, error: 'Ismeretlen művelet' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange('A:D').setNumberFormat('@'); // minden szövegként, hogy a ';' ne alakuljon számmá
    sh.appendRow(['idopont', 'csoport', 'azonosito', 'valaszok_1_21']);
  }
  return sh;
}

function add_(p) {
  var s = String(p.s || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  var id = String(p.id || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
  var r = String(p.r || '');
  if (!s || !id) return json_({ ok: false, error: 'Hiányzó csoportkód vagy azonosító' });
  if (!/^[1-6](;[1-6]){20}$/.test(r)) return json_({ ok: false, error: 'Érvénytelen válaszsor' });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([new Date().toISOString(), s, id, r]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function list_(s) {
  s = String(s || '');
  var values = sheet_().getDataRange().getValues().slice(1);
  var latest = {};
  values.forEach(function (row) {
    if (String(row[1]) === s) latest[String(row[2])] = { id: String(row[2]), r: String(row[3]) };
  });
  var rows = Object.keys(latest).map(function (k) { return latest[k]; });
  return json_({ ok: true, rows: rows });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
