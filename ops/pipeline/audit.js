// Cotto OS — Audit Backbone v1.
//
// The reconciliation engine: ingests the spine + the Settle AR export and cross-checks
// every link in the value chain, then emits a single ranked drift report. This is the
// "things finally talk to each other" layer — it NOTICES drift so Kendall doesn't have to.
//
// Checks (each is one link in the chain):
//   1. AR        — outstanding + overdue invoices (Settle export)
//   2. Billing   — delivered but NOT invoiced (order book vs Settle)  [revenue leak]
//   3. Receipts  — produced but NOT confirmed-landed (no BOL / estimate)
//   4. Inventory — weeks of supply vs weekly demand (OOS risk)
//   5. Packaging — on-hand+on-order vs upcoming runs' consumption (run-short risk)
//   6. Freight   — upcoming Pueblo book-by dates (must be booked ahead)
//   7. Freshness — is the spine itself stale?
//
// Output: console report (ranked 🔴/🟡/✅) + spine/audit_report.json for the brief/dash.
// Reads only; writes nothing but the report. Run: node audit.js

const fs = require('fs');
const path = require('path');
const { SPINE } = require('./paths');
const rd = (f, fb) => { try { return JSON.parse(fs.readFileSync(path.join(SPINE, f), 'utf8').replace(/^﻿/, '')); } catch (e) { return fb; } };
const mtimeDays = (f) => { try { return (Date.now() - fs.statSync(path.join(SPINE, f)).mtimeMs) / 86400000; } catch { return null; } };

const TODAY = process.argv[2] || new Date().toISOString().slice(0, 10);
const UNITS_PER_CASE = 6;
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const orders = rd('orders.json', []);
const events = rd('events.json', []);
const movements = rd('movements.json', []);
const plan = rd('production_plan.json', {});
const packaging = rd('packaging.json', { components: [] });
const accounts = rd('accounts.json', []);

const findings = [];
const add = (sev, area, title, detail, impact) => findings.push({ sev, area, title, detail, impact: impact || null });

// ---------- 1. AR: from the RECONCILED ledger (Settle + Mercury), not Settle alone ----------
try {
  const ar = JSON.parse(fs.readFileSync(path.join(SPINE, 'ar_status.json'), 'utf8'));   // produced by reconcile_ar.js
  const termsOf = (cust) => {
    const a = accounts.find(x => [x.name, ...(x.aliases || [])].some(n => norm(n) === norm(cust) || norm(cust).includes(norm(n))));
    if (a && /consign/i.test(a.payment_terms || a.channel || '')) return null;
    const m = (a && a.payment_terms || '').match(/(\d+)/); return m ? +m[1] : 30;
  };
  // Actionable overdue = accounts that are net-open AND hold an open invoice past terms (recent ones are just awaiting payment).
  let overdue = 0; const list = [];
  for (const [acct, s] of Object.entries(ar.byAccount)) {
    if (s.openTrue <= 0.5) continue;
    const terms = termsOf(acct);
    const pastTerms = (s.candidates || []).some(c => { const m = c.match(/\((\d{4}-\d\d-\d\d)\)/); if (!m || terms == null) return false; const d = new Date(m[1] + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + terms); return d.toISOString().slice(0, 10) < TODAY; });
    if (pastTerms) { overdue += s.openTrue; list.push(`${acct} $${s.openTrue.toFixed(2)}`); }
  }
  if (overdue > 0) add('🔴', 'AR', `Overdue AR (reconciled, past terms): $${overdue.toFixed(2)}`, list.join('; ') + '. Confirmed open in BOTH Settle and Mercury — safe to follow up.', overdue);
  add('🟡', 'AR', `Total open AR (Settle+Mercury reconciled): $${ar.totalOpenTrue.toFixed(2)}`, 'Most is recent within-terms invoices. From ar_status.json — rerun reconcile_ar.js after each Mercury + Settle export.', ar.totalOpenTrue);
} catch (e) { add('🟡', 'AR', 'AR check skipped', 'ar_status.json missing — run: node reconcile_ar.js (needs current mercury_transactions.csv + settle_invoices.csv).'); }

