const { jsPDF } = require('jspdf');
const fs = require('fs');
const doc = new jsPDF();
doc.text("מחיר: ₪30 | כמות: 1 | מידה: 2 ml | 1. abmaS e loS zlohkriB", 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test5.pdf', out);
