const fs = require('fs');
const content = fs.readFileSync('old_catalog.js', 'utf16le');
console.log(content.split('\n').slice(0, 100).join('\n'));
