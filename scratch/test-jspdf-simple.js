const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF();
doc.text("מחיר: ₪30", 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test11.pdf', out);
