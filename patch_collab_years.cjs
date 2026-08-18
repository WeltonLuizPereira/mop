const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (code.includes('const enteredBeforeEnd = entryDate && entryDate <= endOfMonth;')) {
    code = code.replace(
        'const enteredBeforeEnd = entryDate && entryDate <= endOfMonth;',
        'const enteredBeforeEnd = !entryDate || entryDate <= endOfMonth;'
    );
    
    code = code.replace(
        'const isWithinDateRange = enteredBeforeEnd && stillActiveAfterStart;',
        'const isWithinDateRange = selectedYear === -1 ? true : (enteredBeforeEnd && stillActiveAfterStart);'
    );
    
    code = code.replace(
        '{years.map(y => <option key={y} value={y}>{y}</option>)}</select>',
        '<option value={-1}>Todos os Anos</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>'
    );
    
    const targetState = `    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(-1); // Default to all months`;
    const replaceState = `    const [selectedYear, setSelectedYear] = useState(-1); // Default to all years
    const [selectedMonth, setSelectedMonth] = useState(-1); // Default to all months`;
    
    if (code.includes(targetState)) {
        code = code.replace(targetState, replaceState);
    }
    
    fs.writeFileSync('App.tsx', code);
    console.log('Successfully patched CollaboratorsPage missing items!');
} else {
    console.log('Could not find target logic');
}
