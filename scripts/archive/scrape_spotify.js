const https = require('https');

https.get('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Look for track IDs
        const matches = data.match(/"url":"https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)"/g);
        console.log("Found:", matches ? matches.length : 0);
        if(matches) console.log(matches.slice(0, 5));
    });
});
