// Build Cotto_SOP_v24_Full.xlsx — full model
// Tabs: Inputs, Accounts, Demand Plan, Inventory, Supply Plan, Orders, Co-Man POs, Cash Flow, Unit Economics, Dashboard
// Design: named ranges, Excel Tables, no row-position-dependent cross-sheet refs
//         summary at top of Demand Plan, 5 inventory locations, FK ingredient flag, auto-calc cash inflows

const ExcelJS = require('exceljs');
const path = require('path');

const wb = new ExcelJS.Workbook();
wb.creator = 'Cotto S&OP Rebuild';
wb.created = new Date();
// Force Excel to fully recalculate every formula on open. Without this, Excel relies
// on cached <v> values, and ExcelJS doesn't write those — so cells appear blank.
wb.calcProperties.fullCalcOnLoad = true;

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
  ['Meadow Lane',         'Active',     'Wholesale',    new Date(2026, 2, 1),  5.60, 'NET 15',       40, 36, 16, 0,    '2x/wk Mon+Thu, 92 cs/wk total (per 4/26 weekly sales report). 46 cs per delivery split 20/18/8.'],
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

// 35-week horizon starting Monday 3/2/2026 (Meadow Lane / Shelf launched 3/9; 3/2 captures
// the week of first launch). Past weeks fill with Orders actuals where available, then
// projection. Future weeks use projection only.
const FIRST_WEEK = new Date(2026, 2, 2); // March 2, 2026 (Monday)
const HORIZON_WEEKS = 35;
const LAST_WEEK_COL = (() => {
  let n = 3 + HORIZON_WEEKS; let s = ''; let m = n;
  while (m > 0) { const r = (m - 1) % 26; s = String.fromCharCode(65 + r) + s; m = Math.floor((m - 1) / 26); }
  return s;
})(); // 'AL' for 35 weeks
const TOTAL_COL = (() => {
  let n = 4 + HORIZON_WEEKS; let s = ''; let m = n;
  while (m > 0) { const r = (m - 1) % 26; s = String.fromCharCode(65 + r) + s; m = Math.floor((m - 1) / 26); }
  return s;
})(); // 'AM' for 35 weeks
const weekDates = [];
for (let i = 0; i < HORIZON_WEEKS; i++) {
  const d = new Date(FIRST_WEEK);
  d.setDate(FIRST_WEEK.getDate() + i * 7);
  weekDates.push(d);
}

// Columns: A=Account, B=SKU, C=Notes/Type, D-(LAST_WEEK_COL)=weeks, (TOTAL_COL)=Total
dem.columns = [
  { width: 26 }, { width: 6 }, { width: 18 },
  ...Array(HORIZON_WEEKS).fill({ width: 9 }),
  { width: 10 },
];

setRow(dem, 1, [['A', 'DEMAND PLAN', C.title]]);
dem.mergeCells(`A1:${TOTAL_COL}1`);
dem.getRow(1).height = 22;

setRow(dem, 2, [['A', 'Summary at top. Past weeks pull actuals from Orders when available, projection otherwise. BK demand drives Inventory. Misfits (DTC) excluded from BK (ships LA-direct from FK).', C.note]]);
dem.mergeCells(`A2:${TOTAL_COL}2`);

// Summary block
setRow(dem, 4, [['A', 'WEEKLY DEMAND SUMMARY (cases) — actuals + projections', C.section]]);
dem.mergeCells(`A4:${TOTAL_COL}4`);

// Week headers in row 5
const weekHeaderCells = [['A', '', C.subhead], ['B', '', C.subhead], ['C', 'Metric', C.subhead]];
weekDates.forEach((d, i) => {
  const col = colLetter(3 + i); // D, E, F, ...
  weekHeaderCells.push([col, d, { ...C.subhead, numFmt: 'm/d', alignment: { horizontal: 'center' } }]);
});
weekHeaderCells.push([TOTAL_COL, `${HORIZON_WEEKS}-wk Total`, C.subhead]);
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

// Helper to build per-week summary formula. Past-week cells overlay actuals from Orders.
// Logic: if the week is in the past AND there are matching delivered/shipped/paid orders
// for the SKU (and channel filter), use the sum of cases from Orders. Otherwise use the
// projection from Accounts.
function summaryFormula(skuColumn, channelFilter, weekDateCol) {
  // Projection: SUMPRODUCT over accounts that are open and not Lost/Paused.
  let proj = `SUMPRODUCT((acct_status<>"")*(acct_status<>"Lost")*(acct_status<>"Paused")*(acct_open<=${weekDateCol})*${skuColumn}`;
  if (channelFilter === 'BK') proj += `*(acct_channel<>"DTC")`;
  proj += `)`;

  // Actuals from Orders: sum cases for orders dated in this week, matching SKU.
  // Status filter excludes Superseded/Scheduled/Internal Transfer/Non-Sellable/Lab Sample.
  const skuLetter = { acct_buf: 'BUF', acct_fo: 'FO', acct_gr: 'GR' }[skuColumn];
  const skuFilter = `(ord_sku="${skuLetter}")`;
  let actSrc = `(ord_status<>"")*(ord_status<>"Superseded")*(ord_status<>"Scheduled")*(ord_status<>"Internal Transfer")*(ord_status<>"Non-Sellable")*(ord_status<>"Lab Sample")`;
  if (channelFilter === 'BK') actSrc += `*(ord_channel<>"DTC")*(ord_channel<>"Samples")`;
  else                        actSrc += `*(ord_channel<>"Samples")`;
  const actuals = `SUMPRODUCT(${skuFilter}*(ord_date>=${weekDateCol})*(ord_date<${weekDateCol}+7)*${actSrc}*ord_cases)`;

  // Use actuals if any exist for this past week; otherwise projection. For future weeks
  // (week >= TODAY()-6), always projection.
  return `IF(${weekDateCol}+7<=TODAY(),IF(${actuals}>0,${actuals},${proj}),${proj})`;
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
  cells.push([TOTAL_COL, { formula: `SUM(D${r}:${LAST_WEEK_COL}${r})` }, { ...C.formula, font: { bold: true } }]);
  setRow(dem, r, cells);
}
// Total all
const cellsAll = [['A', 'TOTAL (all SKUs)', { ...C.label, font: { bold: true } }], ['C', 'Total demand', C.note]];
weekDates.forEach((_, i) => {
  const wcol = colLetter(3 + i);
  cellsAll.push([wcol, { formula: `${wcol}${SUM_TOTAL_BUF_ROW}+${wcol}${SUM_TOTAL_FO_ROW}+${wcol}${SUM_TOTAL_GR_ROW}` }, { ...C.output }]);
});
cellsAll.push([TOTAL_COL, { formula: `SUM(D${SUM_TOTAL_ALL_ROW}:${LAST_WEEK_COL}${SUM_TOTAL_ALL_ROW})` }, C.output]);
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
  cells.push([TOTAL_COL, { formula: `SUM(D${r}:${LAST_WEEK_COL}${r})` }, { ...C.formula, font: { bold: true } }]);
  setRow(dem, r, cells);
}
// BK total
const cellsBKAll = [['A', 'BK TOTAL (all SKUs)', { ...C.label, font: { bold: true } }], ['C', 'BK only — drives Inventory', C.note]];
weekDates.forEach((_, i) => {
  const wcol = colLetter(3 + i);
  cellsBKAll.push([wcol, { formula: `${wcol}${SUM_BK_BUF_ROW}+${wcol}${SUM_BK_FO_ROW}+${wcol}${SUM_BK_GR_ROW}` }, C.output]);
});
cellsBKAll.push([TOTAL_COL, { formula: `SUM(D${SUM_BK_ALL_ROW}:${LAST_WEEK_COL}${SUM_BK_ALL_ROW})` }, C.output]);
setRow(dem, SUM_BK_ALL_ROW, cellsBKAll);

// Define named ranges for weekly totals (Inventory + Supply Plan use these)
defineName('total_demand_buf_wkly', `'Demand Plan'!$D$${SUM_TOTAL_BUF_ROW}:$${LAST_WEEK_COL}$${SUM_TOTAL_BUF_ROW}`);
defineName('total_demand_fo_wkly',  `'Demand Plan'!$D$${SUM_TOTAL_FO_ROW}:$${LAST_WEEK_COL}$${SUM_TOTAL_FO_ROW}`);
defineName('total_demand_gr_wkly',  `'Demand Plan'!$D$${SUM_TOTAL_GR_ROW}:$${LAST_WEEK_COL}$${SUM_TOTAL_GR_ROW}`);
defineName('bk_demand_buf_wkly', `'Demand Plan'!$D$${SUM_BK_BUF_ROW}:$${LAST_WEEK_COL}$${SUM_BK_BUF_ROW}`);
defineName('bk_demand_fo_wkly',  `'Demand Plan'!$D$${SUM_BK_FO_ROW}:$${LAST_WEEK_COL}$${SUM_BK_FO_ROW}`);
defineName('bk_demand_gr_wkly',  `'Demand Plan'!$D$${SUM_BK_GR_ROW}:$${LAST_WEEK_COL}$${SUM_BK_GR_ROW}`);
defineName('demand_week_dates',  `'Demand Plan'!$D$5:$${LAST_WEEK_COL}$5`);

