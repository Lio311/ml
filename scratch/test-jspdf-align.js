const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
doc.text("1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30", 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test2.pdf', out);
