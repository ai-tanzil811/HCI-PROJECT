/**
 * Nirapod survey — Google Apps Script backend.
 *
 * Setup:
 *  1. Create a Google Sheet (any name).
 *  2. Extensions > Apps Script, delete any starter code, paste this file in.
 *  3. Deploy > New deployment > type "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  4. Copy the resulting /exec URL into ENDPOINT_URL in script.js.
 *
 * Every submission is appended as one row. The header row is created
 * automatically from the keys of the first submission received, so the
 * sheet always matches whatever fields script.js sends.
 */

const SHEET_NAME = "Responses";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No submission data was received.");
    }
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    writeRow(sheet, data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Nirapod survey endpoint is live." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function writeRow(sheet, data) {
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error("The submission did not contain any fields.");
  }

  // First submission: write the header row.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(keys);
  }

  // Keep new fields in sync if a later submission has extra keys.
  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missing = keys.filter((k) => existingHeaders.indexOf(k) === -1);
  missing.forEach((k) => {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue(k);
  });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map((h) => (data[h] !== undefined ? data[h] : ""));
  sheet.appendRow(row);
}
