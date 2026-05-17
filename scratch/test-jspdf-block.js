const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
const str = "\u200Eמחיר: ₪30 | כמות: 1 | מידה: 2 ml | 1. Birkholz Sol e Samba";
doc.text(str, 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test12.pdf', out);
