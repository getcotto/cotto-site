// Build Cotto_SOP_v24.xlsx — Session 1 (structural skeleton)
// Tabs: Inputs, Accounts, Demand Plan, Inventory
// Design: named ranges, Excel Tables, no row-position-dependent cross-sheet refs
//         summary at top of Demand Plan, 5 inventory locations, defaulted placeholders

const ExcelJS = require('exceljs');
const path = require('path');

const wb = new ExcelJS.Workbook();
wb.creator = 'Cotto S&OP Rebuild — Session 1';
wb.created = new Date();

// ---- Styles ----
const C = {
  title:     { font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }, alignment: { vertical: 'middle' } },
  section:   { font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } } },
  subhead:   { font: { bold: true, size: 10, color: { argb: 'FF374151' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } } },
  label:     { font: { size: 10 } },
  input:     { font: { size: 10, color: { argb: 'FF1E40AF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }, border: thinBorder() },
  formula:   { font: { size: 10, color: { argb: 'FF065F46' } }, border: thinBorder() },
  output:    { font: { bold: true, size: 10, color: { argb: 'FF065F46' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }, border: thinBorder() },
  warn:      { font: { bold: true, size: 10, color: { argb: 'FF991B1B' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } } },
  note:      { font: { italic: true, size: 9, color: { argb: 'FF6B7280' } } },
  date:      { font: { size: 10 }, numFmt: 'm/d/yyyy', border: thinBorder() },
  money:     { font: { size: 10 }, numFmt: '"$"#,##0.00', border: thinBorder() },
  moneyIn:   { font: { size: 10, color: { argb: 'FF1E40AF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }, numFmt: '"$"#,##0.00', border: thinBorder() },
  pct:       { font: { size: 10 }, numFmt: '0.0%', border: thinBorder() },
  num:       { font: { size: 10 }, numFmt: '#,##0', border: thinBorder() },
  numIn:     { font: { size: 10, color: { argb: 'FF1E40AF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }, numFmt: '#,##0', border: thinBorder() },
  decimal:   { font: { size: 10 }, numFmt: '0.0', border: thinBorder() },
};

function thinBorder() {
  const t = { style: 'thin', color: { argb: 'FFD1D5DB' } };
  return { top: t, left: t, bottom: t, right: t };
}

function applyStyle(cell, style) {
  if (!cell || !style) return;
  Object.assign(cell, style);
  if (style.font) cell.font = { ...cell.font, ...style.font };
  if (style.fill) cell.fill = style.fill;
  if (style.alignment) cell.alignment = { ...cell.alignment, ...style.alignment };
  if (style.border) cell.border = style.border;
  if (style.numFmt) cell.numFmt = style.numFmt;
}

function setRow(sheet, row, cells) {
  for (const [col, value, style] of cells) {
    const c = sheet.getCell(`${col}${row}`);
    if (typeof value === 'object' && value !== null && 'formula' in value) {
      c.value = value;
    } else {
      c.value = value;
    }
    if (style) applyStyle(c, style);
  }
}

function defineName(name, ref) {
  wb.definedNames.add(ref, name);
}

// ============ INPUTS TAB ============
const inp = wb.addWorksheet('Inputs', { views: [{ state: 'normal', showGridLines: false }] });
inp.columns = [
  { width: 32 }, { width: 14 }, { width: 14 }, { width: 28 }, { width: 14 }, { width: 40 },
];

setRow(inp, 1, [['A', 'COTTO S&OP — INPUTS', C.title]]);
inp.mergeCells('A1:F1');
inp.getRow(1).height = 22;

setRow(inp, 2, [['A', 'Yellow cells = editable. Green = calculated. Update yellow when reality changes.', C.note]]);
inp.mergeCells('A2:F2');

// --- Production parameters ---
setRow(inp, 4, [['A', 'PRODUCTION PARAMETERS', C.section]]);
inp.mergeCells('A4:F4');

setRow(inp, 5, [['A', 'Units per case', C.label], ['B', 6, C.numIn]]);
defineName('units_per_case', 'Inputs!$B$5');

setRow(inp, 6, [['A', 'Safety stock (weeks)', C.label], ['B', 2, C.numIn], ['D', 'Default. Per-SKU dynamic safety added in Session 2.', C.note]]);
defineName('safety_stock_wks', 'Inputs!$B$6');

setRow(inp, 7, [['A', 'Transit time CO→BK (days)', C.label], ['B', 5, C.numIn], ['D', 'RLS Fri pickup → Wed delivery', C.note]]);
defineName('transit_days', 'Inputs!$B$7');

setRow(inp, 8, [['A', 'Shelf life (days)', C.label], ['B', 60, C.numIn]]);
defineName('shelf_life_days', 'Inputs!$B$8');

setRow(inp, 9, [['A', 'Misfits min days at receipt', C.label], ['B', 45, C.numIn]]);
defineName('misfits_min_days', 'Inputs!$B$9');

setRow(inp, 10, [['A', 'Production days per run', C.label], ['B', 3, C.numIn]]);
defineName('prod_days_per_run', 'Inputs!$B$10');

setRow(inp, 11, [['A', 'Scale-up date (75→100 gal/day)', C.label], ['B', new Date(2026, 4, 1), C.date]]);
defineName('scale_up_date', 'Inputs!$B$11');

setRow(inp, 12, [['A', 'Pre scale-up gal/day', C.label], ['B', 75, C.numIn]]);
defineName('gal_per_day_pre', 'Inputs!$B$12');

setRow(inp, 13, [['A', 'Post scale-up gal/day', C.label], ['B', 100, C.numIn]]);
defineName('gal_per_day_post', 'Inputs!$B$13');

setRow(inp, 14, [['A', 'Units per gallon (approx)', C.label], ['B', 16, C.numIn]]);
defineName('units_per_gal', 'Inputs!$B$14');

setRow(inp, 15, [['A', 'Samples & events (cases/wk)', C.label], ['B', 2, C.numIn], ['D', 'Applied equally to all 3 SKUs', C.note]]);
defineName('samples_cases_per_wk', 'Inputs!$B$15');

setRow(inp, 16, [['A', 'Avg weeks per month', C.label], ['B', 4.33, C.decimal], ['D', '52÷12. For monthly conversions.', C.note]]);
defineName('weeks_per_month', 'Inputs!$B$16');

// --- Block schedule parameters ---
setRow(inp, 18, [['A', 'BLOCK SCHEDULE PARAMETERS', C.section]]);
inp.mergeCells('A18:F18');
setRow(inp, 19, [['A', 'First block start (Wed)', C.label], ['B', new Date(2026, 4, 6), C.date]]);
defineName('first_block_start', 'Inputs!$B$19');
setRow(inp, 20, [['A', 'Run A→Run B gap (days)', C.label], ['B', 3, C.numIn], ['D', 'Run A ends Fri, Run B starts Mon = 3 calendar days', C.note]]);
defineName('runa_to_runb_days', 'Inputs!$B$20');
setRow(inp, 21, [['A', 'Run B end → Ship (days)', C.label], ['B', 2, C.numIn]]);
defineName('runb_to_ship_days', 'Inputs!$B$21');

// --- Co-Man (FK) ---
setRow(inp, 23, [['A', 'CO-MANUFACTURING — FUEL KITCHENS', C.section]]);
inp.mergeCells('A23:F23');
setRow(inp, 24, [['A', 'Base production fee', C.label], ['B', 0.95, C.moneyIn]]);
defineName('fk_base_fee', 'Inputs!$B$24');
setRow(inp, 25, [['A', 'Label application 1 (wrap)', C.label], ['B', 0.15, C.moneyIn]]);
defineName('fk_label_1', 'Inputs!$B$25');
setRow(inp, 26, [['A', 'Label application 2 (lid)', C.label], ['B', 0.10, C.moneyIn]]);
defineName('fk_label_2', 'Inputs!$B$26');
setRow(inp, 27, [['A', 'Total Co-Man / unit', C.label], ['B', { formula: 'fk_base_fee+fk_label_1+fk_label_2' }, { ...C.money, ...{ font: { bold: true, color: { argb: 'FF065F46' } } }, fill: C.output.fill }]]);
defineName('coman_per_unit', 'Inputs!$B$27');
setRow(inp, 28, [['A', 'FK storage (monthly)', C.label], ['B', 82, C.moneyIn]]);
defineName('fk_storage_monthly', 'Inputs!$B$28');

// --- Packaging ---
setRow(inp, 30, [['A', 'PACKAGING COSTS', C.section]]);
inp.mergeCells('A30:F30');
setRow(inp, 31, [['A', 'Component', C.subhead], ['B', '$/Unit', C.subhead], ['C', 'MOQ', C.subhead], ['D', 'Supplier', C.subhead], ['E', 'Lead Time', C.subhead]]);
const pkg = [
  ['Container (8oz PP)', 0.18, '15K', 'Cary Company', '4-6 wk'],
  ['Lid (110mm PP)', 0.11, '15K', 'Cary Company', '4-6 wk'],
  ['Wrap label', 0.1716, '6K', 'ATL', '2-3 wk'],
  ['Lid label', 0.1042, '6K', 'ATL', '2-3 wk'],
  ['Case (6-pack)', 0.054, '5K', 'Snyder', '2-3 wk ($0.324/case ÷ 6)'],
];
pkg.forEach((p, i) => {
  setRow(inp, 32 + i, [['A', p[0], C.label], ['B', p[1], C.moneyIn], ['C', p[2], C.label], ['D', p[3], C.label], ['E', p[4], C.label]]);
});
setRow(inp, 37, [['A', 'Total Packaging / unit', C.label], ['B', { formula: 'SUM(B32:B36)' }, { ...C.money, ...{ font: { bold: true, color: { argb: 'FF065F46' } } }, fill: C.output.fill }]]);
defineName('packaging_per_unit', 'Inputs!$B$37');

// --- Ingredient costs by SKU ---
setRow(inp, 39, [['A', 'INGREDIENT COSTS BY SKU (per unit, from Order Guide 4/6/26)', C.section]]);
inp.mergeCells('A39:F39');

setRow(inp, 40, [['A', 'BUFFALO', C.subhead], ['B', '$/Unit', C.subhead], ['D', 'FRENCH ONION', C.subhead], ['E', '$/Unit', C.subhead], ['G', 'GARDEN RANCH', C.subhead], ['H', '$/Unit', C.subhead]]);
inp.getColumn('G').width = 28;
inp.getColumn('H').width = 14;

const buf = [['4% Cottage Cheese', 0.5141], ['Nonfat Greek Yogurt', 0.7361], ['Garlic Powder', 0.0191], ['Onion Powder', 0.0148], ['Salt', 0.0030], ['Smoked Paprika', 0.0261], ['Psyllium Husk', 0.0213], ['Hot Sauce', 0.1860], ['Avocado Oil', 0.0072], ['White Vinegar', 0.0026], ['Honey', 0.0493]];
const fo  = [['4% Cottage Cheese', 0.5842], ['Nonfat Greek Yogurt', 0.8366], ['Onion, minced', 0.1151], ['Garlic Powder', 0.0225], ['Onion Powder', 0.0197], ['Salt', 0.0042], ['Coconut Aminos', 0.1521], ['Umami Powder', 0.0490], ['Psyllium Husk', 0.0064], ['Balsamic Vinegar', 0.0099]];
const gr  = [['4% Cottage Cheese', 0.6013], ['Nonfat Greek Yogurt', 0.8611], ['Parsley, dried', 0.0118], ['Dill weed, dried', 0.0142], ['Chives, dried', 0.0391], ['Garlic Powder', 0.0292], ['Onion Powder', 0.0227], ['Salt', 0.0049], ['Buttermilk Powder', 0.0839], ['Umami Powder', 0.0520], ['Lemon Juice', 0.0137], ['Mustard Powder', 0.0054], ['Psyllium Husk', 0.0064], ['White Vinegar', 0.0020]];

const maxLen = Math.max(buf.length, fo.length, gr.length);
for (let i = 0; i < maxLen; i++) {
  const r = 41 + i;
  if (buf[i]) setRow(inp, r, [['A', buf[i][0], C.label], ['B', buf[i][1], C.moneyIn]]);
  if (fo[i])  setRow(inp, r, [['D', fo[i][0],  C.label], ['E', fo[i][1],  C.moneyIn]]);
  if (gr[i])  setRow(inp, r, [['G', gr[i][0],  C.label], ['H', gr[i][1],  C.moneyIn]]);
}
const totRow = 41 + maxLen + 1;
setRow(inp, totRow, [
  ['A', 'Total BUF / unit', { ...C.label, font: { bold: true } }],
  ['B', { formula: `SUM(B41:B${41 + buf.length - 1})` }, { ...C.money, ...{ font: { bold: true, color: { argb: 'FF065F46' } } }, fill: C.output.fill }],
  ['D', 'Total FO / unit', { ...C.label, font: { bold: true } }],
  ['E', { formula: `SUM(E41:E${41 + fo.length - 1})` }, { ...C.money, ...{ font: { bold: true, color: { argb: 'FF065F46' } } }, fill: C.output.fill }],
  ['G', 'Total GR / unit', { ...C.label, font: { bold: true } }],
  ['H', { formula: `SUM(H41:H${41 + gr.length - 1})` }, { ...C.money, ...{ font: { bold: true, color: { argb: 'FF065F46' } } }, fill: C.output.fill }],
]);
defineName('ing_cost_buf', `Inputs!$B$${totRow}`);
defineName('ing_cost_fo',  `Inputs!$E$${totRow}`);
defineName('ing_cost_gr',  `Inputs!$H$${totRow}`);

// --- Freight ---
const freightStart = totRow + 2;
setRow(inp, freightStart, [['A', 'FREIGHT', C.section]]);
inp.mergeCells(`A${freightStart}:F${freightStart}`);
setRow(inp, freightStart + 1, [['A', 'RLS 3-pallet rate (CO→BK)', C.label], ['B', 1675.62, C.moneyIn], ['D', 'RLS Logistics, ~3,600 units/3 pallets, 5-day transit', C.note]]);
defineName('freight_rls_rate', `Inputs!$B$${freightStart + 1}`);
setRow(inp, freightStart + 2, [['A', 'Units per shipment', C.label], ['B', 3600, C.numIn], ['D', 'Update as volume scales (4,800 at 100gal, 6,000+ at 6 pallets)', C.note]]);
defineName('units_per_shipment', `Inputs!$B$${freightStart + 2}`);
setRow(inp, freightStart + 3, [['A', 'Freight / unit', { ...C.label, font: { bold: true } }], ['B', { formula: 'freight_rls_rate / units_per_shipment' }, { ...C.money, ...{ font: { bold: true, color: { argb: 'FF065F46' } } }, fill: C.output.fill }]]);
defineName('freight_per_unit', `Inputs!$B$${freightStart + 3}`);

// --- COGS rollup ---
const cogsStart = freightStart + 5;
setRow(inp, cogsStart, [['A', 'COGS BY SKU (per unit, all-in)', C.section]]);
inp.mergeCells(`A${cogsStart}:F${cogsStart}`);
setRow(inp, cogsStart + 1, [['A', '', C.subhead], ['B', 'BUF', C.subhead], ['C', 'FO', C.subhead], ['D', 'GR', C.subhead], ['E', 'Blended', C.subhead]]);
setRow(inp, cogsStart + 2, [
  ['A', 'Co-Man + Packaging + Ingredients', C.label],
  ['B', { formula: 'coman_per_unit + packaging_per_unit + ing_cost_buf' }, C.money],
  ['C', { formula: 'coman_per_unit + packaging_per_unit + ing_cost_fo' }, C.money],
  ['D', { formula: 'coman_per_unit + packaging_per_unit + ing_cost_gr' }, C.money],
  ['E', { formula: 'AVERAGE(B' + (cogsStart + 2) + ':D' + (cogsStart + 2) + ')' }, C.money],
]);
defineName('cogs_buf', `Inputs!$B$${cogsStart + 2}`);
defineName('cogs_fo',  `Inputs!$C$${cogsStart + 2}`);
defineName('cogs_gr',  `Inputs!$D$${cogsStart + 2}`);
setRow(inp, cogsStart + 3, [
  ['A', '+ Freight', C.label],
  ['B', { formula: 'B' + (cogsStart + 2) + ' + freight_per_unit' }, C.money],
  ['C', { formula: 'C' + (cogsStart + 2) + ' + freight_per_unit' }, C.money],
  ['D', { formula: 'D' + (cogsStart + 2) + ' + freight_per_unit' }, C.money],
  ['E', { formula: 'AVERAGE(B' + (cogsStart + 3) + ':D' + (cogsStart + 3) + ')' }, C.money],
]);
setRow(inp, cogsStart + 4, [['A', 'All-in COGS / unit (with freight)', { ...C.label, font: { bold: true } }]]);
defineName('cogs_buf_allin', `Inputs!$B$${cogsStart + 3}`);
defineName('cogs_fo_allin',  `Inputs!$C$${cogsStart + 3}`);
defineName('cogs_gr_allin',  `Inputs!$D$${cogsStart + 3}`);

// ============ ACCOUNTS TAB ============
const acc = wb.addWorksheet('Accounts', { views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: false }] });
acc.columns = [
  { width: 26 }, { width: 13 }, { width: 14 }, { width: 12 }, { width: 11 }, { width: 14 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 13 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 36 },
];

setRow(acc, 1, [['A', 'ACCOUNTS', C.title]]);
acc.mergeCells('A1:N1');
acc.getRow(1).height = 22;
setRow(acc, 2, [['A', 'One row per account. Status drives which accounts feed Demand Plan. Add new accounts at the END of the table — references will follow.', C.note]]);
acc.mergeCells('A2:N2');

const accHeaders = ['Account','Status','Channel','Open Date','$/Unit','Pmt Terms','Wkly BUF (cs)','Wkly FO (cs)','Wkly GR (cs)','Total Wkly cs','Total Wkly u','Acct Fee/wk','Placeholder?','Notes'];
setRow(acc, 4, accHeaders.map((h, i) => [String.fromCharCode(65 + i), h, C.subhead]));
acc.getRow(4).height = 24;

const accountsData = [
  ['Meadow Lane',         'Active',     'Wholesale',    new Date(2026, 2, 1),  5.60, 'NET 15',       20, 18, 8,  0,    '2x/wk Thu+Mon. Buyer Evy. Lead account.'],
  ['The Shelf',           'Active',     'Consignment',  new Date(2026, 2, 1),  9.09, 'Consignment',  3,  3,  3,  150,  '70/30 of $12.99 + $150/wk fee. Considering 60/40.'],
  ['Pop Up Grocer',       'Active',     'Consignment',  new Date(2026, 3, 10), 8.40, 'Consignment',  10, 8,  6,  200,  '70/30 of $12.00 + $200/wk fee. 1x/wk Thu.'],
  ['Happier Grocery',     'Active',     'Wholesale',    new Date(2026, 3, 16), 7.194,'NET 15',       4,  4,  4,  0,    '1x/wk Thu. Buyer Tiffany Tan.'],
  ['Olive & Oak',         'Paused',     'Wholesale',    new Date(2026, 2, 24), 6.59, 'NET 15',       3,  3,  3,  0,    'Paused — needs distributor.'],
  ['Fairway Door 1',      'Pipeline',   'TBD',          new Date(2026, 4, 20), 6.60, 'NET 30',       5,  5,  5,  0,    'Distributor TBD. Naturally NY pitch winner.'],
  ['Fairway Door 2',      'Pipeline',   'TBD',          new Date(2026, 4, 20), 6.60, 'NET 30',       5,  5,  5,  0,    'Distributor TBD'],
  ['Fairway Door 3',      'Pipeline',   'TBD',          new Date(2026, 4, 20), 6.60, 'NET 30',       5,  5,  5,  0,    'Distributor TBD'],
  ['Fairway Door 4',      'Pipeline',   'TBD',          new Date(2026, 4, 20), 6.60, 'NET 30',       5,  5,  5,  0,    'Distributor TBD'],
  ['Farm to People',      'Pipeline',   'Wholesale',    new Date(2026, 4, 15), 6.60, 'NET 15',       8,  8,  8,  0,    ''],
  ['Last Minute Market',  'Pipeline',   'Wholesale',    new Date(2026, 3, 30), 6.60, 'NET 15',       3,  3,  3,  0,    ''],
  ['Butterfield Market 1','Pipeline',   'Wholesale',    new Date(2026, 3, 30), 6.60, 'NET 15',       10, 8,  6,  0,    'Sara McMonigle, 4 NYC locations'],
  ['Butterfield Market 2','Pipeline',   'Wholesale',    new Date(2026, 3, 30), 6.60, 'NET 15',       10, 8,  6,  0,    ''],
  ['Elm Wellness',        'Pipeline',   'Wholesale',    new Date(2026, 4, 27), 6.00, 'NET 15',       5,  4,  3,  0,    ''],
  ['Lifethyme Market',    'Pipeline',   'Wholesale',    new Date(2026, 4, 27), 6.00, 'NET 15',       5,  4,  3,  0,    ''],
  ['Sag General Store',   'Pipeline',   'Wholesale',    new Date(2026, 4, 21), 6.60, 'NET 15',       10, 8,  6,  0,    ''],
  ['Gourmet Garage 1',    'Pipeline',   'TBD',          new Date(2026, 5, 1),  4.53, 'NET 30',       5,  5,  5,  0,    'Distributor TBD'],
  ['Gourmet Garage 2',    'Pipeline',   'TBD',          new Date(2026, 5, 1),  4.53, 'NET 30',       5,  5,  5,  0,    'Distributor TBD'],
  ['Gourmet Garage 3',    'Pipeline',   'TBD',          new Date(2026, 5, 1),  4.53, 'NET 30',       5,  5,  5,  0,    'Distributor TBD'],
  ['Misfits Market',      'Pipeline',   'DTC',          new Date(2026, 5, 1),  6.05, 'NET 30',       25, 0,  25, 0,    '650u/SKU/mo BUF+GR. LA DC direct from FK. EXCLUDED from BK demand.'],
];

// Numbered placeholders 1-30 with default 5/4/3 cs and $6.60 unit price
const placeholderStart = accountsData.length + 5; // start row in sheet
const placeholderOpenDates = [
  new Date(2026, 5, 7),  new Date(2026, 5, 7),  new Date(2026, 5, 7),
  new Date(2026, 5, 14), new Date(2026, 5, 14), new Date(2026, 5, 14),
  new Date(2026, 5, 21), new Date(2026, 5, 21),
  new Date(2026, 6, 7),  new Date(2026, 6, 7),  new Date(2026, 6, 7),  new Date(2026, 6, 7),
  new Date(2026, 6, 7),  new Date(2026, 6, 7),  new Date(2026, 6, 7),
  new Date(2026, 6, 14), new Date(2026, 6, 14), new Date(2026, 6, 14),
  new Date(2026, 6, 21),
  new Date(2026, 7, 4),  new Date(2026, 7, 4),  new Date(2026, 7, 4),  new Date(2026, 7, 4),
  new Date(2026, 7, 4),  new Date(2026, 7, 4),  new Date(2026, 7, 4),
  new Date(2026, 8, 1),  new Date(2026, 8, 1),  new Date(2026, 8, 1),  new Date(2026, 8, 1),
];
for (let i = 1; i <= 30; i++) {
  accountsData.push([
    `Pipeline Store ${i}`, 'Pipeline', 'Wholesale',
    placeholderOpenDates[i - 1] || new Date(2026, 8, 1),
    6.60, 'NET 15',
    5, 4, 3, 0,
    'Placeholder — defaulted to most-common pipeline price/volume. Rename when account commits.'
  ]);
}

// Write rows
const ACCOUNT_DATA_FIRST_ROW = 5;
const ACCOUNT_DATA_LAST_ROW  = ACCOUNT_DATA_FIRST_ROW + accountsData.length - 1;
const ACCOUNT_BUFFER_ROW     = ACCOUNT_DATA_FIRST_ROW + 199; // 200-row capacity (50 used + 150 spare)

accountsData.forEach((row, i) => {
  const r = ACCOUNT_DATA_FIRST_ROW + i;
  const isPlaceholder = row[0].startsWith('Pipeline Store ');
  setRow(acc, r, [
    ['A', row[0], C.input],
    ['B', row[1], C.input],
    ['C', row[2], C.input],
    ['D', row[3], { ...C.date, fill: C.input.fill, font: C.input.font }],
    ['E', row[4], C.moneyIn],
    ['F', row[5], C.input],
    ['G', row[6], C.numIn],
    ['H', row[7], C.numIn],
    ['I', row[8], C.numIn],
    ['J', { formula: `G${r}+H${r}+I${r}` }, C.formula],
    ['K', { formula: `J${r}*units_per_case` }, C.formula],
    ['L', row[9], C.moneyIn],
    ['M', isPlaceholder ? 'YES' : '', C.input],
    ['N', row[10], C.label],
  ]);
});

// Convert account data range to an Excel Table for structural integrity
acc.addTable({
  name: 'tbl_Accounts',
  ref: `A4:N${ACCOUNT_DATA_LAST_ROW}`,
  headerRow: true,
  totalsRow: false,
  style: { theme: 'TableStyleLight15', showRowStripes: true },
  columns: accHeaders.map(h => ({ name: h, filterButton: true })),
  rows: [], // already populated via cells
});

// Define named ranges for the dynamic columns of the accounts table
defineName('acct_name',       `Accounts!$A$${ACCOUNT_DATA_FIRST_ROW}:$A$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_status',     `Accounts!$B$${ACCOUNT_DATA_FIRST_ROW}:$B$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_channel',    `Accounts!$C$${ACCOUNT_DATA_FIRST_ROW}:$C$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_open',       `Accounts!$D$${ACCOUNT_DATA_FIRST_ROW}:$D$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_price',      `Accounts!$E$${ACCOUNT_DATA_FIRST_ROW}:$E$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_terms',      `Accounts!$F$${ACCOUNT_DATA_FIRST_ROW}:$F$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_buf',        `Accounts!$G$${ACCOUNT_DATA_FIRST_ROW}:$G$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_fo',         `Accounts!$H$${ACCOUNT_DATA_FIRST_ROW}:$H$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_gr',         `Accounts!$I$${ACCOUNT_DATA_FIRST_ROW}:$I$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_total_cs',   `Accounts!$J$${ACCOUNT_DATA_FIRST_ROW}:$J$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_total_u',    `Accounts!$K$${ACCOUNT_DATA_FIRST_ROW}:$K$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_fee',        `Accounts!$L$${ACCOUNT_DATA_FIRST_ROW}:$L$${ACCOUNT_BUFFER_ROW}`);
defineName('acct_placeholder',`Accounts!$M$${ACCOUNT_DATA_FIRST_ROW}:$M$${ACCOUNT_BUFFER_ROW}`);

// Footer: counts + flags
const accFooterRow = ACCOUNT_DATA_LAST_ROW + 2;
setRow(acc, accFooterRow, [
  ['A', 'Active accounts', { ...C.label, font: { bold: true } }],
  ['B', { formula: `COUNTIF(acct_status,"Active")` }, C.output],
  ['C', 'Pipeline (real)', { ...C.label, font: { bold: true } }],
  ['D', { formula: `SUMPRODUCT((acct_status="Pipeline")*(acct_placeholder<>"YES"))` }, C.output],
  ['E', 'Pipeline (placeholder)', { ...C.label, font: { bold: true } }],
  ['F', { formula: `SUMPRODUCT((acct_status="Pipeline")*(acct_placeholder="YES"))` }, C.output],
  ['G', 'Paused', { ...C.label, font: { bold: true } }],
  ['H', { formula: `COUNTIF(acct_status,"Paused")` }, C.output],
  ['I', 'Lost', { ...C.label, font: { bold: true } }],
  ['J', { formula: `COUNTIF(acct_status,"Lost")` }, C.output],
]);

console.log(`Accounts: ${accountsData.length} rows written, table ends at row ${ACCOUNT_DATA_LAST_ROW}, buffer to row ${ACCOUNT_BUFFER_ROW}`);

// ============ DEMAND PLAN TAB ============
const dem = wb.addWorksheet('Demand Plan', { views: [{ state: 'frozen', xSplit: 3, ySplit: 17, showGridLines: false }] });

// 26-week horizon starting Monday 4/27/2026
const FIRST_WEEK = new Date(2026, 3, 27); // April 27, 2026 (Monday)
const HORIZON_WEEKS = 26;
const weekDates = [];
for (let i = 0; i < HORIZON_WEEKS; i++) {
  const d = new Date(FIRST_WEEK);
  d.setDate(FIRST_WEEK.getDate() + i * 7);
  weekDates.push(d);
}

// Columns: A=Account, B=SKU, C=Notes/Type, D-AC=26 weeks, AD=Total
dem.columns = [
  { width: 26 }, { width: 6 }, { width: 18 },
  ...Array(26).fill({ width: 9 }),
  { width: 10 },
];

setRow(dem, 1, [['A', 'DEMAND PLAN', C.title]]);
dem.mergeCells('A1:AD1');
dem.getRow(1).height = 22;

setRow(dem, 2, [['A', 'Summary at top. BK demand drives Inventory. Misfits (DTC) excluded from BK because it ships LA-direct from FK.', C.note]]);
dem.mergeCells('A2:AD2');

// Summary block
setRow(dem, 4, [['A', 'WEEKLY DEMAND SUMMARY (cases)', C.section]]);
dem.mergeCells(`A4:AD4`);

// Week headers in row 5
const weekHeaderCells = [['A', '', C.subhead], ['B', '', C.subhead], ['C', 'Metric', C.subhead]];
weekDates.forEach((d, i) => {
  const col = colLetter(3 + i); // D, E, F, ... AC
  weekHeaderCells.push([col, d, { ...C.subhead, numFmt: 'm/d', alignment: { horizontal: 'center' } }]);
});
weekHeaderCells.push(['AD', '26-wk Total', C.subhead]);
setRow(dem, 5, weekHeaderCells);

function colLetter(n) {
  let s = '';
  let m = n + 1;
  while (m > 0) {
    const r = (m - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    m = Math.floor((m - 1) / 26);
  }
  return s;
}

const SUM_TOTAL_BUF_ROW = 6, SUM_TOTAL_FO_ROW = 7, SUM_TOTAL_GR_ROW = 8, SUM_TOTAL_ALL_ROW = 9;
const SUM_BK_BUF_ROW    = 11, SUM_BK_FO_ROW    = 12, SUM_BK_GR_ROW    = 13, SUM_BK_ALL_ROW    = 14;

// Helper to build per-week summary formula
function summaryFormula(skuColumn, channelFilter, weekDateCol) {
  // skuColumn = "acct_buf" / "acct_fo" / "acct_gr"
  // channelFilter = optional (e.g., "<>DTC" to exclude Misfits)
  let f = `SUMPRODUCT((acct_status<>"")*(acct_status<>"Lost")*(acct_status<>"Paused")*(acct_open<=${weekDateCol})*${skuColumn}`;
  if (channelFilter === 'BK') f += `*(acct_channel<>"DTC")`;
  f += `)`;
  return f;
}

// Total demand rows
const skuRows = [
  [SUM_TOTAL_BUF_ROW, 'Total BUF', 'BUF', 'acct_buf', null],
  [SUM_TOTAL_FO_ROW,  'Total FO',  'FO',  'acct_fo',  null],
  [SUM_TOTAL_GR_ROW,  'Total GR',  'GR',  'acct_gr',  null],
];
for (const [r, label, sku, col, _] of skuRows) {
  const cells = [['A', label, { ...C.label, font: { bold: true } }], ['B', sku, C.label], ['C', 'Total demand', C.note]];
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i); // D=3
    cells.push([wcol, { formula: summaryFormula(col, 'ALL', `${wcol}$5`) }, C.formula]);
  });
  cells.push(['AD', { formula: `SUM(D${r}:AC${r})` }, { ...C.formula, font: { bold: true } }]);
  setRow(dem, r, cells);
}
// Total all
const cellsAll = [['A', 'TOTAL (all SKUs)', { ...C.label, font: { bold: true } }], ['C', 'Total demand', C.note]];
weekDates.forEach((_, i) => {
  const wcol = colLetter(3 + i);
  cellsAll.push([wcol, { formula: `${wcol}${SUM_TOTAL_BUF_ROW}+${wcol}${SUM_TOTAL_FO_ROW}+${wcol}${SUM_TOTAL_GR_ROW}` }, { ...C.output }]);
});
cellsAll.push(['AD', { formula: `SUM(D${SUM_TOTAL_ALL_ROW}:AC${SUM_TOTAL_ALL_ROW})` }, C.output]);
setRow(dem, SUM_TOTAL_ALL_ROW, cellsAll);

// BK-only demand rows (excludes DTC channel = Misfits)
const skuBKRows = [
  [SUM_BK_BUF_ROW, 'BK BUF', 'BUF', 'acct_buf'],
  [SUM_BK_FO_ROW,  'BK FO',  'FO',  'acct_fo'],
  [SUM_BK_GR_ROW,  'BK GR',  'GR',  'acct_gr'],
];
for (const [r, label, sku, col] of skuBKRows) {
  const cells = [['A', label, { ...C.label, font: { bold: true } }], ['B', sku, C.label], ['C', 'BK only (no Misfits)', C.note]];
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    cells.push([wcol, { formula: summaryFormula(col, 'BK', `${wcol}$5`) }, C.formula]);
  });
  cells.push(['AD', { formula: `SUM(D${r}:AC${r})` }, { ...C.formula, font: { bold: true } }]);
  setRow(dem, r, cells);
}
// BK total
const cellsBKAll = [['A', 'BK TOTAL (all SKUs)', { ...C.label, font: { bold: true } }], ['C', 'BK only — drives Inventory', C.note]];
weekDates.forEach((_, i) => {
  const wcol = colLetter(3 + i);
  cellsBKAll.push([wcol, { formula: `${wcol}${SUM_BK_BUF_ROW}+${wcol}${SUM_BK_FO_ROW}+${wcol}${SUM_BK_GR_ROW}` }, C.output]);
});
cellsBKAll.push(['AD', { formula: `SUM(D${SUM_BK_ALL_ROW}:AC${SUM_BK_ALL_ROW})` }, C.output]);
setRow(dem, SUM_BK_ALL_ROW, cellsBKAll);

// Define named ranges for BK-only weekly totals (Inventory will use these)
defineName('bk_demand_buf_wkly', `'Demand Plan'!$D$${SUM_BK_BUF_ROW}:$AC$${SUM_BK_BUF_ROW}`);
defineName('bk_demand_fo_wkly',  `'Demand Plan'!$D$${SUM_BK_FO_ROW}:$AC$${SUM_BK_FO_ROW}`);
defineName('bk_demand_gr_wkly',  `'Demand Plan'!$D$${SUM_BK_GR_ROW}:$AC$${SUM_BK_GR_ROW}`);
defineName('demand_week_dates',  `'Demand Plan'!$D$5:$AC$5`);

// Monthly rollup — May, Jun, Jul, Aug, Sep, Oct
const MONTH_ROLLUP_START = 16;
setRow(dem, MONTH_ROLLUP_START, [['A', 'MONTHLY DEMAND ROLLUP (cases, BK only)', C.section]]);
dem.mergeCells(`A${MONTH_ROLLUP_START}:AD${MONTH_ROLLUP_START}`);

const months = [
  ['May 2026', 4, 5],   // (year, month index 0-based for first day, last day month +1)
  ['Jun 2026', 5, 6],
  ['Jul 2026', 6, 7],
  ['Aug 2026', 7, 8],
  ['Sep 2026', 8, 9],
  ['Oct 2026', 9, 10],
];
const MR_HEADER_ROW = MONTH_ROLLUP_START + 1;
setRow(dem, MR_HEADER_ROW, [['A', 'Month', C.subhead], ['B', 'BUF', C.subhead], ['C', 'FO', C.subhead], ['D', 'GR', C.subhead], ['E', 'Total', C.subhead], ['F', 'Avg cases/wk', C.subhead]]);
months.forEach((m, i) => {
  const r = MR_HEADER_ROW + 1 + i;
  const monthStartDate = `DATE(2026,${m[1] + 1},1)`;
  const monthEndDate   = `DATE(2026,${m[2] + 1},0)`;
  setRow(dem, r, [
    ['A', m[0], { ...C.label, font: { bold: true } }],
    ['B', { formula: `SUMPRODUCT((demand_week_dates>=${monthStartDate})*(demand_week_dates<=${monthEndDate})*bk_demand_buf_wkly)` }, C.formula],
    ['C', { formula: `SUMPRODUCT((demand_week_dates>=${monthStartDate})*(demand_week_dates<=${monthEndDate})*bk_demand_fo_wkly)` }, C.formula],
    ['D', { formula: `SUMPRODUCT((demand_week_dates>=${monthStartDate})*(demand_week_dates<=${monthEndDate})*bk_demand_gr_wkly)` }, C.formula],
    ['E', { formula: `B${r}+C${r}+D${r}` }, C.output],
    ['F', { formula: `IFERROR(E${r}/SUMPRODUCT((demand_week_dates>=${monthStartDate})*(demand_week_dates<=${monthEndDate})*1),0)` }, C.formula],
  ]);
});

// Per-account detail (one row per account-SKU = up to 50 accounts × 3 SKUs = 150 rows)
const DETAIL_HEADER_ROW = MR_HEADER_ROW + months.length + 3;
setRow(dem, DETAIL_HEADER_ROW - 1, [['A', 'PER-ACCOUNT DETAIL (cases, lookups by name from Accounts tab)', C.section]]);
dem.mergeCells(`A${DETAIL_HEADER_ROW - 1}:AD${DETAIL_HEADER_ROW - 1}`);

const detailHeaderCells = [['A', 'Account', C.subhead], ['B', 'SKU', C.subhead], ['C', 'Status', C.subhead]];
weekDates.forEach((d, i) => {
  detailHeaderCells.push([colLetter(3 + i), d, { ...C.subhead, numFmt: 'm/d', alignment: { horizontal: 'center' } }]);
});
detailHeaderCells.push(['AD', 'Total', C.subhead]);
setRow(dem, DETAIL_HEADER_ROW, detailHeaderCells);

let detailRow = DETAIL_HEADER_ROW + 1;
const SKU_COL_LOOKUP = { BUF: 'G', FO: 'H', GR: 'I' };
accountsData.forEach((row, i) => {
  const acctName = row[0];
  ['BUF', 'FO', 'GR'].forEach(sku => {
    const skuLookupCol = SKU_COL_LOOKUP[sku];
    const cells = [
      ['A', acctName, C.label],
      ['B', sku, C.label],
      ['C', { formula: `IFERROR(VLOOKUP(A${detailRow},Accounts!$A:$M,2,FALSE),"")` }, { ...C.formula, font: { italic: true, size: 9, color: { argb: 'FF6B7280' } } }],
    ];
    weekDates.forEach((_, w) => {
      const wcol = colLetter(3 + w);
      // Look up this account's open date and weekly cases for this SKU. If open date <= this week, show cases.
      const openDateLookup = `IFERROR(VLOOKUP($A${detailRow},Accounts!$A:$M,4,FALSE),9^99)`;
      const casesLookup    = `IFERROR(VLOOKUP($A${detailRow},Accounts!$A:$M,${(skuLookupCol.charCodeAt(0) - 64)},FALSE),0)`;
      const statusLookup   = `IFERROR(VLOOKUP($A${detailRow},Accounts!$A:$M,2,FALSE),"")`;
      cells.push([wcol, {
        formula: `IF(AND(${statusLookup}<>"Lost",${statusLookup}<>"Paused",${openDateLookup}<=${wcol}$${DETAIL_HEADER_ROW}),${casesLookup},0)`
      }, C.formula]);
    });
    cells.push(['AD', { formula: `SUM(D${detailRow}:AC${detailRow})` }, C.formula]);
    setRow(dem, detailRow, cells);
    detailRow++;
  });
});

console.log(`Demand Plan: detail rows ${DETAIL_HEADER_ROW + 1} to ${detailRow - 1} (${detailRow - 1 - DETAIL_HEADER_ROW} rows)`);

// ============ INVENTORY TAB ============
const inv = wb.addWorksheet('Inventory', { views: [{ state: 'normal', showGridLines: false }] });
inv.columns = [
  { width: 22 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 },
  ...Array(26).fill({ width: 10 }),
];

setRow(inv, 1, [['A', 'INVENTORY', C.title]]);
inv.mergeCells('A1:E1');
inv.getRow(1).height = 22;
setRow(inv, 2, [['A', 'Snapshot by location, weekly BK projection, movement log. ALL changes go in the movement log — never edit snapshot directly.', C.note]]);
inv.mergeCells('A2:E2');

// --- Current snapshot ---
setRow(inv, 4, [['A', 'CURRENT SNAPSHOT (cases) — as of TODAY', C.section]]);
inv.mergeCells('A4:E4');

setRow(inv, 5, [['A', 'Location', C.subhead], ['B', 'BUF', C.subhead], ['C', 'FO', C.subhead], ['D', 'GR', C.subhead], ['E', 'Total', C.subhead]]);

const LOCATIONS = ['BK Warehouse', 'Apartment', 'At-FK', 'In-Transit', 'At-Retailer'];
const SNAPSHOT_FIRST_ROW = 6;

// Each location is computed from movement log: starting + IN - OUT (where date <= TODAY())
// We'll define the movement log range first, but place log below.
// For now reference the planned log range $A$30:$J$300 (270 row capacity).
const LOG_FIRST_ROW = 30;
const LOG_BUFFER_ROW = 300;

function locationFormula(loc, skuCol) {
  // skuCol: BUF=E, FO=F, GR=G in the movement log
  const base = `(mvt_location="${loc}")*(mvt_date<=TODAY())`;
  return `ROUND((SUMPRODUCT(${base}*(mvt_direction="In")*${`mvt_${skuCol}`}) - SUMPRODUCT(${base}*(mvt_direction="Out")*${`mvt_${skuCol}`}))/units_per_case,0)`;
}

LOCATIONS.forEach((loc, i) => {
  const r = SNAPSHOT_FIRST_ROW + i;
  setRow(inv, r, [
    ['A', loc, C.label],
    ['B', { formula: locationFormula(loc, 'buf') }, C.formula],
    ['C', { formula: locationFormula(loc, 'fo')  }, C.formula],
    ['D', { formula: locationFormula(loc, 'gr')  }, C.formula],
    ['E', { formula: `B${r}+C${r}+D${r}` }, C.output],
  ]);
});

const SNAPSHOT_TOTAL_ROW = SNAPSHOT_FIRST_ROW + LOCATIONS.length;
setRow(inv, SNAPSHOT_TOTAL_ROW, [
  ['A', 'TOTAL ALL LOCATIONS', { ...C.label, font: { bold: true } }],
  ['B', { formula: `SUM(B${SNAPSHOT_FIRST_ROW}:B${SNAPSHOT_TOTAL_ROW - 1})` }, C.output],
  ['C', { formula: `SUM(C${SNAPSHOT_FIRST_ROW}:C${SNAPSHOT_TOTAL_ROW - 1})` }, C.output],
  ['D', { formula: `SUM(D${SNAPSHOT_FIRST_ROW}:D${SNAPSHOT_TOTAL_ROW - 1})` }, C.output],
  ['E', { formula: `SUM(E${SNAPSHOT_FIRST_ROW}:E${SNAPSHOT_TOTAL_ROW - 1})` }, C.output],
]);

// Define snapshot named ranges
defineName('inv_bk_buf', `Inventory!$B$${SNAPSHOT_FIRST_ROW}`);
defineName('inv_bk_fo',  `Inventory!$C$${SNAPSHOT_FIRST_ROW}`);
defineName('inv_bk_gr',  `Inventory!$D$${SNAPSHOT_FIRST_ROW}`);

// --- Notes/legend ---
setRow(inv, SNAPSHOT_TOTAL_ROW + 2, [['A', 'LOCATION DEFINITIONS', C.subhead]]);
inv.mergeCells(`A${SNAPSHOT_TOTAL_ROW + 2}:E${SNAPSHOT_TOTAL_ROW + 2}`);
const locDefs = [
  ['BK Warehouse', 'Carriacou Logistics — Brooklyn cold storage. Primary distribution point.'],
  ['Apartment',    'Kendall\'s apt fridge for samples, events, taste tests.'],
  ['At-FK',        'Produced but not yet shipped. Between prod end date and ship date.'],
  ['In-Transit',   'Shipped but not yet arrived at BK. Between ship date and BK arrival.'],
  ['At-Retailer',  'Consigned at retailer (Shelf, PUG) or shipped to Misfits LA DC.'],
];
locDefs.forEach((d, i) => {
  setRow(inv, SNAPSHOT_TOTAL_ROW + 3 + i, [['A', d[0], { ...C.label, font: { bold: true } }], ['B', d[1], C.note]]);
  inv.mergeCells(`B${SNAPSHOT_TOTAL_ROW + 3 + i}:E${SNAPSHOT_TOTAL_ROW + 3 + i}`);
});

// --- Weekly BK projection ---
// Placed after the movement log so we can reference its range. Build it lower down.
// We'll build it at row LOG_BUFFER_ROW + 5
const PROJ_HEADER_ROW = LOG_BUFFER_ROW + 5;
setRow(inv, PROJ_HEADER_ROW - 1, [['A', 'WEEKLY BK INVENTORY PROJECTION (cases, on-hand at BK)', C.section]]);
inv.mergeCells(`A${PROJ_HEADER_ROW - 1}:E${PROJ_HEADER_ROW - 1}`);

const projHeaderCells = [['A', 'SKU', C.subhead], ['B', 'Metric', C.subhead], ['C', '', C.subhead]];
weekDates.forEach((d, i) => {
  projHeaderCells.push([colLetter(3 + i), d, { ...C.subhead, numFmt: 'm/d', alignment: { horizontal: 'center' } }]);
});
setRow(inv, PROJ_HEADER_ROW, projHeaderCells);

// For each SKU: starting, +supply (placeholder=0 — comes from Supply Plan in Session 2), -demand, =ending, status
const SKU_DEFS = [
  { sku: 'BUF', invName: 'inv_bk_buf', demandName: 'bk_demand_buf_wkly' },
  { sku: 'FO',  invName: 'inv_bk_fo',  demandName: 'bk_demand_fo_wkly' },
  { sku: 'GR',  invName: 'inv_bk_gr',  demandName: 'bk_demand_gr_wkly' },
];
let projRow = PROJ_HEADER_ROW + 1;
SKU_DEFS.forEach(({ sku, invName, demandName }, idx) => {
  const startRow = projRow;
  setRow(inv, projRow, [['A', sku, { ...C.subhead }]]);
  inv.mergeCells(`A${projRow}:A${projRow + 4}`);
  // Starting (week N starting = week N-1 ending; week 0 = current BK snapshot)
  setRow(inv, projRow, [['A', sku, { ...C.subhead }], ['B', 'Starting', C.label]]);
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    if (i === 0) setRow(inv, projRow, [[wcol, { formula: invName }, C.formula]]);
    else {
      const prev = colLetter(3 + i - 1);
      setRow(inv, projRow, [[wcol, { formula: `${prev}${projRow + 3}` }, C.formula]]);
    }
  });
  // + Supply (Session 2 will fill from Supply Plan; for now blank/0)
  setRow(inv, projRow + 1, [['B', '+ Supply', C.label]]);
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    setRow(inv, projRow + 1, [[wcol, 0, { ...C.numIn, font: { color: { argb: 'FF9CA3AF' }, italic: true } }]]);
  });
  // - Demand (BK demand for this SKU at this week)
  setRow(inv, projRow + 2, [['B', '− Demand', C.label]]);
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    setRow(inv, projRow + 2, [[wcol, { formula: `INDEX(${demandName},${i + 1})` }, C.formula]]);
  });
  // = Ending
  setRow(inv, projRow + 3, [['B', '= Ending', { ...C.label, font: { bold: true } }]]);
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    setRow(inv, projRow + 3, [[wcol, { formula: `${wcol}${projRow}+${wcol}${projRow + 1}-${wcol}${projRow + 2}` }, C.output]]);
  });
  // Status (vs safety stock = 2wk × demand)
  setRow(inv, projRow + 4, [['B', 'Status', C.label]]);
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    setRow(inv, projRow + 4, [[wcol, {
      formula: `IF(${wcol}${projRow + 3}<0,"STOCKOUT",IF(${wcol}${projRow + 3}<INDEX(${demandName},${i + 1})*safety_stock_wks,"BELOW SAFETY","OK"))`
    }, { ...C.label, font: { size: 8 }, alignment: { horizontal: 'center' } }]]);
  });
  projRow += 6;
});

