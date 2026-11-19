/**
 * CrisisMMD++ survey backend (Google Apps Script, bound to a Google Sheet).
 *
 * What it does
 *  - Hands each rater the next tweet-image pair that has the FEWEST responses
 *    so far and that this rater has not labeled yet. Items being worked on by
 *    someone else are held for 15 minutes so two people don't get the same one.
 *  - Saves every answer as one row in the "Responses" sheet.
 *  - Reports overall progress (items with at least one response, out of 900).
 *
 * Setup: see SETUP.txt (Extensions > Apps Script, paste this file, Deploy as web app).
 */
const TOTAL = 900;
const SHEET = 'Responses';
const HOLD_SECONDS = 900;
const HEADERS = ['timestamp', 'rater', 'item_id', 'image_choice', 'image_label',
  'text_choice', 'text_label', 'severity_choice', 'severity_label',
  'relationship', 'seconds_spent', 'action'];

function doGet(e) {
  const p = e.parameter || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = getSheet_();
    // Names: letters, numbers, _ and - only (blocks formulas and odd values)
    const rater = String(p.rater || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
    if (!rater) return json_({ ok: false, error: 'invalid name' });

    if (p.action === 'submit' && p.data) {
      if (!underLimit_(rater)) return json_({ ok: false, error: 'too many answers, please slow down' });
      const d = JSON.parse(p.data);
      // Accept only real item IDs and real answer values
      if (!/^S\d{3}$/.test(d.item_id) || +d.item_id.slice(1) < 1 || +d.item_id.slice(1) > TOTAL)
        return json_({ ok: false, error: 'invalid item' });
      if (![d.image_choice, d.text_choice, d.severity_choice].every(c => CHOICES.indexOf(c) >= 0) ||
          REL.indexOf(d.relationship) < 0 || ACTIONS.indexOf(d.action) < 0)
        return json_({ ok: false, error: 'invalid answer' });
      const secs = Math.max(0, Math.min(3600, Math.round(Number(d.seconds_spent) || 0)));
      sh.appendRow([new Date(), rater, d.item_id, d.image_choice, text_(d.image_label),
        d.text_choice, text_(d.text_label), d.severity_choice, text_(d.severity_label),
        d.relationship, secs, d.action]);
      CacheService.getScriptCache().remove('hold_' + d.item_id);
    }

    const stats = stats_(sh, rater);
    let next = null;
    if (p.want_next === '1') next = pickNext_(stats, rater);
    return json_({ ok: true, next: next, done: stats.done, total: TOTAL,
      mine: stats.mine.size });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function stats_(sh, rater) {
  const counts = {}; const mine = new Set();
  const n = sh.getLastRow() - 1;
  if (n > 0) {
    const vals = sh.getRange(2, 2, n, 2).getValues(); // rater, item_id
    vals.forEach(([r, id]) => {
      counts[id] = (counts[id] || 0) + 1;
      if (String(r) === rater) mine.add(id);
    });
  }
  return { counts: counts, mine: mine, done: Object.keys(counts).length };
}

function pickNext_(stats, rater) {
  const cache = CacheService.getScriptCache();
  const ids = []; for (let i = 1; i <= TOTAL; i++) ids.push('S' + String(i).padStart(3, '0'));
  const holds = cache.getAll(ids.map(id => 'hold_' + id));
  let best = Infinity, pool = [];
  ids.forEach(id => {
    if (stats.mine.has(id)) return;
    const h = holds['hold_' + id];
    if (h && h !== rater) return;
    const c = stats.counts[id] || 0;
    if (c < best) { best = c; pool = [id]; } else if (c === best) pool.push(id);
  });
  if (!pool.length) return null;
  const id = pool[Math.floor(Math.random() * pool.length)];
  cache.put('hold_' + id, rater, HOLD_SECONDS);
  return id;
}

const CHOICES = ['A', 'B', 'BOTH_BAD'];
const REL = ['Entails', 'Independent', 'Contradicts', 'Uncertain'];
const ACTIONS = ['next', 'end'];
const MAX_PER_MINUTE = 10;      // per name
const MAX_ALL_PER_MINUTE = 150; // everyone together

// Plain text only: cut length and stop Sheets from reading it as a formula
function text_(v) {
  let s = String(v == null ? '' : v).slice(0, 80);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// Simple per-minute caps so nobody can flood the sheet
function underLimit_(rater) {
  const cache = CacheService.getScriptCache();
  const minute = Math.floor(Date.now() / 60000);
  const k1 = 'rate_' + rater + '_' + minute, k2 = 'rate_all_' + minute;
  const n1 = Number(cache.get(k1) || 0), n2 = Number(cache.get(k2) || 0);
  if (n1 >= MAX_PER_MINUTE || n2 >= MAX_ALL_PER_MINUTE) return false;
  cache.put(k1, String(n1 + 1), 120);
  cache.put(k2, String(n2 + 1), 120);
  return true;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
