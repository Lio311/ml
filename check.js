const fs = require('fs');
const html = fs.readFileSync('test3.html', 'utf8');
const match = html.match(/<meta property="og:image" content="([^"]+)"/);
console.log('OG IMAGE IS:', match ? match[1] : 'NOT FOUND');
