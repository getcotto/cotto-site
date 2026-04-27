// Extract orders from v23 file as JSON for migration into v24
const ExcelJS = require('exceljs');
const fs = require('fs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\kenda\\Downloads\\Cotto_SOP_v23_v18.xlsx');
  const orders = wb.getWorksheet('Orders');
  const rows = [];
  // Headers in row 3, data rows 4-123
  for (let r = 4; r <= 123; r++) {
    const row = orders.getRow(r);
    const date    = row.getCell(1).value;
    const invoice = row.getCell(2).value;
    const account = row.getCell(3).value;
    const channel = row.getCell(4).value;
    const sku     = row.getCell(5).value;
    const flavor  = row.getCell(6).value;
    const lot     = row.getCell(7).value;
    const cases   = row.getCell(8).value;
    const units   = row.getCell(9).value;
    const price   = row.getCell(10).value;
    const total   = row.getCell(11).value;
    const status  = row.getCell(12).value;
    const due     = row.getCell(13).value;
    const notes   = row.getCell(14).value;

    if (!date && !account) continue; // skip blank rows
    rows.push({
      date: date instanceof Date ? date.toISOString().slice(0,10) : (date ? String(date) : ''),
      invoice: invoice || '',
      account: account || '',
      channel: channel || '',
      sku: sku || '',
      flavor: flavor || '',
      lot: lot || '',
      cases: typeof cases === 'number' ? cases : (cases ? Number(cases) || 0 : 0),
      units: typeof units === 'number' ? units : (units ? Number(units) || 0 : 0),
      price: typeof price === 'number' ? price : (price ? Number(price) || 0 : 0),
      total: typeof total === 'object' && total !== null && 'result' in total ? total.result : (typeof total === 'number' ? total : (total ? Number(total) || 0 : 0)),
      status: status || '',
      due: due instanceof Date ? due.toISOString().slice(0,10) : (due ? String(due) : ''),
      notes: notes || '',
    });
  }
  fs.writeFileSync('C:\\Users\\kenda\\.claude\\worktrees\\exciting-brattain-79bf49\\audit\\orders.json', JSON.stringify(rows, null, 2));
  console.log(`Extracted ${rows.length} orders`);
})().catch(err => { console.error(err); process.exit(1); });
