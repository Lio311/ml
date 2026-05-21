const https = require('https');
https.get('https://www.ml-tlv.com/api/admin/fix-all-songs?limit=1&start=0', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(res.statusCode, data));
});