// ---------- 2. Billing backlog: delivered but not invoiced ----------
try {
  const backlog = orders.filter(o => /^delivered$/i.test(o.status || '') && !o.invoice && !/consign/i.test(o.channel || ''));
  const total = backlog.reduce((s, o) => s + (o.total || 0), 0);
  if (backlog.length) {
    const byAcct = {};
    for (const o of backlog) byAcct[o.account] = (byAcct[o.account] || 0) + (o.total || 0);
    const lines = Object.entries(byAcct).map(([a, v]) => `${a} $${v.toFixed(2)}`);
    add('🔴', 'Billing', `Delivered but NOT invoiced: $${total.toFixed(2)} (${backlog.length} lines)`, lines.join('; ') + ' — create these invoices in Settle.', total);
  } else add('✅', 'Billing', 'Every delivered order is invoiced', '');
} catch (e) { add('🟡', 'Billing', 'Billing check error', e.message); }

// ---------- 3. Receipts: produced but not confirmed-landed ----------
try {
  const unconfirmed = events.filter(e => /receipt|shipment/i.test(e.type || '') && /no bol|reconcile|est\b|estimate/i.test(e.notes || ''));
  for (const e of unconfirmed) add('🟡', 'Receipts', `Unconfirmed receipt ${e.date}: ${e.account}`, `${e.buf || 0} BUF / ${e.fo || 0} FO / ${e.gr || 0} GR logged as estimate — reconcile when the BOL/receipt lands.`);
  if (!unconfirmed.length) add('✅', 'Receipts', 'All receipts confirmed', '');
} catch (e) { add('🟡', 'Receipts', 'Receipts check error', e.message); }

// ---------- 4. Inventory coverage / OOS risk ----------
try {
  const net = { buf: 0, fo: 0, gr: 0 };
  for (const m of movements) { const s = m.dir === 'In' ? 1 : -1; for (const k of ['buf', 'fo', 'gr']) net[k] += s * (Number(m[k]) || 0); }
  const demand = { buf: 0, fo: 0, gr: 0 };
  for (const a of accounts) { if (!/active/i.test(a.status || '')) continue; const w = a.weekly_cases || {}; for (const k of ['buf', 'fo', 'gr']) demand[k] += Number(w[k]) || 0; }
  const safety = (plan.safetyStockWeeks || 2);
  for (const k of ['buf', 'fo', 'gr']) {
    const wk = demand[k] > 0 ? net[k] / demand[k] : 99;
    if (wk < safety) add(wk < 1 ? '🔴' : '🟡', 'Inventory', `${k.toUpperCase()} ~${wk.toFixed(1)} wks of supply`, `On-hand ${net[k]} cs vs ${demand[k]} cs/wk demand (safety = ${safety} wks).`);
  }
  add('✅', 'Inventory', `On-hand: BUF ${net.buf} / FO ${net.fo} / GR ${net.gr} cs`, '');
} catch (e) { add('🟡', 'Inventory', 'Inventory check error', e.message); }

