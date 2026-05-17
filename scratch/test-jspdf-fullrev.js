const { jsPDF } = require('jspdf');
const fs = require('fs');
const doc = new jsPDF();
doc.text("03₪ :ריחמ | 1 :תומכ | lm 2 :הדימ | abmaS e loS zlohkriB .1", 190, 10, { align: 'right' });
const out = doc.output();
fs.writeFileSync('scratch/test9.pdf', out);
