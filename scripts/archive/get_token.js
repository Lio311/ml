const https = require('https');
https.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
