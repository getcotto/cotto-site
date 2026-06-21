// Freight guard — the missing trigger that caused the 6/19 scramble. (Cloud-ready copy:
// reads the spine via paths.js so it works in a cloud routine (../spine) or locally
// against Dropbox via COTTO_SPINE.)
//
// production_plan.json knows every run's Pueblo->Edison SHIP (pickup) date, but nothing
// turned those into a "book the carrier by X" reminder. Pueblo is remote — carriers need
// multi-day advance notice — so finding out on pickup day = a scramble or a missed pickup.
// This computes a book-by date for every upcoming pickup and writes freight_schedule.json
// for the active session / watchdog to turn into calendar reminders. It books nothing.
//
// Lead rule: book_by = pickup - LEAD_DAYS, rolled back to a weekday (no weekend bookings).
// LEAD_DAYS = 4 -> a Friday pickup books the Monday before.
//
// Usage: node freight_guard.js [todayISO]

const fs = require('fs');
const path = require('path');
const { SPINE } = require('./paths');
const plan = JSON.parse(fs.readFileSync(path.join(SPINE, 'production_plan.json'), 'utf8'));

const TODAY = process.argv[2] || new Date().toISOString().slice(0, 10);
const LEAD_DAYS = 4;
const YEAR = 2026;

const d = (iso) => new Date(iso + 'T00:00:00Z');
const iso = (dt) => dt.toISOString().slice(0, 10);
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseShip(s) {
  const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  return `${YEAR}-${String(+m[1]).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`;
}
function bookBy(pickupISO) {
  let dt = d(pickupISO); dt.setUTCDate(dt.getUTCDate() - LEAD_DAYS);
  while (dt.getUTCDay() === 0 || dt.getUTCDay() === 6) dt.setUTCDate(dt.getUTCDate() - 1);
  return iso(dt);
}

const byPickup = new Map();
for (const r of plan.runs || []) {
  const pickup = parseShip(r.ship);
  if (!pickup || pickup < TODAY) continue;
  const e = byPickup.get(pickup) || { pickup, runs: [], buf: 0, fo: 0, gr: 0 };
  e.runs.push(r.id); e.buf += r.buf || 0; e.fo += r.fo || 0; e.gr += r.gr || 0;
  byPickup.set(pickup, e);
}

const schedule = [...byPickup.values()].sort((a, b) => a.pickup.localeCompare(b.pickup)).map((e) => ({
  ...e,
  pickup_dow: DOW[d(e.pickup).getUTCDay()],
  book_by: bookBy(e.pickup),
  book_by_dow: DOW[d(bookBy(e.pickup)).getUTCDay()],
  overdue: bookBy(e.pickup) < TODAY,
}));

fs.writeFileSync(path.join(SPINE, 'freight_schedule.json'), JSON.stringify(schedule, null, 2));

console.log(`FREIGHT GUARD — upcoming Pueblo->Edison pickups (as of ${TODAY}, ${LEAD_DAYS}-day lead)\n`);
for (const s of schedule) {
  const tag = s.overdue ? '  ⚠ BOOK-BY ALREADY PASSED' : (s.book_by <= TODAY ? '  🔴 BOOK NOW' : '');
  console.log(`  pickup ${s.pickup} (${s.pickup_dow})  batches BUF ${s.buf}/FO ${s.fo}/GR ${s.gr}  runs ${s.runs.join('+')}`);
  console.log(`     -> BOOK FREIGHT BY ${s.book_by} (${s.book_by_dow})${tag}\n`);
}
console.log('Wrote freight_schedule.json to ' + SPINE);
