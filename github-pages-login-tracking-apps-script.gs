/*
  Reserve Standard GitHub Pages login tracking logger

  Setup:
  1. Create a Google Sheet named "Reserve Standard Login Events".
  2. Open Extensions → Apps Script.
  3. Paste this file into Code.gs.
  4. Deploy → New deployment → Web app.
  5. Execute as: Me. Who has access: Anyone.
  6. Copy the Web app URL into site-config.js as loginTrackerEndpoint.

  The site sends no access code. It logs only anonymous browser/device metadata,
  event type, owner flag, page, referrer, viewport, and user agent.
*/

const RS_SHEET_NAME = 'Login Events';
const RS_HEADERS = [
  'receivedAt',
  'siteTimestamp',
  'event',
  'method',
  'clientId',
  'isOwner',
  'ownerLabel',
  'path',
  'page',
  'referrer',
  'timezone',
  'viewport',
  'screen',
  'userAgent',
  'siteVersion',
  'source'
];

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(RS_SHEET_NAME) || ss.insertSheet(RS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RS_HEADERS);
    sheet.setFrozenRows(1);
  }

  const data = readPayload_(e);
  sheet.appendRow([
    new Date(),
    data.timestamp || '',
    data.event || '',
    data.method || '',
    data.clientId || '',
    data.isOwner || '',
    data.ownerLabel || '',
    data.path || '',
    data.page || '',
    data.referrer || '',
    data.timezone || '',
    data.viewport || '',
    data.screen || '',
    data.userAgent || '',
    data.version || '',
    data.source || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function readPayload_(e) {
  const params = Object.assign({}, e && e.parameter ? e.parameter : {});

  if (Object.keys(params).length) return params;

  try {
    const contents = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (!contents) return {};
    if (contents.trim().charAt(0) === '{') return JSON.parse(contents);

    contents.split('&').forEach(part => {
      const pieces = part.split('=');
      const key = decodeURIComponent((pieces[0] || '').replace(/\+/g, ' '));
      const val = decodeURIComponent((pieces.slice(1).join('=') || '').replace(/\+/g, ' '));
      if (key) params[key] = val;
    });
  } catch (err) {}

  return params;
}
