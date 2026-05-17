const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
const ltrRegex = /[A-Za-z0-9@.\-_#+/,()]+(?:[\s\u00A0]+[A-Za-z0-9@.\-_#+/,()]+)*/g;
const str = "1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30";
const fixBidi = (s) => "\u200E" + s.split('').reverse().join('').replace(ltrRegex, m => m.split('').reverse().join('')).replace(/ /g, '\u00A0');

const newBidiStr = fixBidi(str);
doc.text(newBidiStr, 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test13.pdf', out);
