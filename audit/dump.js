// Dump full content of each sheet (formula + value) to per-tab files for analysis
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const file = 'C:\\Users\\kenda\\Downloads\\Cotto_SOP_v23_v18.xlsx';
const wb = XLSX.readFile(file, { cellFormula: true, cellNF: false, cellStyles: false, cellDates: true });

const outDir = path.join(__dirname, 'tabs');
fs.mkdirSync(outDir, { recursive: true });

function colLetter(n) {
  let s = '';
  n = n + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const ref = ws['!ref'] || 'A1';
  const range = XLSX.utils.decode_range(ref);
  const lines = [];
  lines.push(`# ${name}`);
  lines.push(`range: ${ref}`);
  lines.push('');
  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowParts = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = colLetter(c) + (r + 1);
      const cell = ws[addr];
      if (!cell) continue;
      let v = cell.v;
      if (v instanceof Date) v = v.toISOString().slice(0, 10);
      if (typeof v === 'string') v = v.replace(/\r?\n/g, ' ').slice(0, 80);
      const f = cell.f ? `=${cell.f}` : '';
      const display = f || (v === undefined ? '' : String(v).slice(0, 80));
      if (display === '') continue;
      rowParts.push(`${addr}: ${display}`);
    }
    if (rowParts.length) {
      lines.push(`R${String(r + 1).padStart(3, '0')}  ` + rowParts.join('  |  '));
    }
  }
  const safe = name.replace(/[^A-Za-z0-9]+/g, '_');
  fs.writeFileSync(path.join(outDir, safe + '.txt'), lines.join('\n'));
  console.log(`wrote ${safe}.txt (${lines.length} lines)`);
}
