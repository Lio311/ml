const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        const trackIds = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const columns = lines[i].split(',');
            const trackId = columns[0].replace(/"/g, '');
            if (trackId && trackId.length > 10) trackIds.push(trackId);
        }
        const uniqueTracks = [...new Set(trackIds)];
        fs.writeFileSync('./app/lib/spotify_tracks.json', JSON.stringify(uniqueTracks));
        console.log("Wrote", uniqueTracks.length, "tracks to JSON.");
    });
});
