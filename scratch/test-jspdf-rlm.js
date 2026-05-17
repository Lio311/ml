const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
const str = "\u200F1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30";
doc.text(str, 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test6.pdf', out);
