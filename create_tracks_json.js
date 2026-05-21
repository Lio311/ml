const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        const tracks = [];
        const usedIds = new Set();

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            let row = [];
            let inQuotes = false;
            let current = '';
            for(let c of lines[i]){
                if(c === '"') inQuotes = !inQuotes;
                else if(c === ',' && !inQuotes){ row.push(current); current = ''; }
                else current += c;
            }
            row.push(current);

            if (row.length > 20) {
                const id = row[0];
                if (!usedIds.has(id)) {
                    usedIds.add(id);
                    tracks.push({
                        id: id,
                        name: row[1],
                        artist: row[2],
                        genre: row[9],
                        danceability: parseFloat(row[11]),
                        energy: parseFloat(row[12]),
                        valence: parseFloat(row[20])
                    });
                }
            }
        }
        
        fs.writeFileSync('./app/lib/spotify_tracks.json', JSON.stringify(tracks));
        console.log("Wrote", tracks.length, "tracks to JSON with metadata.");
    });
});
