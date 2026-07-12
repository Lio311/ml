const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp_products.json', 'utf8'));
const out = data.products.map(p => `${p.brand} - ${p.model} (${p.category})`).join('\n');
fs.writeFileSync('temp_names.txt', out);