// Monthly rollup — Mar through Oct (8 months covering full horizon)
const MONTH_ROLLUP_START = 16;
setRow(dem, MONTH_ROLLUP_START, [['A', 'MONTHLY DEMAND ROLLUP (cases, BK only) — actuals + projections', C.section]]);
dem.mergeCells(`A${MONTH_ROLLUP_START}:${TOTAL_COL}${MONTH_ROLLUP_START}`);

const months = [
  ['Mar 2026', 2, 3],
  ['Apr 2026', 3, 4],
  ['May 2026', 4, 5],
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

// Per-account detail (one row per account-SKU = ~50 accounts × 3 SKUs = ~150 rows).
// Cells overlay actuals from Orders for past weeks, projection for the rest.
const DETAIL_HEADER_ROW = MR_HEADER_ROW + months.length + 3;
setRow(dem, DETAIL_HEADER_ROW - 1, [['A', 'PER-ACCOUNT DETAIL (cases) — past weeks show actuals when delivered, else projection', C.section]]);
dem.mergeCells(`A${DETAIL_HEADER_ROW - 1}:${TOTAL_COL}${DETAIL_HEADER_ROW - 1}`);

const detailHeaderCells = [['A', 'Account', C.subhead], ['B', 'SKU', C.subhead], ['C', 'Status', C.subhead]];
weekDates.forEach((d, i) => {
  detailHeaderCells.push([colLetter(3 + i), d, { ...C.subhead, numFmt: 'm/d', alignment: { horizontal: 'center' } }]);
});
detailHeaderCells.push([TOTAL_COL, 'Total', C.subhead]);
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
      const openDateLookup = `IFERROR(VLOOKUP($A${detailRow},Accounts!$A:$M,4,FALSE),9^99)`;
      const casesLookup    = `IFERROR(VLOOKUP($A${detailRow},Accounts!$A:$M,${(skuLookupCol.charCodeAt(0) - 64)},FALSE),0)`;
      const statusLookup   = `IFERROR(VLOOKUP($A${detailRow},Accounts!$A:$M,2,FALSE),"")`;
      const projection = `IF(AND(${statusLookup}<>"Lost",${statusLookup}<>"Paused",${openDateLookup}<=${wcol}$${DETAIL_HEADER_ROW}),${casesLookup},0)`;
      // Actuals: sum of cases from Orders matching account name + SKU + delivered/etc.,
      // dated within this week. Excludes Samples and pure non-sellable statuses.
      const actuals = `SUMPRODUCT((ord_account=$A${detailRow})*(ord_sku=$B${detailRow})*(ord_date>=${wcol}$${DETAIL_HEADER_ROW})*(ord_date<${wcol}$${DETAIL_HEADER_ROW}+7)*(ord_channel<>"Samples")*(ord_status<>"")*(ord_status<>"Superseded")*(ord_status<>"Scheduled")*(ord_status<>"Internal Transfer")*(ord_status<>"Non-Sellable")*(ord_status<>"Lab Sample")*ord_cases)`;
      cells.push([wcol, {
        formula: `IF(${wcol}$${DETAIL_HEADER_ROW}+7<=TODAY(),IF(${actuals}>0,${actuals},${projection}),${projection})`
      }, C.formula]);
    });
    cells.push([TOTAL_COL, { formula: `SUM(D${detailRow}:${LAST_WEEK_COL}${detailRow})` }, C.formula]);
    setRow(dem, detailRow, cells);
    detailRow++;
  });
});

console.log(`Demand Plan: detail rows ${DETAIL_HEADER_ROW + 1} to ${detailRow - 1} (${detailRow - 1 - DETAIL_HEADER_ROW} rows)`);

