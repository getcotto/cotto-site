// Cotto OS — AR reconciliation engine (v2).
//
// Fuses Settle (invoices issued) + Mercury (actual bank deposits) into one AR truth, per the
// "paid" definition (paid = banked in Mercury OR flagged in Settle; Settle alone is NOT proof).
// Two passes so unreferenced lump payments don't masquerade as unpaid:
//   1. Per-invoice: paid if its number appears in a Mercury deposit, else if Settle flags paid.
//   2. Per-account: total banked (mapped via ar_aliases.json) vs total invoiced -> true open = the
//      shortfall. Catches payments that come in under cryptic names (TALAFOOD, MarginEdge, transfers).
// Deposits whose name maps to no account are flagged for Kendall to identify (never guessed).
//
// Writes Dropbox\Cotto\ar_status.json. Run: node reconcile_ar.js

const fs = require('fs');
const path = require('path');
const { SPINE } = require('./paths');
const rd = (f) => fs.readFileSync(path.join(SPINE, f), 'utf8').replace(/^﻿/, '');
function splitCsv(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { c += '"'; i++; } else q = !q; } else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; }
const csv = (s) => { const [h, ...rows] = s.trim().split(/\r?\n/); const cols = splitCsv(h); return rows.map(r => { const c = splitCsv(r); const o = {}; cols.forEach((k, i) => o[k] = c[i] ?? ''); return o; }); };
const TODAY = new Date().toISOString().slice(0, 10);
const invKey = (s) => { const m = String(s).match(/(\d{4})/); return m ? m[1] : null; };
const round = (n) => Math.round(n * 100) / 100;

const A = JSON.parse(rd('ar_aliases.json'));
const aliases = A.aliases, merge = A.account_merge || {}, nonAr = (A.non_ar || []).map(s => s.toLowerCase());
const mergeAcct = (a) => merge[a] || a;
const matchAcct = (blob) => { const b = blob.toLowerCase(); for (const a of aliases) if (b.includes(a.match)) return a.account; return null; };

// ---- Mercury: invoice-ref hits + banked-per-account + unmapped deposits ----
const mercury = csv(rd('mercury_transactions.csv'));
const bankedInv = new Map(), bankedByAcct = {}, unmapped = [];
for (const r of mercury) {
  const amt = parseFloat(r['Amount'] || 0);
  if (!(amt > 0)) continue;
  const blob = [r['Description'], r['Bank Description'], r['Reference'], r['Note']].join(' ');
  if (nonAr.some(n => blob.toLowerCase().includes(n))) continue;   // not a customer payment (prize, refund, founder transfer)
  for (const m of blob.matchAll(/\b(10\d\d)\b/g)) if (!bankedInv.has(m[1])) bankedInv.set(m[1], { date: r['Date (UTC)'], amount: amt });
  const acct = matchAcct(blob);
  if (acct) { const g = mergeAcct(acct); bankedByAcct[g] = round((bankedByAcct[g] || 0) + amt); }
  else unmapped.push({ date: r['Date (UTC)'], amount: amt, who: (r['Description'] || '').slice(0, 28), ref: (r['Reference'] || r['Note'] || '').slice(0, 40) });
}

// ---- Settle: invoices + per-invoice paid flag ----
const invoices = [];
for (const r of csv(rd('settle_invoices.csv'))) {
  const amt = parseFloat(r['Amount'] || 0);
  if (!(amt > 0)) continue;
  const num = invKey(r['Invoice #']);
  const merc = num && bankedInv.get(num);
  const settlePaid = (r['Pmnt to Vendor'] || '').trim();
  let status = 'open', paidVia = null, paidDate = null;
  if (merc) { status = 'paid'; paidVia = 'mercury'; paidDate = merc.date; }
  else if (settlePaid) { status = 'paid'; paidVia = 'settle'; paidDate = settlePaid; }
  invoices.push({ invoice: r['Invoice #'], account: r['Customer Name'] || '(blank)', amount: amt, date: r['Invoice Date'], status, paidVia, paidDate });
}

// ---- Per-account reconciliation: true open = max(0, invoiced - banked) ----
const byAccount = {};
for (const inv of invoices) {
  const acct = mergeAcct(inv.account);
  const s = byAccount[acct] || (byAccount[acct] = { invoiced: 0, refPaid: 0, banked: 0, candidates: [] });
  s.invoiced = round(s.invoiced + inv.amount);
  if (inv.status === 'paid') s.refPaid = round(s.refPaid + inv.amount);
  else s.candidates.push(`${inv.invoice} $${inv.amount.toFixed(2)} (${inv.date})`);
}
for (const [a, s] of Object.entries(byAccount)) {
  s.banked = bankedByAcct[a] || 0;
  // best estimate of true open: invoiced minus the larger of (ref-confirmed paid, total banked for the account)
  s.openTrue = round(Math.max(0, s.invoiced - Math.max(s.refPaid, s.banked)));
}

const totalOpenTrue = round(Object.values(byAccount).reduce((t, s) => t + s.openTrue, 0));
const totalInvoiced = round(invoices.reduce((t, i) => t + i.amount, 0));
fs.writeFileSync(path.join(SPINE, 'ar_status.json'), JSON.stringify({ asOf: TODAY, totalInvoiced, totalOpenTrue, unmapped, byAccount, invoices }, null, 2));

console.log(`\n=== COTTO OS — AR RECONCILIATION (${TODAY}) ===`);
console.log(`Invoiced all-time $${totalInvoiced.toFixed(2)}.  TRUE OPEN (invoiced minus banked/confirmed): $${totalOpenTrue.toFixed(2)}\n`);
for (const [a, s] of Object.entries(byAccount).filter(([, s]) => s.openTrue > 0.5).sort((x, y) => y[1].openTrue - x[1].openTrue)) {
  console.log(`  ${a.padEnd(34)} open $${s.openTrue.toFixed(2).padStart(9)}   (invoiced ${s.invoiced.toFixed(2)} | banked ${s.banked.toFixed(2)})`);
  if (s.candidates.length) console.log(`        likely: ${s.candidates.join('; ')}`);
}
if (unmapped.length) {
  const u = round(unmapped.reduce((t, x) => t + x.amount, 0));
  console.log(`\n⚠ ${unmapped.length} UNMAPPED deposits = $${u.toFixed(2)} (could be paying some of the "open" above — identify the payer to map them):`);
  for (const x of unmapped.sort((a, b) => b.amount - a.amount).slice(0, 12)) console.log(`     ${x.date}  $${x.amount.toFixed(2).padStart(9)}  ${x.who}  ${x.ref}`);
}
console.log(`\nWrote ar_status.json`);