// --- Movement Log (Excel Table) ---
setRow(inv, LOG_FIRST_ROW - 2, [['A', 'INVENTORY MOVEMENT LOG — source of truth for all snapshot calculations', C.section]]);
inv.mergeCells(`A${LOG_FIRST_ROW - 2}:J${LOG_FIRST_ROW - 2}`);
setRow(inv, LOG_FIRST_ROW - 1, [['A', 'Log every IN (FK shipment, returns) and OUT (deliveries, samples, spoilage). Date <= TODAY shows in snapshot. Future-dated rows stay in projection.', C.note]]);
inv.mergeCells(`A${LOG_FIRST_ROW - 1}:J${LOG_FIRST_ROW - 1}`);

const LOG_HEADER_ROW = LOG_FIRST_ROW;
const logHeaders = ['Date','Type','Location','Account/Source','BUF (units)','FO (units)','GR (units)','Direction','Lot Code','Notes'];
setRow(inv, LOG_HEADER_ROW, logHeaders.map((h, i) => [String.fromCharCode(65 + i), h, C.subhead]));

// Seed rows from current state (porting from v23 model — cleaned up)
const seedRows = [
  // Starting balance as of 4/10/26 (Run 1+1b deliveries) — recorded as IN to BK and Apt
  [new Date(2026, 3, 10), 'Starting Balance', 'BK Warehouse',  'Run 1+1b receipt',  520*6, 582*6, 768*6, 'In',  'R1+1b multi-lot', 'Starting BK on 4/10 from v23 model: BK BUF 520, FO 582, GR 768 cases'],
  [new Date(2026, 3, 10), 'Starting Balance', 'Apartment',     'Sample fridge',     72*6,  66*6,  60*6,  'In',  'mixed',           'Starting Apt on 4/10: 72/66/60 units (sellable)'],
  // April 14-16 deliveries (from v23 movement log)
  [new Date(2026, 3, 8),  'Delivery',         'BK Warehouse',  'Pop Up Grocer',     48,    48,    48,    'Out', '',                'PO #MAI-5097 opening order'],
  [new Date(2026, 3, 12), 'Delivery',         'BK Warehouse',  'Pop Up Grocer',     48,    48,    0,     'Out', '',                'PO #MAI-5156 partial Sun'],
  [new Date(2026, 3, 13), 'Delivery',         'BK Warehouse',  'Pop Up Grocer',     48,    0,     0,     'Out', '',                'PO #MAI-5156 remainder Mon'],
  [new Date(2026, 3, 16), 'Delivery',         'BK Warehouse',  'Meadow Lane',       120,   108,   48,    'Out', '',                'ML Thu 4/16: 20/18/8 cs'],
  [new Date(2026, 3, 16), 'Delivery',         'BK Warehouse',  'The Shelf',         18,    18,    0,     'Out', '',                'Shelf Thu 4/16: 3/3/0 cs'],
  [new Date(2026, 3, 16), 'Delivery',         'BK Warehouse',  'Pop Up Grocer',     96,    96,    96,    'Out', '',                'PO #MAI-5194 Thu 4/16: 16/16/16 cs'],
  [new Date(2026, 3, 16), 'Delivery',         'BK Warehouse',  'Happier Grocery',   24,    24,    24,    'Out', '',                'Happier opening order Thu 4/16'],
  [new Date(2026, 3, 16), 'Sample',           'Apartment',     'Samples',           12,    12,    12,    'Out', '',                'Estimated samples'],
  // Run 2 receipt 4/20
  [new Date(2026, 3, 20), 'FK Shipment',      'BK Warehouse',  'Run 2 (FK)',        1374,  1182,  1170,  'In',  'R2 multi-lot',    'Run 2 actuals — see Supply Plan'],
];