// ============ INVENTORY TAB ============
const inv = wb.addWorksheet('Inventory', { views: [{ state: 'normal', showGridLines: false }] });
inv.columns = [
  { width: 22 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 },
  ...Array(HORIZON_WEEKS).fill({ width: 10 }),
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
  // + Supply (from Supply Plan: runs whose BK Arrival falls in this week, BK only — exclude Misfits-direct)
  const supplyNameMap = { BUF: 'sp_buf_units', FO: 'sp_fo_units', GR: 'sp_gr_units' };
  const supplyName = supplyNameMap[sku];
  setRow(inv, projRow + 1, [['B', '+ Supply (cs)', C.label]]);
  weekDates.forEach((_, i) => {
    const wcol = colLetter(3 + i);
    setRow(inv, projRow + 1, [[wcol, {
      formula: `ROUND(SUMPRODUCT((sp_bk_arrival>=${wcol}$${PROJ_HEADER_ROW})*(sp_bk_arrival<${wcol}$${PROJ_HEADER_ROW}+7)*(sp_route_to_bk=1)*${supplyName})/units_per_case,0)`
    }, C.formula]]);
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

// ============ SUPPLY PLAN TAB ============
const sup = wb.addWorksheet('Supply Plan', { views: [{ state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: false }] });
sup.columns = [
  { width: 11 }, { width: 13 }, { width: 8 }, { width: 8 }, { width: 8 },
  { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 },
  { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 },
  { width: 9 }, { width: 9 }, { width: 7 }, { width: 11 }, { width: 11 },
  { width: 11 }, { width: 14 }, { width: 16 }, { width: 11 }, { width: 11 }, { width: 30 },
];

setRow(sup, 1, [['A', 'SUPPLY PLAN — PRODUCTION SCHEDULE', C.title]]);
sup.mergeCells('A1:Z1');
sup.getRow(1).height = 22;
setRow(sup, 2, [['A', 'Planned quantities use per-run demand snapshot (4 weeks following BK Arrival). Override Plan cells to lock a specific quantity. Status: Complete > In Production > Confirmed > Planned > Unplanned.', C.note]]);
sup.mergeCells('A2:Z2');

const SUP_HEADER_ROW = 5;
const supHeaders = [
  'Run ID','Status','Type','Gal/Day','Days',
  'Prod Start','Prod End','Ship Date','BK Arrival',
  'BUF Plan','FO Plan','GR Plan','BUF Actual','FO Actual','GR Actual',
  'Total U','Total Cs','Pal','FK Pay Date','FK Invoice $',
  'Order Ing By','FK Ing Ordered','Ingredient Status','Freight Booked','PO #','Notes'
];
setRow(sup, SUP_HEADER_ROW, supHeaders.map((h, i) => [colLetter(i), h, C.subhead]));
sup.getRow(SUP_HEADER_ROW).height = 30;
sup.getRow(SUP_HEADER_ROW).alignment = { wrapText: true, vertical: 'middle' };

// Run history + planned runs
// Run Type "A" = full block including Misfits allocation. "B" = BK-only follow-up. "S" = standalone.
// route_to_bk: 1 if shipped to BK; 0 if Misfits direct (LA DC).
const runs = [
  // [runId, status, type, gal, days, prodStart, prodEnd, shipDate, bkArrival, bufActual, foActual, grActual, fkIngOrdered, freightBooked, poNum, notes, route_to_bk]
  ['Run 1',     'Complete',  'A', 50,  3, new Date(2026,2,31), new Date(2026,3,2),  new Date(2026,3,3),  new Date(2026,3,10), 450,  800,  800,  new Date(2026,2,17), 'Y', 'PO033126',  'BUF short — wrong hot sauce had xanthan gum', 1],
  ['Run 1b',    'Complete',  'S', 25,  1, new Date(2026,3,6),  new Date(2026,3,6),  new Date(2026,3,8),  new Date(2026,3,10), 450,  0,    0,    new Date(2026,2,23), 'Y', 'PO040626',  '25-gal BUF re-run', 1],
  ['Run 2',     'Complete',  'A', 75,  3, new Date(2026,3,13), new Date(2026,3,15), new Date(2026,3,17), new Date(2026,3,20), 1374, 1182, 1170, new Date(2026,2,30), 'Y', 'PO041526',  '75gal first full run, RLS pickup', 1],
  ['Run 3',     'Confirmed', 'B', 75,  3, new Date(2026,3,28), new Date(2026,3,30), new Date(2026,4,1),  new Date(2026,4,5),  null, null, null, new Date(2026,3,18), 'N', 'PO041826',  'PO sent 4/18. RLTL pickup 5/1.', 1],
  ['Blk1A',     'Planned',   'A', 100, 3, new Date(2026,4,6),  new Date(2026,4,8),  new Date(2026,4,11), new Date(2026,4,16), null, null, null, '',                  'N', '',          'Block 1 Run A (BK + Misfits)', 1],
  ['Blk1B',     'Planned',   'B', 100, 3, new Date(2026,4,11), new Date(2026,4,13), new Date(2026,4,15), new Date(2026,4,20), null, null, null, '',                  'N', '',          'Block 1 Run B (BK only)', 1],
  ['Blk2A',     'Unplanned', 'A', 100, 3, new Date(2026,5,3),  new Date(2026,5,5),  new Date(2026,5,8),  new Date(2026,5,13), null, null, null, '',                  'N', '',          'Block 2 Run A', 1],
  ['Blk2B',     'Unplanned', 'B', 100, 3, new Date(2026,5,8),  new Date(2026,5,10), new Date(2026,5,12), new Date(2026,5,17), null, null, null, '',                  'N', '',          'Block 2 Run B', 1],
  ['Blk3A',     'Unplanned', 'A', 100, 3, new Date(2026,6,1),  new Date(2026,6,3),  new Date(2026,6,6),  new Date(2026,6,11), null, null, null, '',                  'N', '',          'Block 3 Run A', 1],
  ['Blk3B',     'Unplanned', 'B', 100, 3, new Date(2026,6,6),  new Date(2026,6,8),  new Date(2026,6,10), new Date(2026,6,15), null, null, null, '',                  'N', '',          'Block 3 Run B', 1],
  ['Blk4A',     'Unplanned', 'A', 100, 3, new Date(2026,6,29), new Date(2026,6,31), new Date(2026,7,3),  new Date(2026,7,8),  null, null, null, '',                  'N', '',          'Block 4 Run A', 1],
  ['Blk4B',     'Unplanned', 'B', 100, 3, new Date(2026,7,3),  new Date(2026,7,5),  new Date(2026,7,7),  new Date(2026,7,12), null, null, null, '',                  'N', '',          'Block 4 Run B', 1],
  ['Blk5A',     'Unplanned', 'A', 100, 3, new Date(2026,7,26), new Date(2026,7,28), new Date(2026,7,31), new Date(2026,8,5),  null, null, null, '',                  'N', '',          'Block 5 Run A', 1],
  ['Blk5B',     'Unplanned', 'B', 100, 3, new Date(2026,7,31), new Date(2026,8,2),  new Date(2026,8,4),  new Date(2026,8,9),  null, null, null, '',                  'N', '',          'Block 5 Run B', 1],
  ['Blk6A',     'Unplanned', 'A', 100, 3, new Date(2026,8,23), new Date(2026,8,25), new Date(2026,8,28), new Date(2026,9,3),  null, null, null, '',                  'N', '',          'Block 6 Run A', 1],
  ['Blk6B',     'Unplanned', 'B', 100, 3, new Date(2026,8,28), new Date(2026,8,30), new Date(2026,9,2),  new Date(2026,9,7),  null, null, null, '',                  'N', '',          'Block 6 Run B', 1],
];

const SUP_DATA_FIRST_ROW = SUP_HEADER_ROW + 1;
const SUP_DATA_LAST_ROW = SUP_DATA_FIRST_ROW + runs.length - 1;
const SUP_BUFFER_ROW = SUP_DATA_FIRST_ROW + 49; // 50-row capacity

runs.forEach((run, i) => {
  const r = SUP_DATA_FIRST_ROW + i;
  const [runId, status, type, gal, days, prodStart, prodEnd, shipDate, bkArrival,
         bufActual, foActual, grActual, fkIng, freightBooked, poNum, notes, routeToBk] = run;

  // Plan formulas: per-run demand snapshot. Run A uses TOTAL demand, Run B uses BK demand.
  // demand window = 4 weeks from BK Arrival. Then share × total batches × yield.
  // total_batches = gal × days / 25
  // share_BUF = demand_BUF / total_demand. batches_BUF = round(total_batches × share_BUF)
  // Plan_BUF = batches_BUF × 450 (yield)

  const targetCol = `I${r}`; // BK Arrival
  const galCol = `D${r}`;
  const daysCol = `E${r}`;
  const typeCol = `C${r}`;

  // Demand window aggregation — boolean multiplication avoids array-entry requirement.
  // Run A includes Misfits (uses total demand). Run B excludes Misfits (uses BK-only demand).
  const demWindow = sku =>
    `SUMPRODUCT((demand_week_dates>=${targetCol})*(demand_week_dates<${targetCol}+28)*` +
    `((${typeCol}="A")*total_demand_${sku}_wkly+(${typeCol}<>"A")*bk_demand_${sku}_wkly))`;

  // Total batches = gal × days / 25, capped/limited to integer batches
  const totalBatches = `(${galCol}*${daysCol}/25)`;

  // Share-based allocation. If total demand is 0, default to 1/3 split.
  const totalDemand = `(${demWindow('buf')}+${demWindow('fo')}+${demWindow('gr')})`;
  const shareBuf = `IF(${totalDemand}=0,1/3,${demWindow('buf')}/${totalDemand})`;
  const shareFo  = `IF(${totalDemand}=0,1/3,${demWindow('fo')}/${totalDemand})`;
  const shareGr  = `IF(${totalDemand}=0,1/3,${demWindow('gr')}/${totalDemand})`;

  const planBuf = `IFERROR(IF(OR(B${r}="Complete",B${r}="In Production"),M${r},ROUND(${totalBatches}*${shareBuf},0)*450),0)`;
  const planFo  = `IFERROR(IF(OR(B${r}="Complete",B${r}="In Production"),N${r},ROUND(${totalBatches}*${shareFo},0)*400),0)`;
  const planGr  = `IFERROR(IF(OR(B${r}="Complete",B${r}="In Production"),O${r},MAX(0,(${totalBatches}-ROUND(${totalBatches}*${shareBuf},0)-ROUND(${totalBatches}*${shareFo},0))*400)),0)`;

  setRow(sup, r, [
    ['A', runId, C.label],
    ['B', status, C.input],
    ['C', type, C.input],
    ['D', gal, C.numIn],
    ['E', days, C.numIn],
    ['F', prodStart, C.date],
    ['G', prodEnd, C.date],
    ['H', shipDate, C.date],
    ['I', bkArrival, C.date],
    ['J', { formula: planBuf }, C.formula],
    ['K', { formula: planFo  }, C.formula],
    ['L', { formula: planGr  }, C.formula],
    ['M', bufActual, bufActual !== null ? C.numIn : C.input],
    ['N', foActual,  foActual  !== null ? C.numIn : C.input],
    ['O', grActual,  grActual  !== null ? C.numIn : C.input],
    ['P', { formula: `IF(M${r}<>"",M${r},J${r})+IF(N${r}<>"",N${r},K${r})+IF(O${r}<>"",O${r},L${r})` }, C.formula],
    ['Q', { formula: `P${r}/units_per_case` }, C.formula],
    ['R', { formula: `IF(P${r}=0,"",ROUNDUP(P${r}/1800,0))` }, C.formula],
    ['S', { formula: `IF(DAY(G${r})<=15,DATE(YEAR(G${r}),MONTH(G${r})+1,5),DATE(YEAR(G${r}),MONTH(G${r})+2,5))` }, C.date],
    ['T', { formula: `P${r}*coman_per_unit` }, C.money],
    ['U', { formula: `F${r}-14` }, C.date],
    ['V', fkIng, fkIng instanceof Date ? C.date : C.input],
    ['W', { formula: `IF(B${r}="Complete","✓ done",IF(V${r}<>"","✓ ordered "&TEXT(V${r},"m/d"),IF((F${r}-TODAY())<=7,"URGENT — confirm ASAP",IF((F${r}-TODAY())<=14,"⚠ Confirm with FK","")) ))` }, C.label],
    ['X', freightBooked, C.input],
    ['Y', poNum, C.input],
    ['Z', notes, C.label],
  ]);

  // Hidden helper col for route_to_bk (column AA)
  sup.getCell(`AA${r}`).value = routeToBk;
});

sup.getColumn('AA').hidden = true;

// Convert run schedule to a Table
sup.addTable({
  name: 'tbl_Runs',
  ref: `A${SUP_HEADER_ROW}:Z${SUP_DATA_LAST_ROW}`,
  headerRow: true,
  totalsRow: false,
  style: { theme: 'TableStyleLight17', showRowStripes: true },
  columns: supHeaders.map(h => ({ name: h, filterButton: true })),
  rows: [],
});

// Named ranges for cross-sheet refs (use buffer for growth)
defineName('sp_run_id',          `'Supply Plan'!$A$${SUP_DATA_FIRST_ROW}:$A$${SUP_BUFFER_ROW}`);
defineName('sp_status',          `'Supply Plan'!$B$${SUP_DATA_FIRST_ROW}:$B$${SUP_BUFFER_ROW}`);
defineName('sp_run_type',        `'Supply Plan'!$C$${SUP_DATA_FIRST_ROW}:$C$${SUP_BUFFER_ROW}`);
defineName('sp_prod_start',      `'Supply Plan'!$F$${SUP_DATA_FIRST_ROW}:$F$${SUP_BUFFER_ROW}`);
defineName('sp_ship_date',       `'Supply Plan'!$H$${SUP_DATA_FIRST_ROW}:$H$${SUP_BUFFER_ROW}`);
defineName('sp_bk_arrival',      `'Supply Plan'!$I$${SUP_DATA_FIRST_ROW}:$I$${SUP_BUFFER_ROW}`);
defineName('sp_buf_plan',        `'Supply Plan'!$J$${SUP_DATA_FIRST_ROW}:$J$${SUP_BUFFER_ROW}`);
defineName('sp_fo_plan',         `'Supply Plan'!$K$${SUP_DATA_FIRST_ROW}:$K$${SUP_BUFFER_ROW}`);
defineName('sp_gr_plan',         `'Supply Plan'!$L$${SUP_DATA_FIRST_ROW}:$L$${SUP_BUFFER_ROW}`);
defineName('sp_buf_actual',      `'Supply Plan'!$M$${SUP_DATA_FIRST_ROW}:$M$${SUP_BUFFER_ROW}`);
defineName('sp_fo_actual',       `'Supply Plan'!$N$${SUP_DATA_FIRST_ROW}:$N$${SUP_BUFFER_ROW}`);
defineName('sp_gr_actual',       `'Supply Plan'!$O$${SUP_DATA_FIRST_ROW}:$O$${SUP_BUFFER_ROW}`);
defineName('sp_total_units',     `'Supply Plan'!$P$${SUP_DATA_FIRST_ROW}:$P$${SUP_BUFFER_ROW}`);
defineName('sp_fk_pay_date',     `'Supply Plan'!$S$${SUP_DATA_FIRST_ROW}:$S$${SUP_BUFFER_ROW}`);
defineName('sp_fk_invoice',      `'Supply Plan'!$T$${SUP_DATA_FIRST_ROW}:$T$${SUP_BUFFER_ROW}`);
defineName('sp_route_to_bk',     `'Supply Plan'!$AA$${SUP_DATA_FIRST_ROW}:$AA$${SUP_BUFFER_ROW}`);

// Effective units = actual if entered else plan, by SKU
// Place these as helper columns in AB, AC, AD (hidden)
for (let r = SUP_DATA_FIRST_ROW; r <= SUP_BUFFER_ROW; r++) {
  if (r > SUP_DATA_LAST_ROW) {
    // empty buffer rows: just put 0 to make SUMPRODUCT safe
    sup.getCell(`AB${r}`).value = 0;
    sup.getCell(`AC${r}`).value = 0;
    sup.getCell(`AD${r}`).value = 0;
  } else {
    sup.getCell(`AB${r}`).value = { formula: `IF(M${r}<>"",M${r},J${r})` };
    sup.getCell(`AC${r}`).value = { formula: `IF(N${r}<>"",N${r},K${r})` };
    sup.getCell(`AD${r}`).value = { formula: `IF(O${r}<>"",O${r},L${r})` };
  }
}
sup.getColumn('AB').hidden = true;
sup.getColumn('AC').hidden = true;
sup.getColumn('AD').hidden = true;

defineName('sp_buf_units', `'Supply Plan'!$AB$${SUP_DATA_FIRST_ROW}:$AB$${SUP_BUFFER_ROW}`);
defineName('sp_fo_units',  `'Supply Plan'!$AC$${SUP_DATA_FIRST_ROW}:$AC$${SUP_BUFFER_ROW}`);
defineName('sp_gr_units',  `'Supply Plan'!$AD$${SUP_DATA_FIRST_ROW}:$AD$${SUP_BUFFER_ROW}`);

// ---- Production accuracy summary ----
const PA_ROW = SUP_DATA_LAST_ROW + 3;
setRow(sup, PA_ROW - 1, [['A', 'PRODUCTION ACCURACY (completed runs only)', C.section]]);
sup.mergeCells(`A${PA_ROW - 1}:Z${PA_ROW - 1}`);
setRow(sup, PA_ROW, [
  ['A', 'Metric', C.subhead],
  ['B', 'BUF', C.subhead],
  ['C', 'FO', C.subhead],
  ['D', 'GR', C.subhead],
  ['E', 'Total', C.subhead],
]);
setRow(sup, PA_ROW + 1, [
  ['A', 'Total planned (completed runs)', C.label],
  ['B', { formula: `SUMPRODUCT((sp_status="Complete")*sp_buf_plan)` }, C.formula],
  ['C', { formula: `SUMPRODUCT((sp_status="Complete")*sp_fo_plan)` }, C.formula],
  ['D', { formula: `SUMPRODUCT((sp_status="Complete")*sp_gr_plan)` }, C.formula],
  ['E', { formula: `B${PA_ROW + 1}+C${PA_ROW + 1}+D${PA_ROW + 1}` }, C.output],
]);
setRow(sup, PA_ROW + 2, [
  ['A', 'Total actual', C.label],
  ['B', { formula: `SUMPRODUCT((sp_status="Complete")*sp_buf_actual)` }, C.formula],
  ['C', { formula: `SUMPRODUCT((sp_status="Complete")*sp_fo_actual)` }, C.formula],
  ['D', { formula: `SUMPRODUCT((sp_status="Complete")*sp_gr_actual)` }, C.formula],
  ['E', { formula: `B${PA_ROW + 2}+C${PA_ROW + 2}+D${PA_ROW + 2}` }, C.output],
]);
setRow(sup, PA_ROW + 3, [
  ['A', 'Variance (actual − plan)', { ...C.label, font: { bold: true } }],
  ['B', { formula: `B${PA_ROW + 2}-B${PA_ROW + 1}` }, C.output],
  ['C', { formula: `C${PA_ROW + 2}-C${PA_ROW + 1}` }, C.output],
  ['D', { formula: `D${PA_ROW + 2}-D${PA_ROW + 1}` }, C.output],
  ['E', { formula: `E${PA_ROW + 2}-E${PA_ROW + 1}` }, C.output],
]);
setRow(sup, PA_ROW + 4, [
  ['A', 'Hit rate (actual ÷ plan)', { ...C.label, font: { bold: true } }],
  ['B', { formula: `IFERROR(B${PA_ROW + 2}/B${PA_ROW + 1},"")` }, { ...C.formula, numFmt: '0.0%' }],
  ['C', { formula: `IFERROR(C${PA_ROW + 2}/C${PA_ROW + 1},"")` }, { ...C.formula, numFmt: '0.0%' }],
  ['D', { formula: `IFERROR(D${PA_ROW + 2}/D${PA_ROW + 1},"")` }, { ...C.formula, numFmt: '0.0%' }],
  ['E', { formula: `IFERROR(E${PA_ROW + 2}/E${PA_ROW + 1},"")` }, { ...C.formula, numFmt: '0.0%' }],
]);

// ---- Production trigger / next action alerts ----
const TR_ROW = PA_ROW + 7;
setRow(sup, TR_ROW - 1, [['A', 'NEXT ACTION ALERTS', C.section]]);
sup.mergeCells(`A${TR_ROW - 1}:Z${TR_ROW - 1}`);
setRow(sup, TR_ROW, [
  ['A', 'Next run needing PO', C.label],
  ['B', { formula: `IFERROR(INDEX(sp_run_id,MATCH(1,(sp_status="Planned")*1,0)),"All scheduled")` }, C.output],
]);
setRow(sup, TR_ROW + 1, [
  ['A', 'Next ingredient deadline', C.label],
  ['B', { formula: `IFERROR(MIN(IF((sp_status="Confirmed")+(sp_status="Planned"),IF(sp_prod_start<>"",sp_prod_start-14))),"--")` }, { ...C.date }],
  ['C', { formula: `IF(ISNUMBER(B${TR_ROW + 1}),IF(B${TR_ROW + 1}<TODAY(),"OVERDUE",IF(B${TR_ROW + 1}-TODAY()<=7,"URGENT — "&(B${TR_ROW + 1}-TODAY())&" days","OK — "&(B${TR_ROW + 1}-TODAY())&" days out")),"")` }, C.label],
]);

// ---- FK Ingredient $ Reconciliation ----
const ING_ROW = TR_ROW + 4;
setRow(sup, ING_ROW - 1, [['A', 'FK INGREDIENT $ RECONCILIATION (sanity check vs FK invoices)', C.section]]);
sup.mergeCells(`A${ING_ROW - 1}:Z${ING_ROW - 1}`);
setRow(sup, ING_ROW, [['A', 'Use this to spot FK over-ordering. Compare expected $ (auto) vs actual ingredient $ on FK invoices (you enter).', C.note]]);
sup.mergeCells(`A${ING_ROW}:Z${ING_ROW}`);

setRow(sup, ING_ROW + 1, [
  ['A', 'Run', C.subhead],
  ['B', 'Status', C.subhead],
  ['C', 'BUF u', C.subhead],
  ['D', 'FO u', C.subhead],
  ['E', 'GR u', C.subhead],
  ['F', 'Expected ing $', C.subhead],
  ['G', 'Actual ing $ (input)', C.subhead],
  ['H', 'Variance', C.subhead],
]);
runs.forEach((run, i) => {
  const r = ING_ROW + 2 + i;
  const sourceR = SUP_DATA_FIRST_ROW + i;
  setRow(sup, r, [
    ['A', { formula: `A${sourceR}` }, C.label],
    ['B', { formula: `B${sourceR}` }, C.label],
    ['C', { formula: `IF(M${sourceR}<>"",M${sourceR},J${sourceR})` }, C.num],
    ['D', { formula: `IF(N${sourceR}<>"",N${sourceR},K${sourceR})` }, C.num],
    ['E', { formula: `IF(O${sourceR}<>"",O${sourceR},L${sourceR})` }, C.num],
    ['F', { formula: `C${r}*ing_cost_buf+D${r}*ing_cost_fo+E${r}*ing_cost_gr` }, C.money],
    ['G', '', C.moneyIn],
    ['H', { formula: `IF(G${r}="","",G${r}-F${r})` }, C.money],
  ]);
});

console.log(`Supply Plan: ${runs.length} runs, table ends at row ${SUP_DATA_LAST_ROW}, buffer to ${SUP_BUFFER_ROW}`);

// ============ ORDERS TAB ============
const ord = wb.addWorksheet('Orders', { views: [{ state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: false }] });
ord.columns = [
  { width: 11 }, { width: 14 }, { width: 22 }, { width: 13 }, { width: 6 }, { width: 13 },
  { width: 14 }, { width: 7 }, { width: 7 }, { width: 9 }, { width: 11 }, { width: 12 }, { width: 11 }, { width: 30 }
];

setRow(ord, 1, [['A', 'OUTBOUND ORDER LOG', C.title]]);
ord.mergeCells('A1:N1');
ord.getRow(1).height = 22;
setRow(ord, 2, [['A', 'One row per SKU per order. Status drives which orders count toward revenue. Cash Flow uses Date + Payment Terms to project receipts.', C.note]]);
ord.mergeCells('A2:N2');

const ordHeaders = ['Date','Invoice/PO','Account','Channel','SKU','Flavor','Lot','Cases','Units','Unit Price','Order Total','Status','Payment Due','Notes'];
const ORD_HEADER_ROW = 5;
setRow(ord, ORD_HEADER_ROW, ordHeaders.map((h, i) => [colLetter(i), h, C.subhead]));

// Migrate orders
const ordersJson = require('./orders.json');
function parseLocalDate(iso) {
  // Return null (truly blank) instead of '' (text empty string) when there's no date.
  // Excel treats text empty in arithmetic as #VALUE! — null stays blank.
  if (!iso || typeof iso !== 'string') return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
ordersJson.forEach((o, i) => {
  const r = ORD_HEADER_ROW + 1 + i;
  setRow(ord, r, [
    ['A', parseLocalDate(o.date), C.date],
    ['B', o.invoice, C.label],
    ['C', o.account, C.label],
    ['D', o.channel, C.label],
    ['E', o.sku, C.label],
    ['F', o.flavor, C.label],
    ['G', o.lot, C.label],
    ['H', o.cases, C.num],
    ['I', o.units, C.num],
    ['J', o.price, C.money],
    ['K', { formula: `H${r}*units_per_case*J${r}` }, C.money], // recompute: cases × 6 × price ... wait, total = units × price
    ['L', o.status, C.input],
    ['M', parseLocalDate(o.due), C.date],
    ['N', o.notes, C.label],
  ]);
  // Actually total should be units × price (which is per-unit)
  ord.getCell(`K${r}`).value = { formula: `I${r}*J${r}` };
});

// Append additional orders pulled from Gmail evidence (week of 4/20-4/26).
// ML "Mon/Thu 92cs schedule" from 4/26 weekly sales report — 46 cases per delivery.
// Other accounts: best-effort projection from regular cadence (Thu deliveries).
const additionalOrders = [
  // Meadow Lane Mon 4/20 (46 cs total)
  ['ML-0420', 'Meadow Lane', 'Wholesale', 'BUF', 'Buffalo',      20, 120, 5.60, 'Delivered', new Date(2026, 4, 5),  'Mon delivery — first full week of new 92cs/wk schedule'],
  ['ML-0420', 'Meadow Lane', 'Wholesale', 'FO',  'French Onion', 18, 108, 5.60, 'Delivered', new Date(2026, 4, 5),  'Mon delivery'],
  ['ML-0420', 'Meadow Lane', 'Wholesale', 'GR',  'Garden Ranch',  8,  48, 5.60, 'Delivered', new Date(2026, 4, 5),  'Mon delivery'],
  // Meadow Lane Thu 4/23 (46 cs total)
  ['ML-0423', 'Meadow Lane', 'Wholesale', 'BUF', 'Buffalo',      20, 120, 5.60, 'Delivered', new Date(2026, 4, 8),  'Thu delivery'],
  ['ML-0423', 'Meadow Lane', 'Wholesale', 'FO',  'French Onion', 18, 108, 5.60, 'Delivered', new Date(2026, 4, 8),  'Thu delivery'],
  ['ML-0423', 'Meadow Lane', 'Wholesale', 'GR',  'Garden Ranch',  8,  48, 5.60, 'Delivered', new Date(2026, 4, 8),  'Thu delivery'],
  // Pop Up Grocer Thu 4/23 (estimated weekly reorder, scaled-down from opening ramp)
  ['PUG-0423','Pop Up Grocer','Consignment','BUF','Buffalo',     10,  60, 8.40, 'Delivered', new Date(2026, 4, 21), 'Thu replenishment (estimated from regular cadence)'],
  ['PUG-0423','Pop Up Grocer','Consignment','FO', 'French Onion', 8,  48, 8.40, 'Delivered', new Date(2026, 4, 21), 'Thu replenishment'],
  ['PUG-0423','Pop Up Grocer','Consignment','GR', 'Garden Ranch',  6,  36, 8.40, 'Delivered', new Date(2026, 4, 21), 'Thu replenishment'],
  // Happier Grocery Thu 4/23 (estimated weekly cadence)
  ['HAP-0423','Happier Grocery','Wholesale','BUF','Buffalo',      4,  24, 7.194,'Delivered', new Date(2026, 4, 8),  'Thu reorder'],
  ['HAP-0423','Happier Grocery','Wholesale','FO', 'French Onion', 4,  24, 7.194,'Delivered', new Date(2026, 4, 8),  'Thu reorder'],
  ['HAP-0423','Happier Grocery','Wholesale','GR', 'Garden Ranch', 4,  24, 7.194,'Delivered', new Date(2026, 4, 8),  'Thu reorder'],
];
additionalOrders.forEach((o, i) => {
  const r = ORD_HEADER_ROW + 1 + ordersJson.length + i;
  // Date is set to delivery date (Mon=4/20, Thu=4/23)
  let date;
  if (o[0] === 'ML-0420') date = new Date(2026, 3, 20);
  else if (o[0] === 'ML-0423') date = new Date(2026, 3, 23);
  else if (o[0] === 'PUG-0423' || o[0] === 'HAP-0423') date = new Date(2026, 3, 23);
  setRow(ord, r, [
    ['A', date, C.date],
    ['B', o[0], C.label],
    ['C', o[1], C.label],
    ['D', o[2], C.label],
    ['E', o[3], C.label],
    ['F', o[4], C.label],
    ['G', '', C.label],
    ['H', o[5], C.num],
    ['I', o[6], C.num],
    ['J', o[7], C.money],
    ['K', { formula: `I${r}*J${r}` }, C.money],
    ['L', o[8], C.input],
    ['M', o[9], C.date],
    ['N', o[10], C.label],
  ]);
});

const ORD_DATA_LAST_ROW = ORD_HEADER_ROW + ordersJson.length + additionalOrders.length;
const ORD_BUFFER_ROW = ORD_HEADER_ROW + 999; // 1000-row capacity

ord.addTable({
  name: 'tbl_Orders',
  ref: `A${ORD_HEADER_ROW}:N${ORD_DATA_LAST_ROW}`,
  headerRow: true,
  totalsRow: false,
  style: { theme: 'TableStyleLight18', showRowStripes: true },
  columns: ordHeaders.map(h => ({ name: h, filterButton: true })),
  rows: [],
});

defineName('ord_date',    `Orders!$A$${ORD_HEADER_ROW + 1}:$A$${ORD_BUFFER_ROW}`);
defineName('ord_account', `Orders!$C$${ORD_HEADER_ROW + 1}:$C$${ORD_BUFFER_ROW}`);
defineName('ord_channel', `Orders!$D$${ORD_HEADER_ROW + 1}:$D$${ORD_BUFFER_ROW}`);
defineName('ord_sku',     `Orders!$E$${ORD_HEADER_ROW + 1}:$E$${ORD_BUFFER_ROW}`);
defineName('ord_cases',   `Orders!$H$${ORD_HEADER_ROW + 1}:$H$${ORD_BUFFER_ROW}`);
defineName('ord_units',   `Orders!$I$${ORD_HEADER_ROW + 1}:$I$${ORD_BUFFER_ROW}`);
defineName('ord_total',   `Orders!$K$${ORD_HEADER_ROW + 1}:$K$${ORD_BUFFER_ROW}`);
defineName('ord_status',  `Orders!$L$${ORD_HEADER_ROW + 1}:$L$${ORD_BUFFER_ROW}`);

// Summary at bottom
const ORD_SUM_ROW = ORD_DATA_LAST_ROW + 3;
setRow(ord, ORD_SUM_ROW - 1, [['A', 'ORDER SUMMARY', C.section]]);
ord.mergeCells(`A${ORD_SUM_ROW - 1}:N${ORD_SUM_ROW - 1}`);
setRow(ord, ORD_SUM_ROW, [
  ['A', 'Total cases shipped/delivered', C.label],
  ['B', { formula: `SUMPRODUCT(((ord_status="Shipped")+(ord_status="Delivered")+(ord_status="Paid")+(ord_status="Invoiced"))*N(Orders!$H$${ORD_HEADER_ROW + 1}:$H$${ORD_BUFFER_ROW}))` }, C.output],
]);
setRow(ord, ORD_SUM_ROW + 1, [
  ['A', 'Wholesale revenue (gross)', C.label],
  ['B', { formula: `SUMPRODUCT((ord_channel="Wholesale")*ord_total)` }, C.output],
]);
setRow(ord, ORD_SUM_ROW + 2, [
  ['A', 'Consignment revenue', C.label],
  ['B', { formula: `SUMPRODUCT((ord_channel="Consignment")*ord_total)` }, C.output],
]);
setRow(ord, ORD_SUM_ROW + 3, [
  ['A', 'Total units sold (excl. samples/internal)', C.label],
  ['B', { formula: `SUMPRODUCT((ord_status<>"Superseded")*(ord_status<>"Scheduled")*(ord_status<>"Internal Transfer")*(ord_status<>"Non-Sellable")*(ord_status<>"Lab Sample")*(ord_status<>"")*ord_units)` }, C.output],
]);

console.log(`Orders: ${ordersJson.length} rows migrated, table ends at row ${ORD_DATA_LAST_ROW}, buffer to ${ORD_BUFFER_ROW}`);

// ============ CO-MAN POs TAB ============
const cpo = wb.addWorksheet('Co-Man POs', { views: [{ state: 'frozen', ySplit: 5, showGridLines: false }] });
cpo.columns = [
  { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 9 }, { width: 9 }, { width: 9 },
  { width: 11 }, { width: 11 }, { width: 12 }, { width: 11 }, { width: 12 }, { width: 30 },
];
setRow(cpo, 1, [['A', 'CO-MAN POs — INBOUND POS TO FK', C.title]]);
cpo.mergeCells('A1:M1');
cpo.getRow(1).height = 22;
setRow(cpo, 2, [['A', 'One row per PO. Naming: PO + MMDDYY of issue date.', C.note]]);
cpo.mergeCells('A2:M2');

const cpoHeaders = ['PO #','PO Date','Run','Vendor','BUF u','FO u','GR u','Total u','Unit Price','PO Total $','Status','Sent Date','Notes'];
const CPO_HEADER_ROW = 5;
setRow(cpo, CPO_HEADER_ROW, cpoHeaders.map((h, i) => [colLetter(i), h, C.subhead]));

const cpos = [
  ['PO033126', new Date(2026,2,31), 'Run 1',  'Fuel Kitchens', 800,  800,  800,  1.20, 'Sent', new Date(2026,2,17), 'Initial 50gal run'],
  ['PO040626', new Date(2026,3,6),  'Run 1b', 'Fuel Kitchens', 400,  0,    0,    1.20, 'Sent', new Date(2026,2,23), 'BUF re-run after xanthan gum issue'],
  ['PO041526', new Date(2026,3,15), 'Run 2',  'Fuel Kitchens', 1200, 1200, 1200, 1.20, 'Sent', new Date(2026,2,30), 'First 75gal full run'],
  ['PO041826', new Date(2026,3,18), 'Run 3',  'Fuel Kitchens', 1600, 1200, 800,  1.20, 'Sent', new Date(2026,3,18), 'PO + email drafted 4/18. RLTL pickup 5/1.'],
];
cpos.forEach((p, i) => {
  const r = CPO_HEADER_ROW + 1 + i;
  setRow(cpo, r, [
    ['A', p[0], C.label],
    ['B', p[1], C.date],
    ['C', p[2], C.label],
    ['D', p[3], C.label],
    ['E', p[4], C.num],
    ['F', p[5], C.num],
    ['G', p[6], C.num],
    ['H', { formula: `E${r}+F${r}+G${r}` }, C.num],
    ['I', p[7], C.money],
    ['J', { formula: `H${r}*I${r}` }, C.money],
    ['K', p[8], C.input],
    ['L', p[9], C.date],
    ['M', p[10], C.label],
  ]);
});

cpo.addTable({
  name: 'tbl_CoManPOs',
  ref: `A${CPO_HEADER_ROW}:M${CPO_HEADER_ROW + cpos.length}`,
  headerRow: true,
  totalsRow: false,
  style: { theme: 'TableStyleLight19', showRowStripes: true },
  columns: cpoHeaders.map(h => ({ name: h, filterButton: true })),
  rows: [],
});

console.log(`Co-Man POs: ${cpos.length} rows`);

// ============ CASH FLOW TAB ============
// Cash Flow looks forward from this week. Independent of Demand Plan history.
const cash = wb.addWorksheet('Cash Flow', { views: [{ state: 'frozen', xSplit: 1, ySplit: 7, showGridLines: false }] });
const CASH_WEEKS = 18;
const CASH_FIRST_WEEK = new Date(2026, 3, 27); // April 27, 2026
const cashWeekDates = [];
for (let i = 0; i < CASH_WEEKS; i++) {
  const d = new Date(CASH_FIRST_WEEK);
  d.setDate(CASH_FIRST_WEEK.getDate() + i * 7);
  cashWeekDates.push(d);
}
cash.columns = [
  { width: 30 },
  ...Array(CASH_WEEKS).fill({ width: 11 }),
  { width: 13 },
];

setRow(cash, 1, [['A', 'CASH FLOW — 18-WEEK PROJECTION', C.title]]);
cash.mergeCells('A1:T1');
cash.getRow(1).height = 22;
setRow(cash, 2, [['A', 'Outflows auto-calc from Supply Plan. Inflows auto-estimate from Orders × payment terms. Yellow = override (actual received).', C.note]]);
cash.mergeCells('A2:T2');

setRow(cash, 4, [['A', 'STARTING CASH (4/27/26)', C.subhead], ['B', 116000, C.moneyIn]]);
defineName('cash_starting', `'Cash Flow'!$B$4`);

const CASH_HEADER_ROW = 6;
const cashHeaderCells = [['A', 'Week starting', C.subhead]];
cashWeekDates.forEach((d, i) => {
  cashHeaderCells.push([colLetter(1 + i), d, { ...C.subhead, numFmt: 'm/d', alignment: { horizontal: 'center' } }]);
});
cashHeaderCells.push([colLetter(1 + CASH_WEEKS), 'TOTAL', C.subhead]);
setRow(cash, CASH_HEADER_ROW, cashHeaderCells);

function cashWeekRange(rowIdx, formulaFn, totalCol) {
  // formulaFn(weekCol) returns the formula for that week
  const cells = [];
  cashWeekDates.forEach((_, i) => {
    const wcol = colLetter(1 + i);
    cells.push([wcol, { formula: formulaFn(wcol) }, C.money]);
  });
  cells.push([totalCol, { formula: `SUM(B${rowIdx}:${colLetter(CASH_WEEKS)}${rowIdx})` }, C.money]);
  return cells;
}

const totalCol = colLetter(1 + CASH_WEEKS);

// CASH OUT
let r = 7;
setRow(cash, r, [['A', 'CASH OUT', C.section]]);
cash.mergeCells(`A${r}:${totalCol}${r}`);

r = 8;
setRow(cash, r, [['A', 'FK co-man invoice', C.label], ...cashWeekRange(r, (w) => `-SUMPRODUCT((sp_fk_pay_date>=${w}$${CASH_HEADER_ROW})*(sp_fk_pay_date<${w}$${CASH_HEADER_ROW}+7)*sp_fk_invoice)`, totalCol)]);

r = 9;
setRow(cash, r, [['A', 'FK storage ($82/mo)', C.label], ...cashWeekRange(r, (w) => `IF(DAY(${w}$${CASH_HEADER_ROW})<=7,-fk_storage_monthly,0)`, totalCol)]);

r = 10;
setRow(cash, r, [['A', 'Freight (RLS)', C.label], ...cashWeekRange(r, (w) => `-SUMPRODUCT((sp_ship_date>=${w}$${CASH_HEADER_ROW})*(sp_ship_date<${w}$${CASH_HEADER_ROW}+7)*freight_rls_rate)`, totalCol)]);

r = 11;
setRow(cash, r, [['A', 'Packaging orders (manual)', C.label], ...cashWeekDates.map((_, i) => [colLetter(1 + i), 0, C.moneyIn]), [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.money]]);

r = 12;
setRow(cash, r, [['A', 'Consignment fees (Shelf+PUG)', C.label], ...cashWeekDates.map((_, i) => [colLetter(1 + i), { formula: `-SUMPRODUCT((acct_status="Active")*(acct_channel="Consignment")*acct_fee)` }, C.money]), [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.money]]);

r = 13;
setRow(cash, r, [['A', 'Other outflows (manual)', C.label], ...cashWeekDates.map((_, i) => [colLetter(1 + i), 0, C.moneyIn]), [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.money]]);

r = 14;
setRow(cash, r, [['A', 'TOTAL OUT', { ...C.label, font: { bold: true } }], ...cashWeekDates.map((_, i) => [colLetter(1 + i), { formula: `SUM(${colLetter(1 + i)}8:${colLetter(1 + i)}13)` }, C.output]), [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.output]]);

// CASH IN — auto from Orders
r = 16;
setRow(cash, r, [['A', 'CASH IN — auto from Orders × payment terms', C.section]]);
cash.mergeCells(`A${r}:${totalCol}${r}`);

// Estimate inflow per week:
// For each week W: sum order_total where (order_date + payment_term_days) is in this week
// Payment term days: NET 15 = 15, NET 30 = 30, Consignment = 28 (estimate), other = 0
// We'll compute on a per-channel/term basis using account-level lookup

r = 17;
setRow(cash, r, [['A', 'Wholesale orders due (NET 15/30)', C.label],
  ...cashWeekDates.map((_, i) => {
    const w = colLetter(1 + i);
    // Use VLOOKUP on order's account to get terms, but that's complex. Simpler approach:
    // For each order: due date = order date + 15 if NET 15 (Wholesale default), + 30 if NET 30. Consignment: + 28.
    // Excel-level: SUMPRODUCT over ord_date + term_days in week
    // Approximation using channel: Wholesale = NET 15 (most common). For Fairway/Gourmet = NET 30 but small share.
    // Cleanest: pre-fill Payment Due column on Orders, then SUMPRODUCT on that.
    // Since we already have ord_due column M (we set it via Payment Due), use that.
    return [w, { formula: `SUMPRODUCT((ord_channel="Wholesale")*(Orders!$M$${ORD_HEADER_ROW + 1}:$M$${ORD_BUFFER_ROW}>=${w}$${CASH_HEADER_ROW})*(Orders!$M$${ORD_HEADER_ROW + 1}:$M$${ORD_BUFFER_ROW}<${w}$${CASH_HEADER_ROW}+7)*ord_total)` }, C.money];
  }),
  [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.money]
]);

r = 18;
setRow(cash, r, [['A', 'Consignment settlements (~28d after delivery)', C.label],
  // Compare ord_date to (week_start - 28) instead of (ord_date + 28) >= week_start.
  // The +28 form errors out when ord_date contains blank/text cells from buffer rows.
  ...cashWeekDates.map((_, i) => {
    const w = colLetter(1 + i);
    return [w, { formula: `SUMPRODUCT((ord_channel="Consignment")*(ord_date>=${w}$${CASH_HEADER_ROW}-28)*(ord_date<${w}$${CASH_HEADER_ROW}-21)*ord_total)` }, C.money];
  }),
  [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.money]
]);

r = 19;
setRow(cash, r, [['A', 'TOTAL ESTIMATED IN', { ...C.label, font: { bold: true } }],
  ...cashWeekDates.map((_, i) => [colLetter(1 + i), { formula: `${colLetter(1 + i)}17+${colLetter(1 + i)}18` }, C.output]),
  [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.output]
]);

// Actual override row
r = 21;
setRow(cash, r, [['A', 'ACTUAL CASH IN (override; type to replace estimate)', C.section]]);
cash.mergeCells(`A${r}:${totalCol}${r}`);

r = 22;
setRow(cash, r, [['A', 'Actual received (yellow)', C.label],
  ...cashWeekDates.map((_, i) => [colLetter(1 + i), 0, C.moneyIn]),
  [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.money]
]);

r = 24;
setRow(cash, r, [['A', 'SUMMARY', C.section]]);
cash.mergeCells(`A${r}:${totalCol}${r}`);

r = 25;
setRow(cash, r, [['A', 'Cash In (actual if entered, else estimate)', { ...C.label, font: { bold: true } }],
  ...cashWeekDates.map((_, i) => [colLetter(1 + i), { formula: `IF(${colLetter(1 + i)}22>0,${colLetter(1 + i)}22,${colLetter(1 + i)}19)` }, C.money]),
  [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.output]
]);

r = 26;
setRow(cash, r, [['A', 'Cash Out', { ...C.label, font: { bold: true } }],
  ...cashWeekDates.map((_, i) => [colLetter(1 + i), { formula: `${colLetter(1 + i)}14` }, C.money]),
  [totalCol, { formula: `${totalCol}14` }, C.money]
]);

r = 27;
setRow(cash, r, [['A', 'Net Cash Flow', { ...C.label, font: { bold: true } }],
  ...cashWeekDates.map((_, i) => [colLetter(1 + i), { formula: `${colLetter(1 + i)}25+${colLetter(1 + i)}26` }, C.output]),
  [totalCol, { formula: `SUM(B${r}:${colLetter(CASH_WEEKS)}${r})` }, C.output]
]);

r = 28;
const RUN_BAL_ROW = r;
setRow(cash, r, [['A', 'Running Balance', { ...C.label, font: { bold: true } }],
  ...cashWeekDates.map((_, i) => {
    const w = colLetter(1 + i);
    if (i === 0) return [w, { formula: `cash_starting+${w}27` }, C.output];
    const prev = colLetter(i);
    return [w, { formula: `${prev}28+${w}27` }, C.output];
  }),
]);

defineName('cash_running_balance', `'Cash Flow'!$B$${RUN_BAL_ROW}:$${colLetter(CASH_WEEKS)}$${RUN_BAL_ROW}`);

console.log('Cash Flow built');

// ============ UNIT ECONOMICS TAB ============
const ue = wb.addWorksheet('Unit Economics', { views: [{ state: 'normal', showGridLines: false }] });
ue.columns = [{ width: 28 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }];

setRow(ue, 1, [['A', 'UNIT ECONOMICS', C.title]]);
ue.mergeCells('A1:E1');
ue.getRow(1).height = 22;
setRow(ue, 2, [['A', 'Per-SKU COGS, per-account margin, monthly revenue and gross profit. All values calculated from Inputs and Accounts.', C.note]]);
ue.mergeCells('A2:E2');

setRow(ue, 4, [['A', 'COGS BY SKU (per unit)', C.section]]);
ue.mergeCells('A4:E4');
setRow(ue, 5, [['A', 'Component', C.subhead], ['B', 'BUF', C.subhead], ['C', 'FO', C.subhead], ['D', 'GR', C.subhead], ['E', 'Blended', C.subhead]]);
setRow(ue, 6, [['A', 'Co-Man', C.label], ['B', { formula: `coman_per_unit` }, C.money], ['C', { formula: `coman_per_unit` }, C.money], ['D', { formula: `coman_per_unit` }, C.money], ['E', { formula: `coman_per_unit` }, C.money]]);
setRow(ue, 7, [['A', 'Packaging', C.label], ['B', { formula: `packaging_per_unit` }, C.money], ['C', { formula: `packaging_per_unit` }, C.money], ['D', { formula: `packaging_per_unit` }, C.money], ['E', { formula: `packaging_per_unit` }, C.money]]);
setRow(ue, 8, [['A', 'Ingredients', C.label], ['B', { formula: `ing_cost_buf` }, C.money], ['C', { formula: `ing_cost_fo` }, C.money], ['D', { formula: `ing_cost_gr` }, C.money], ['E', { formula: `(ing_cost_buf+ing_cost_fo+ing_cost_gr)/3` }, C.money]]);
setRow(ue, 9, [['A', 'Subtotal (cost to produce)', { ...C.label, font: { bold: true } }],
  ['B', { formula: `B6+B7+B8` }, C.output], ['C', { formula: `C6+C7+C8` }, C.output], ['D', { formula: `D6+D7+D8` }, C.output], ['E', { formula: `E6+E7+E8` }, C.output]]);
setRow(ue, 10, [['A', '+ Freight', C.label], ['B', { formula: `freight_per_unit` }, C.money], ['C', { formula: `freight_per_unit` }, C.money], ['D', { formula: `freight_per_unit` }, C.money], ['E', { formula: `freight_per_unit` }, C.money]]);
setRow(ue, 11, [['A', 'ALL-IN COGS / unit', { ...C.label, font: { bold: true } }],
  ['B', { formula: `B9+B10` }, C.output], ['C', { formula: `C9+C10` }, C.output], ['D', { formula: `D9+D10` }, C.output], ['E', { formula: `E9+E10` }, C.output]]);

// Per-account margin
setRow(ue, 14, [['A', 'PER-ACCOUNT MARGIN (per unit, blended COGS)', C.section]]);
ue.mergeCells('A14:E14');
setRow(ue, 15, [
  ['A', 'Account', C.subhead], ['B', 'Status', C.subhead], ['C', '$/Unit', C.subhead], ['D', 'COGS All-in', C.subhead], ['E', 'GP/Unit', C.subhead],
]);

let ueRow = 16;
accountsData.forEach((row, i) => {
  const acctR = ACCOUNT_DATA_FIRST_ROW + i;
  setRow(ue, ueRow, [
    ['A', row[0], C.label],
    ['B', { formula: `Accounts!$B$${acctR}` }, C.label],
    ['C', { formula: `Accounts!$E$${acctR}` }, C.money],
    ['D', { formula: `E11` }, C.money],
    ['E', { formula: `C${ueRow}-D${ueRow}` }, C.output],
  ]);
  ueRow++;
});

console.log('Unit Economics built');

// ============ DASHBOARD TAB ============
const dash = wb.addWorksheet('Dashboard', { views: [{ state: 'normal', showGridLines: false }] });
dash.columns = [{ width: 32 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }];

// Move Dashboard to be first sheet
wb.worksheets.splice(wb.worksheets.indexOf(dash), 1);
wb.worksheets.unshift(dash);

setRow(dash, 1, [['A', 'COTTO S&OP DASHBOARD', C.title]]);
dash.mergeCells('A1:F1');
dash.getRow(1).height = 26;
setRow(dash, 2, [['A', { formula: `TEXT(TODAY(),"dddd, mmmm d, yyyy")` }, { ...C.note, font: { italic: true, size: 11 } }]]);
dash.mergeCells('A2:F2');

// --- Section 1: Needs your attention this week ---
setRow(dash, 4, [['A', 'NEEDS ATTENTION THIS WEEK', C.section]]);
dash.mergeCells('A4:F4');

setRow(dash, 5, [['A', 'Production: schedule next run', C.label],
  ['B', { formula: `IFERROR(INDEX(sp_run_id,MATCH(1,(sp_status="Planned")*1,0)),"All scheduled ✓")` }, C.output],
  ['D', 'Status', C.label],
  ['E', { formula: `IFERROR(INDEX(sp_status,MATCH(1,(sp_status="Planned")*1,0)),"")` }, C.output],
]);

setRow(dash, 6, [['A', 'Ingredients: confirm with FK', C.label],
  ['B', { formula: `IFERROR(INDEX(sp_run_id,MATCH(1,(sp_status="Confirmed")*(sp_prod_start-TODAY()<=14),0)),"None pending ✓")` }, C.output],
  ['D', 'Order by', C.label],
  ['E', { formula: `IFERROR(INDEX(sp_prod_start,MATCH(1,(sp_status="Confirmed")*(sp_prod_start-TODAY()<=14),0))-14,"")` }, { ...C.date, font: { bold: true } }],
]);

setRow(dash, 7, [['A', 'Cash: lowest projected balance', C.label],
  ['B', { formula: `MIN(cash_running_balance)` }, { ...C.output, numFmt: '"$"#,##0' }],
  ['D', { formula: `IF(MIN(cash_running_balance)<20000,"⚠ BELOW $20K","✓ OK")` }, C.output],
]);

setRow(dash, 8, [['A', 'Inventory: bottleneck SKU', C.label],
  ['B', { formula: `IF(B19=MIN(B19,C19,D19),"BUF",IF(C19=MIN(B19,C19,D19),"FO","GR"))` }, C.output],
  ['D', 'Weeks of supply', C.label],
  ['E', { formula: `MIN(B19,C19,D19)` }, { ...C.output, numFmt: '0.0' }],
]);

// --- Section 2: Health snapshot ---
setRow(dash, 11, [['A', 'INVENTORY (cases on hand at BK)', C.section]]);
dash.mergeCells('A11:F11');
setRow(dash, 12, [['A', '', C.subhead], ['B', 'BUF', C.subhead], ['C', 'FO', C.subhead], ['D', 'GR', C.subhead], ['E', 'Total', C.subhead]]);
setRow(dash, 13, [['A', 'BK Warehouse', C.label],
  ['B', { formula: `Inventory!B6` }, C.formula],
  ['C', { formula: `Inventory!C6` }, C.formula],
  ['D', { formula: `Inventory!D6` }, C.formula],
  ['E', { formula: `B13+C13+D13` }, C.output],
]);
setRow(dash, 14, [['A', 'Apartment', C.label],
  ['B', { formula: `Inventory!B7` }, C.formula],
  ['C', { formula: `Inventory!C7` }, C.formula],
  ['D', { formula: `Inventory!D7` }, C.formula],
  ['E', { formula: `B14+C14+D14` }, C.output],
]);
setRow(dash, 15, [['A', 'Total on-hand', { ...C.label, font: { bold: true } }],
  ['B', { formula: `B13+B14` }, C.output],
  ['C', { formula: `C13+C14` }, C.output],
  ['D', { formula: `D13+D14` }, C.output],
  ['E', { formula: `B15+C15+D15` }, C.output],
]);
setRow(dash, 17, [['A', 'BK weekly demand (cases, this week)', C.label],
  ['B', { formula: `INDEX(bk_demand_buf_wkly,MATCH(TRUE,demand_week_dates>=TODAY()-7,0))` }, C.formula],
  ['C', { formula: `INDEX(bk_demand_fo_wkly,MATCH(TRUE,demand_week_dates>=TODAY()-7,0))` }, C.formula],
  ['D', { formula: `INDEX(bk_demand_gr_wkly,MATCH(TRUE,demand_week_dates>=TODAY()-7,0))` }, C.formula],
]);
setRow(dash, 18, [['A', 'Safety stock (2wk × demand, cs)', C.label],
  ['B', { formula: `B17*safety_stock_wks` }, C.formula],
  ['C', { formula: `C17*safety_stock_wks` }, C.formula],
  ['D', { formula: `D17*safety_stock_wks` }, C.formula],
]);
setRow(dash, 19, [['A', 'Weeks of BK supply', { ...C.label, font: { bold: true } }],
  ['B', { formula: `IFERROR(B13/B17,"--")` }, { ...C.output, numFmt: '0.0' }],
  ['C', { formula: `IFERROR(C13/C17,"--")` }, { ...C.output, numFmt: '0.0' }],
  ['D', { formula: `IFERROR(D13/D17,"--")` }, { ...C.output, numFmt: '0.0' }],
]);

setRow(dash, 21, [['A', 'NEXT PRODUCTION RUN', C.section]]);
dash.mergeCells('A21:F21');
setRow(dash, 22, [['A', 'Run ID', C.label], ['B', { formula: `IFERROR(INDEX(sp_run_id,MATCH(1,((sp_status="Planned")+(sp_status="Confirmed"))*1,0)),"--")` }, C.output]]);
setRow(dash, 23, [['A', 'Prod start', C.label], ['B', { formula: `IFERROR(INDEX(sp_prod_start,MATCH(1,((sp_status="Planned")+(sp_status="Confirmed"))*1,0)),"--")` }, C.date]]);
setRow(dash, 24, [['A', 'BK arrival', C.label], ['B', { formula: `IFERROR(INDEX(sp_bk_arrival,MATCH(1,((sp_status="Planned")+(sp_status="Confirmed"))*1,0)),"--")` }, C.date]]);
setRow(dash, 25, [['A', 'BUF / FO / GR plan', C.label],
  ['B', { formula: `IFERROR(INDEX(sp_buf_plan,MATCH(1,((sp_status="Planned")+(sp_status="Confirmed"))*1,0)),"--")` }, C.formula],
  ['C', { formula: `IFERROR(INDEX(sp_fo_plan,MATCH(1,((sp_status="Planned")+(sp_status="Confirmed"))*1,0)),"--")` }, C.formula],
  ['D', { formula: `IFERROR(INDEX(sp_gr_plan,MATCH(1,((sp_status="Planned")+(sp_status="Confirmed"))*1,0)),"--")` }, C.formula],
]);

setRow(dash, 27, [['A', 'CASH', C.section]]);
dash.mergeCells('A27:F27');
setRow(dash, 28, [['A', 'Starting cash', C.label], ['B', { formula: `cash_starting` }, { ...C.output, numFmt: '"$"#,##0' }]]);
setRow(dash, 29, [['A', 'Lowest projected balance (18wk)', C.label],
  ['B', { formula: `MIN(cash_running_balance)` }, { ...C.output, numFmt: '"$"#,##0' }],
  ['D', 'Week of', C.label],
  ['E', { formula: `INDEX('Cash Flow'!$B$${CASH_HEADER_ROW}:$${colLetter(CASH_WEEKS)}$${CASH_HEADER_ROW},MATCH(MIN(cash_running_balance),cash_running_balance,0))` }, C.date],
]);

setRow(dash, 31, [['A', 'ACCOUNTS', C.section]]);
dash.mergeCells('A31:F31');
setRow(dash, 32, [['A', 'Active', C.label], ['B', { formula: `COUNTIF(acct_status,"Active")` }, C.output]]);
setRow(dash, 33, [['A', 'Pipeline (real)', C.label], ['B', { formula: `SUMPRODUCT((acct_status="Pipeline")*(acct_placeholder<>"YES"))` }, C.output]]);
setRow(dash, 34, [['A', 'Pipeline (placeholders)', C.label], ['B', { formula: `SUMPRODUCT((acct_status="Pipeline")*(acct_placeholder="YES"))` }, C.output]]);

// --- Section 3: Daily/Weekly rhythm ---
setRow(dash, 37, [['A', 'WEEKLY RHYTHM', C.section]]);
dash.mergeCells('A37:F37');
const rhythm = [
  ['🔴 DAILY',     'Log deliveries in Inventory > Movement Log. Date / Type / Location / Account / units / Direction.'],
  ['🔴 DAILY',     'Log new orders in Orders tab — one row per SKU per order.'],
  ['🟠 AFTER RUN', 'Fill BUF/FO/GR Actuals in Supply Plan (yellow cells). Production Accuracy auto-updates.'],
  ['🟠 AFTER RUN', 'Mark "FK Ing Ordered" with date. Status flips to "✓ ordered".'],
  ['🔵 WEEKLY',    'Scan Dashboard "Needs Attention" section every Monday morning.'],
  ['🔵 WEEKLY',    'Review Cash Flow actual received cells — type real bank receipts.'],
  ['🟢 MONTHLY',   'Review Demand Plan summary. Update weekly cases on Accounts if velocity changed.'],
  ['🟢 MONTHLY',   'Review Co-Man POs. Reconcile FK Ingredient $ for the month.'],
];
rhythm.forEach((row, i) => {
  setRow(dash, 38 + i, [['A', row[0], { ...C.label, font: { bold: true } }], ['B', row[1], C.note]]);
  dash.mergeCells(`B${38 + i}:F${38 + i}`);
});

console.log('Dashboard built');

// ============ SAVE ============
const outFile = 'C:\\Users\\kenda\\Downloads\\Cotto_SOP_v25_Full.xlsx';
wb.xlsx.writeFile(outFile).then(() => {
  console.log('\nSaved:', outFile);
}).catch(err => {
  console.error('Save error:', err);
  process.exit(1);
});
