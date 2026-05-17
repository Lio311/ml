const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
const ltrRegex = /[A-Za-z0-9@.\-_#+/,()]+(?:[\s\u00A0]+[A-Za-z0-9@.\-_#+/,()]+)*/g;
const str = "1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30";
const fixBidi = (s) => {
    // Reverse everything first
    let reversed = s.split('').reverse().join('');
    // Flip LTR words back, BUT pad them with LRM (\u200E) to force LTR context on them
    return reversed.replace(ltrRegex, m => "\u200E" + m.split('').reverse().join('') + "\u200E");
}

const newBidiStr = fixBidi(str);
doc.text(newBidiStr, 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test15.pdf', out);
