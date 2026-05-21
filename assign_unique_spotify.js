require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

https.get('https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
        try {
            console.log("CSV fetched, length:", data.length);
            const lines = data.split('\n');
            const trackIds = [];
            
            // CSV columns: track_id is the first column
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i]) continue;
                const columns = lines[i].split(',');
                const trackId = columns[0].replace(/"/g, '');
                if (trackId && trackId.length > 10) {
                    trackIds.push(trackId);
                }
            }

            // Shuffle track IDs
            const shuffledTracks = [...new Set(trackIds)].sort(() => 0.5 - Math.random());
            console.log("Total unique tracks:", shuffledTracks.length);

            const dbRes = await pool.query('SELECT id, name FROM products WHERE active = true');
            const products = dbRes.rows;
            console.log(`Assigning unique tracks to ${products.length} products...`);

            if (shuffledTracks.length < products.length) {
                console.error("Not enough unique tracks!");
                process.exit(1);
            }

            let updated = 0;
            for (let i = 0; i < products.length; i++) {
                const trackUrl = `https://open.spotify.com/track/${shuffledTracks[i]}`;
                await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [trackUrl, products[i].id]);
                updated++;
            }

            console.log(`Successfully updated ${updated} products with completely UNIQUE Spotify tracks.`);
            
            // Attempt to hit clear-cache API locally if it's running, or via https
            https.get('https://ml-tlv.com/api/admin/clear-cache', (cacheRes) => {
                let cacheData = '';
                cacheRes.on('data', c => cacheData += c);
                cacheRes.on('end', () => {
                    console.log("Clear cache response:", cacheData.substring(0, 50));
                    process.exit(0);
                });
            }).on('error', (e) => {
                console.error("Failed to clear cache:", e);
                process.exit(0);
            });
            
        } catch(e) {
            console.error(e);
            process.exit(1);
        }
    });
}).on('error', e => {
    console.error("Failed to fetch CSV:", e);
    process.exit(1);
});
