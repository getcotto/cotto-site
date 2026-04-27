// Verify Cotto_SOP_v24_Full.xlsx
const ExcelJS = require('exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\kenda\\Downloads\\Cotto_SOP_v24_Full.xlsx');

  console.log('Sheet order:', wb.worksheets.map(w => w.name).join(' | '));
  console.log('Total defined names:', wb.definedNames.model.length);

  // Spot-check: Supply Plan run 5 (Blk1A) should have plan formulas
  const sp = wb.getWorksheet('Supply Plan');
  console.log('\n--- Supply Plan Run 5 (Blk1A) ---');
  for (let c = 1; c <= 26; c++) {
    const cell = sp.getRow(10).getCell(c);
    const v = cell.formula ? '=' + cell.formula.slice(0, 80) : (cell.value === null || cell.value === undefined ? '' : String(cell.value).slice(0, 30));
    if (v) console.log(`  ${String.fromCharCode(64 + c)}10: ${v}`);
  }

  // Spot-check: Orders sample
  const ord = wb.getWorksheet('Orders');
  console.log('\n--- Orders R6-R8 ---');
  for (let r = 6; r <= 8; r++) {
    const parts = [];
    for (let c = 1; c <= 14; c++) {
      const cell = ord.getRow(r).getCell(c);
      const v = cell.formula ? '=' + cell.formula.slice(0, 30) : (cell.value === null ? '' : String(cell.value).slice(0, 25));
      parts.push(v);
    }
    console.log(`  R${r}: ${parts.join(' | ')}`);
  }

  // Cash Flow row 8 (FK invoice)
  const cf = wb.getWorksheet('Cash Flow');
  console.log('\n--- Cash Flow R8 sample ---');
  for (let c = 1; c <= 5; c++) {
    const cell = cf.getRow(8).getCell(c);
    const v = cell.formula ? '=' + cell.formula.slice(0, 80) : (cell.value === null ? '' : String(cell.value).slice(0, 30));
    console.log(`  ${String.fromCharCode(64 + c)}8: ${v}`);
  }

  // Dashboard
  const dash = wb.getWorksheet('Dashboard');
  console.log('\n--- Dashboard rows 5-8 ---');
  for (let r = 5; r <= 8; r++) {
    const parts = [];
    for (let c = 1; c <= 5; c++) {
      const cell = dash.getRow(r).getCell(c);
      const v = cell.formula ? '=' + cell.formula.slice(0, 50) : (cell.value === null ? '' : String(cell.value).slice(0, 30));
      parts.push(v);
    }
    console.log(`  R${r}: ${parts.join(' | ')}`);
  }

  // Inventory supply formula check
  const inv = wb.getWorksheet('Inventory');
  console.log('\n--- Inventory projection — BUF supply line (row 307) ---');
  const supplyRow = 307; // Starting row for BUF block + 1 (Supply line)
  for (let c = 4; c <= 6; c++) {
    const cell = inv.getRow(supplyRow).getCell(c);
    const v = cell.formula ? '=' + cell.formula.slice(0, 100) : (cell.value === null ? '' : String(cell.value).slice(0, 30));
    console.log(`  ${String.fromCharCode(64 + c)}${supplyRow}: ${v}`);
  }

  console.log('\n✓ Verification complete');
})().catch(err => { console.error(err); process.exit(1); });
