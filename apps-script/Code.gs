/**
 * 미사강변중학교 다면평가 수합용 Google Apps Script
 *
 * 시트 구성 (처음 제출 때 자동으로 만들어집니다)
 *  - "제출기록": 모든 제출이 한 줄씩 쌓입니다. (수정 이력 포함)
 *  - "최종"    : 선생님 성함당 한 줄. 다시 제출하면 최신 내용으로 덮어씁니다.
 */

const SHEET_LOG = '제출기록';
const SHEET_FINAL = '최종';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    const name = String(data['성함'] || '').trim();
    if (!name) return json_({ ok: false, error: '성함이 비어 있습니다.' });

    const row = Object.assign({ '제출일시': new Date() }, data);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    appendRow_(getSheet_(ss, SHEET_LOG), row);
    upsertByName_(getSheet_(ss, SHEET_FINAL), row, name);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 브라우저에서 주소를 열었을 때 동작 확인용
function doGet() {
  return json_({ ok: true, message: '다면평가 수합 서버가 동작 중입니다.' });
}

function getSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// 헤더(1행)를 데이터 키에 맞춰 준비하고, 없는 열은 뒤에 추가
function headers_(sheet, row) {
  const keys = Object.keys(row);
  let headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
    : [];
  const missing = keys.filter(k => headers.indexOf(k) === -1);
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return headers;
}

function toValues_(headers, row) {
  return headers.map(h => (row[h] === undefined || row[h] === null) ? '' : row[h]);
}

function appendRow_(sheet, row) {
  const headers = headers_(sheet, row);
  sheet.appendRow(toValues_(headers, row));
}

function upsertByName_(sheet, row, name) {
  const headers = headers_(sheet, row);
  const col = headers.indexOf('성함') + 1;
  const last = sheet.getLastRow();
  let target = -1;
  if (last > 1) {
    const names = sheet.getRange(2, col, last - 1, 1).getValues();
    for (let i = 0; i < names.length; i++) {
      if (String(names[i][0]).trim() === name) { target = i + 2; break; }
    }
  }
  const values = [toValues_(headers, row)];
  if (target > 0) sheet.getRange(target, 1, 1, headers.length).setValues(values);
  else sheet.appendRow(values[0]);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