seedRows.forEach((row, i) => {
  const r = LOG_HEADER_ROW + 1 + i;
  setRow(inv, r, [
    ['A', row[0], C.date],
    ['B', row[1], C.label],
    ['C', row[2], C.label],
    ['D', row[3], C.label],
    ['E', row[4], C.num],
    ['F', row[5], C.num],
    ['G', row[6], C.num],
    ['H', row[7], C.label],
    ['I', row[8], C.label],
    ['J', row[9], C.note],
  ]);
});

const LOG_DATA_LAST_ROW = LOG_HEADER_ROW + seedRows.length;

inv.addTable({
  name: 'tbl_MovementLog',
  ref: `A${LOG_HEADER_ROW}:J${LOG_DATA_LAST_ROW}`,
  headerRow: true,
  totalsRow: false,
  style: { theme: 'TableStyleLight16', showRowStripes: true },
  columns: logHeaders.map(h => ({ name: h, filterButton: true })),
  rows: [],
});

// Named ranges for movement log columns (using the buffer to allow growth)
defineName('mvt_date',      `Inventory!$A$${LOG_HEADER_ROW + 1}:$A$${LOG_BUFFER_ROW}`);
defineName('mvt_type',      `Inventory!$B$${LOG_HEADER_ROW + 1}:$B$${LOG_BUFFER_ROW}`);
defineName('mvt_location',  `Inventory!$C$${LOG_HEADER_ROW + 1}:$C$${LOG_BUFFER_ROW}`);
defineName('mvt_account',   `Inventory!$D$${LOG_HEADER_ROW + 1}:$D$${LOG_BUFFER_ROW}`);
defineName('mvt_buf',       `Inventory!$E$${LOG_HEADER_ROW + 1}:$E$${LOG_BUFFER_ROW}`);
defineName('mvt_fo',        `Inventory!$F$${LOG_HEADER_ROW + 1}:$F$${LOG_BUFFER_ROW}`);
defineName('mvt_gr',        `Inventory!$G$${LOG_HEADER_ROW + 1}:$G$${LOG_BUFFER_ROW}`);
defineName('mvt_direction', `Inventory!$H$${LOG_HEADER_ROW + 1}:$H$${LOG_BUFFER_ROW}`);
defineName('mvt_lot',       `Inventory!$I$${LOG_HEADER_ROW + 1}:$I$${LOG_BUFFER_ROW}`);

console.log(`Inventory: snapshot rows ${SNAPSHOT_FIRST_ROW}-${SNAPSHOT_TOTAL_ROW}, log rows ${LOG_HEADER_ROW + 1}-${LOG_DATA_LAST_ROW} (capacity to ${LOG_BUFFER_ROW}), projection at row ${PROJ_HEADER_ROW}`);

// ============ SAVE ============
const outFile = 'C:\\Users\\kenda\\Downloads\\Cotto_SOP_v24_Session1.xlsx';
wb.xlsx.writeFile(outFile).then(() => {
  console.log('\nSaved:', outFile);
}).catch(err => {
  console.error('Save error:', err);
  process.exit(1);
});
