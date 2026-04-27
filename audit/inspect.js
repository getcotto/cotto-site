// Inspect the Cotto S&OP model: sheets, dimensions, formula counts, sample cells
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const file = 'C:\\Users\\kenda\\Downloads\\Cotto_SOP_v23_v18.xlsx';
const wb = XLSX.readFile(file, { cellFormula: true, cellNF: true, cellStyles: false });

const out = [];
out.push(`# File: ${path.basename(file)}`);
out.push(`Sheets: ${wb.SheetNames.length}`);
out.push(`Names: ${wb.SheetNames.join(' | ')}`);
out.push('');

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const ref = ws['!ref'] || 'A1';
  const range = XLSX.utils.decode_range(ref);
  const rows = range.e.r - range.s.r + 1;
  const cols = range.e.c - range.s.c + 1;
  let nonEmpty = 0, formulas = 0, hardNumbers = 0;
  const formulaSamples = [];
  const issuesFromValues = [];
  for (const k of Object.keys(ws)) {
    if (k.startsWith('!')) continue;
    const c = ws[k];
    if (c.v !== undefined && c.v !== null && c.v !== '') nonEmpty++;
    if (c.f) {
      formulas++;
      if (formulaSamples.length < 12) formulaSamples.push(`${k}: =${c.f}`);
    } else if (typeof c.v === 'number') {
      hardNumbers++;
    }
  }
  out.push(`## ${name}`);
  out.push(`  range: ${ref}  (${rows} rows × ${cols} cols)`);
  out.push(`  cells: ${nonEmpty} non-empty, ${formulas} formulas, ${hardNumbers} hardcoded numbers`);
  if (formulaSamples.length) {
    out.push(`  sample formulas:`);
    for (const f of formulaSamples) out.push(`    ${f}`);
  }
  out.push('');
}

fs.writeFileSync(path.join(__dirname, 'overview.md'), out.join('\n'));
console.log(out.join('\n'));
