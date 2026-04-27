// Verify the new file: open it, sanity-check structure, formulas, and named ranges
const ExcelJS = require('exceljs');
const path = require('path');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\kenda\\Downloads\\Cotto_SOP_v24_Session1.xlsx');

  console.log('Sheets:', wb.worksheets.map(w => w.name).join(' | '));
  console.log('\nDefined Names:');
  wb.definedNames.model.forEach(n => {
    console.log(`  ${n.name} -> ${n.ranges.join(', ')}`);
  });

  console.log('\n--- INPUTS sample formulas ---');
  const inp = wb.getWorksheet('Inputs');
  ['B5','B6','B27','B37','B57','B61','B62','C62','D62','E62'].forEach(addr => {
    const c = inp.getCell(addr);
    console.log(`  ${addr}: ${c.formula ? '=' + c.formula : c.value}`);
  });

  console.log('\n--- ACCOUNTS table ---');
  const acc = wb.getWorksheet('Accounts');
  console.log('  Tables:', Object.keys(acc.tables || {}));
  console.log('  Row 5 (first account):');
  for (let c = 1; c <= 14; c++) {
    const cell = acc.getRow(5).getCell(c);
    process.stdout.write(`${cell.value}|`);
  }
  console.log('');
  console.log('  Row 25 (Misfits expected):');
  for (let c = 1; c <= 14; c++) {
    const cell = acc.getRow(25).getCell(c);
    process.stdout.write(`${cell.value}|`);
  }
  console.log('');
  console.log('  Row 30 (placeholder expected):');
  for (let c = 1; c <= 14; c++) {
    const cell = acc.getRow(30).getCell(c);
    process.stdout.write(`${cell.value}|`);
  }
  console.log('');
  console.log('  Row 56 (footer counts):');
  for (let c = 1; c <= 10; c++) {
    const cell = acc.getRow(56).getCell(c);
    process.stdout.write(`${cell.value === undefined ? '' : (cell.formula ? '=' + cell.formula : cell.value)}|`);
  }
  console.log('');

  console.log('\n--- DEMAND PLAN summary block ---');
  const dem = wb.getWorksheet('Demand Plan');
  for (let r = 4; r <= 14; r++) {
    process.stdout.write(`R${r}: `);
    for (let c = 1; c <= 6; c++) {
      const cell = dem.getRow(r).getCell(c);
      const v = cell.formula ? '=' + cell.formula.slice(0, 40) : (cell.value === null ? '' : String(cell.value).slice(0, 30));
      process.stdout.write(v + ' | ');
    }
    console.log('');
  }
  console.log('  Detail row 27 (first account, BUF):');
  for (let c = 1; c <= 6; c++) {
    const cell = dem.getRow(27).getCell(c);
    const v = cell.formula ? '=' + cell.formula.slice(0, 60) : (cell.value === null ? '' : String(cell.value).slice(0, 40));
    process.stdout.write(v + ' | ');
  }
  console.log('');

  console.log('\n--- INVENTORY ---');
  const inv = wb.getWorksheet('Inventory');
  for (let r = 4; r <= 12; r++) {
    process.stdout.write(`R${r}: `);
    for (let c = 1; c <= 5; c++) {
      const cell = inv.getRow(r).getCell(c);
      const v = cell.formula ? '=' + cell.formula.slice(0, 60) : (cell.value === null ? '' : String(cell.value).slice(0, 40));
      process.stdout.write(v + ' | ');
    }
    console.log('');
  }
  console.log('  Movement log first row (R31):');
  for (let c = 1; c <= 10; c++) {
    const cell = inv.getRow(31).getCell(c);
    const v = cell.value === null ? '' : String(cell.value).slice(0, 30);
    process.stdout.write(v + ' | ');
  }
  console.log('');

  console.log('\n--- Done ---');
})().catch(err => { console.error(err); process.exit(1); });
