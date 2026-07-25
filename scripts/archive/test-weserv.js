const https = require('https');
https.get('https://images.weserv.nl/?url=fimgs.net/mdimg/perfume/375x500.89627.jpg', (res) => {
    console.log(res.statusCode, res.headers['content-type']);
});
