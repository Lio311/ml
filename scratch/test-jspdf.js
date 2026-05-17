const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
doc.text("1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30", 10, 10);
doc.text("מחיר: ₪30 | כמות: 1 | מידה: 2 ml | Birkholz Sol e Samba .1", 10, 20);
const out = doc.output();
fs.writeFileSync('scratch/test.pdf', out);
