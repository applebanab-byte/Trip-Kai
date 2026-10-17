/**
 * Trip Planner API — วางโค้ดนี้ใน Google Sheet > ส่วนขยาย > Apps Script
 * แล้ว Deploy เป็น Web App (Execute as: Me, Who has access: Anyone)
 * แท็บ Places / Votes / Expenses / Members จะถูกสร้างให้อัตโนมัติ
 */

// ใส่รหัสผ่านกลุ่มถ้าต้องการ (เว้นว่าง = ไม่ใช้) และต้องใส่ค่าเดียวกันในหน้าเว็บ
const PASSCODE = '';

const SHEETS = {
  Places:   ['id', 'name', 'link', 'note', 'budget', 'proposer', 'createdAt'],
  Votes:    ['placeId', 'voter', 'score', 'updatedAt'],
  Expenses: ['id', 'desc', 'amount', 'payer', 'participants', 'category', 'createdAt'],
  Members:  ['name']
};

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const headers = values.shift();
  return values
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      const o = {};
      headers.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
}

function deleteWhere_(name, colIndex, value) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][colIndex]) === String(value)) sh.deleteRow(i + 1);
  }
}

function clean_(s, max) {
  return String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim().slice(0, max || 500);
}

function getAll_() {
  return {
    ok: true,
    places: rows_('Places'),
    votes: rows_('Votes'),
    expenses: rows_('Expenses'),
    members: rows_('Members').map(function (m) { return m.name; })
  };
}

function handle_(req) {
  if (PASSCODE && req.passcode !== PASSCODE) return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' };
  const now = new Date().toISOString();

  switch (req.action) {
    case 'getAll':
      return getAll_();

    case 'addMember': {
      const name = clean_(req.name, 40).replace(/,/g, '');
      if (!name) return { ok: false, error: 'ต้องระบุชื่อ' };
      const exists = rows_('Members').some(function (m) { return m.name === name; });
      if (!exists) sheet_('Members').appendRow([name]);
      return getAll_();
    }

    case 'addPlace': {
      const name = clean_(req.name, 120);
      if (!name) return { ok: false, error: 'ต้องระบุชื่อสถานที่' };
      sheet_('Places').appendRow([
        Utilities.getUuid(), name, clean_(req.link, 500), clean_(req.note, 500),
        Number(req.budget) || 0, clean_(req.proposer, 40), now
      ]);
      return getAll_();
    }

    case 'deletePlace':
      deleteWhere_('Places', 0, req.id);
      deleteWhere_('Votes', 0, req.id);
      return getAll_();

    case 'vote': {
      const score = Math.max(0, Math.min(5, Number(req.score) || 0));
      const voter = clean_(req.voter, 40);
      if (!voter) return { ok: false, error: 'ต้องระบุชื่อผู้โหวต' };
      const sh = sheet_('Votes');
      const values = sh.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(req.placeId) && values[i][1] === voter) {
          if (score === 0) sh.deleteRow(i + 1);
          else sh.getRange(i + 1, 3, 1, 2).setValues([[score, now]]);
          found = true;
          break;
        }
      }
      if (!found && score > 0) sh.appendRow([req.placeId, voter, score, now]);
      return getAll_();
    }

    case 'addExpense': {
      const amount = Number(req.amount);
      if (!(amount > 0)) return { ok: false, error: 'จำนวนเงินไม่ถูกต้อง' };
      const parts = (req.participants || []).map(function (p) { return clean_(p, 40); }).filter(String);
      if (!parts.length) return { ok: false, error: 'ต้องเลือกคนหารอย่างน้อย 1 คน' };
      sheet_('Expenses').appendRow([
        Utilities.getUuid(), clean_(req.desc, 200), amount, clean_(req.payer, 40),
        parts.join(','), clean_(req.category, 40), now
      ]);
      return getAll_();
    }

    case 'deleteExpense':
      deleteWhere_('Expenses', 0, req.id);
      return getAll_();

    default:
      return { ok: false, error: 'unknown action' };
  }
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const req = JSON.parse(e.postData.contents);
    return respond_(handle_(req));
  } catch (err) {
    return respond_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// เปิด URL ของ Web App ในเบราว์เซอร์เพื่อทดสอบว่าทำงาน
function doGet() {
  return respond_(PASSCODE ? { ok: true, message: 'Trip Planner API' } : getAll_());
}
