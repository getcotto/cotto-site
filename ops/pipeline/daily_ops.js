// Cotto OS — daily pass. Runs the reconciliations + the audit in sequence so the spine's flags
// are current, then leaves ar_status.json + audit_report.json for the caller to surface.
// The CLOUD ROUTINE invokes `node pipeline/daily_ops.js`, then emails the audit digest + ensures
// freight calendar reminders. Locally it's "refresh everything" in one command.
//
// AR reconcile runs only when the raw exports are present. Those CSVs are bank/AR data and are
// GITIGNORED (never pushed to the cloud); the cloud reads the committed ar_status.json summary
// produced by the last local reconcile.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { SPINE } = require('./paths');
const D = __dirname;
const tail = (s, n) => s.trim().split('\n').slice(-n).join('\n');
const run = (label, cmd) => {
  try { console.log('\n### ' + label); console.log(tail(execSync(cmd, { cwd: D, encoding: 'utf8' }), 6)); }
  catch (e) { console.error('### ' + label + ' FAILED: ' + tail(String(e.stdout || e.message), 4)); }
};

const haveAR = fs.existsSync(path.join(SPINE, 'mercury_transactions.csv')) && fs.existsSync(path.join(SPINE, 'settle_invoices.csv'));
if (haveAR) run('AR reconcile (Settle + Mercury)', 'node reconcile_ar.js');
else console.log('\n### AR reconcile SKIPPED — no mercury_transactions.csv / settle_invoices.csv in this environment (cloud reads the last committed ar_status.json).');
run('Freight guard', 'node freight_guard.js');
run('Audit backbone', 'node audit.js');
console.log('\n=== DAILY PASS COMPLETE — surface audit_report.json (flags) + ar_status.json (AR) ===');
