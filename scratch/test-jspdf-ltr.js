const { jsPDF } = require('jspdf');
const fs = require('fs');
const doc = new jsPDF();
doc.text("Hello World 123", 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test4.pdf', out);
