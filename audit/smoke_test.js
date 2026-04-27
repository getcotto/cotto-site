// Lightweight smoke test: open the full file, scan all formulas for common syntax issues
const ExcelJS = require('exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\kenda\\Downloads\\Cotto_SOP_v24_Full.xlsx');

  const knownNames = new Set(wb.definedNames.model.map(n => n.name));
  // List all formulas; flag any that reference an unknown defined name (uppercase letters underscored words used like names)
  let totalFormulas = 0;
  const issues = [];

  for (const ws of wb.worksheets) {
    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= ws.columnCount; c++) {
        const cell = row.getCell(c);
        if (!cell || !cell.formula) continue;
        totalFormulas++;
        const f = cell.formula;
        // crude name extraction: lowercase_underscore words
        const matches = f.match(/\b[a-z][a-z0-9_]*\b/g) || [];
        for (const m of matches) {
          // skip Excel function names and common words
          if (['if','sum','sumproduct','round','roundup','min','max','avg','average','iferror','date','year','month','day','today','match','index','vlookup','choose','text','isnumber','and','or','not','count','countif','countifs','sumif','sumifs','averageif','indirect','offset','left','right','mid','len','concat','concatenate','int','abs','mod','rank','large','small','row','column','rows','columns','transpose','xlookup','xmatch','filter','unique','sort','sequence','let','lambda','n','isblank','iserror','istext','isnumber','islogical','true','false','null'].includes(m)) continue;
          // check if it's in defined names
          if (!knownNames.has(m)) {
            issues.push({ sheet: ws.name, addr: cell.address, formula: f.slice(0, 80), unknown: m });
            break; // one issue per formula is enough
          }
        }
      }
    }
  }

  console.log(`Total formulas: ${totalFormulas}`);
  console.log(`Defined names: ${knownNames.size}`);
  if (issues.length === 0) {
    console.log('✓ No unknown name references');
  } else {
    console.log(`⚠ ${issues.length} formulas reference unknown names:`);
    const summary = {};
    for (const i of issues) summary[i.unknown] = (summary[i.unknown] || 0) + 1;
    console.log('  Top unknown tokens:', Object.entries(summary).sort((a,b) => b[1]-a[1]).slice(0,10));
    console.log('  First 5 examples:');
    for (const i of issues.slice(0, 5)) {
      console.log(`    ${i.sheet}!${i.addr} (${i.unknown}): ${i.formula}`);
    }
  }
})().catch(err => { console.error(err); process.exit(1); });