// ---------- 5. Packaging coverage vs upcoming runs ----------
try {
  const y = plan.yields || { buf: 74, fo: 62, gr: 66 };
  // Deduct EVERY run produced since the packaging count date — including runs already done
  // since then (6/10, 6/15-17) that the stale count doesn't reflect. (Bug caught 6/20: was
  // only counting UPCOMING runs and ignoring consumption since the count, overstating coverage.)
  const ASOF = packaging.asOf || '2026-06-01';
  const need = { buf: 0, fo: 0, gr: 0 };
  for (const r of plan.runs || []) {
    const prod = String(r.produce || '').match(/(\d{1,2})\/(\d{1,2})/);
    if (!prod) continue;
    const pd = `2026-${String(+prod[1]).padStart(2, '0')}-${String(+prod[2]).padStart(2, '0')}`;
    if (pd <= ASOF) continue;                        // count already includes runs on/before asOf
    for (const k of ['buf', 'fo', 'gr']) need[k] += (Number(r[k]) || 0) * y[k] * UNITS_PER_CASE;
  }
  const totalUnits = need.buf + need.fo + need.gr, totalCases = totalUnits / UNITS_PER_CASE;
  for (const comp of packaging.components || []) {
    const avail = (comp.onHand || 0) + (comp.onOrder || 0);
    let req;
    if (comp.key === 'box_6pk') req = totalCases;
    else if (comp.shared) req = totalUnits;          // tubs, lids
    else req = need[(comp.sku || '').toLowerCase()] || 0;
    const gap = avail - req;
    if (gap < 0) add(avail < req * 0.5 ? '🔴' : '🟡', 'Packaging', `REORDER ${comp.label}: need ${Math.round(req)} for all runs since ${ASOF}, have ${avail} (short ${Math.round(-gap)})`, `Supplier ${comp.supplier}. Need = every run after the ${ASOF} count incl. the 6/10 + 6/15-17 already produced. ⚠ count is stale — confirm with a fresh FK count.`);
  }
} catch (e) { add('🟡', 'Packaging', 'Packaging check error', e.message); }

// ---------- 6. Freight: upcoming book-by ----------
try {
  const fs2 = rd('freight_schedule.json', []);
  for (const s of fs2) {
    const days = (new Date(s.book_by + 'T00:00:00Z') - new Date(TODAY + 'T00:00:00Z')) / 86400000;
    if (days < 0) continue;
    if (days <= 5) add(days <= 2 ? '🔴' : '🟡', 'Freight', `Book Pueblo freight by ${s.book_by} (${s.book_by_dow}) — ships ${s.pickup}`, `Runs ${(s.runs || []).join('+')}. Carriers: Jeremy/FFE, GianMarco@RLS, Heather@DTS.`);
  }
} catch (e) { add('🟡', 'Freight', 'Freight check error', e.message); }

// ---------- 7. Freshness ----------
// Data-based (cloud-safe): the latest delivery/order DATE in the spine, not a file mtime
// (mtimes are meaningless in a fresh git clone).
const latestEvent = events.map(e => e.date).filter(Boolean).sort().slice(-1)[0];
const latestOrder = orders.map(o => o.date).filter(Boolean).sort().slice(-1)[0];
const ageOf = (d) => d ? Math.round((new Date(TODAY) - new Date(d)) / 86400000) : 999;
const evAge = ageOf(latestEvent), ordAge = ageOf(latestOrder);
if (evAge > 4 || ordAge > 4) add('🟡', 'Freshness', `Spine may be stale (latest delivery ${latestEvent} = ${evAge}d ago, latest order ${latestOrder} = ${ordAge}d ago)`, 'Recent orders/deliveries may be uncaptured — ask Claude to reconcile in a session.');
else add('✅', 'Freshness', `Spine fresh (latest event ${latestEvent}, latest order ${latestOrder})`, '');

// ---------- emit ----------
const order = { '🔴': 0, '🟡': 1, '✅': 2 };
findings.sort((a, b) => order[a.sev] - order[b.sev]);
fs.writeFileSync(path.join(SPINE, 'audit_report.json'), JSON.stringify({ asOf: TODAY, findings }, null, 2));

console.log(`\n=== COTTO OS — AUDIT BACKBONE (${TODAY}) ===\n`);
let red = 0, yellow = 0;
for (const f of findings) {
  if (f.sev === '🔴') red++; if (f.sev === '🟡') yellow++;
  console.log(`${f.sev} [${f.area}] ${f.title}`);
  if (f.detail) console.log(`      ${f.detail}`);
}
console.log(`\n${red} 🔴 act-now · ${yellow} 🟡 watch · wrote audit_report.json`);
