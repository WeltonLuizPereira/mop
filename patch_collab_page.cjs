const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// The exact string to replace in CollaboratorsPage
const target = `    // Date Filters
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11

    const [coordinators, setCoordinators]`;

const replacement = `    // Date Filters
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(-1); // Default to all months

    const [coordinators, setCoordinators]`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('App.tsx', code);
    console.log('Patched selectedMonth default for CollaboratorsPage');
} else {
    console.log('Target not found in CollaboratorsPage');
}
