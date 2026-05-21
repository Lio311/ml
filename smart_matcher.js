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
            const lines = data.split('\n');
            const tracks = [];
            
            // track_id, track_name, track_artist, track_popularity, track_album_id, track_album_name, track_album_release_date, playlist_name, playlist_id, playlist_genre, playlist_subgenre, danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, duration_ms
            
            const headers = lines[0].split(',');
            console.log("Headers:", headers);
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i]) continue;
                // Basic CSV parse (ignores commas inside quotes for now, we just need basic fields)
                // A better split:
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
                    tracks.push({
                        id: row[0],
                        name: row[1],
                        artist: row[2],
                        genre: row[9],
                        subgenre: row[10],
                        danceability: parseFloat(row[11]),
                        energy: parseFloat(row[12]),
                        valence: parseFloat(row[20])
                    });
                }
            }

            console.log("Parsed tracks:", tracks.length);

            const dbRes = await pool.query('SELECT id, name, description_he, top_notes, middle_notes, base_notes, category FROM products WHERE active = true');
            const products = dbRes.rows;
            
            // Shuffle tracks to avoid always picking the same ones
            tracks.sort(() => 0.5 - Math.random());
            
            let usedIds = new Set();
            let updated = 0;

            for (const p of products) {
                const text = [p.name, p.description_he, p.top_notes, p.middle_notes, p.base_notes].join(' ').toLowerCase();
                
                let targetGenre = null;
                let minEnergy = 0, maxEnergy = 1;
                let minValence = 0, maxValence = 1;

                if (text.includes('אוד') || text.includes('עוד') || text.includes('oud') || text.includes('עור') || text.includes('מעושן') || text.includes('טבק')) {
                    // Dark, rich, woody -> Rock/R&B, low valence, lower energy
                    targetGenre = ['rock', 'r&b'];
                    maxValence = 0.5;
                } else if (text.includes('קיץ') || text.includes('הדרים') || text.includes('רענן') || text.includes('לימון') || text.includes('fresh')) {
                    // Fresh, summer -> Pop/Latin, high valence, high energy
                    targetGenre = ['pop', 'latin', 'edm'];
                    minValence = 0.6;
                    minEnergy = 0.6;
                } else if (text.includes('חושני') || text.includes('דייט') || text.includes('סקסי') || text.includes('לילה')) {
                    // Seductive, night -> R&B, low valence
                    targetGenre = ['r&b'];
                    maxValence = 0.6;
                } else if (text.includes('מתוק') || text.includes('וניל') || text.includes('קרמל') || text.includes('שוקולד')) {
                    // Sweet, vanilla -> Pop
                    targetGenre = ['pop'];
                    minValence = 0.5;
                } else if (text.includes('נקי') || text.includes('סבוני') || text.includes('אקווטי') || text.includes('ים')) {
                    // Clean, aquatic -> Pop, low energy
                    targetGenre = ['pop'];
                    maxEnergy = 0.6;
                } else if (text.includes('אנרגטי') || text.includes('מסיבה') || text.includes('צעיר')) {
                    // Energetic, club -> EDM, high energy
                    targetGenre = ['edm', 'pop'];
                    minEnergy = 0.8;
                }

                // Find matching track
                let matchedTrack = null;
                for (const t of tracks) {
                    if (usedIds.has(t.id)) continue;
                    
                    let genreMatch = true;
                    if (targetGenre) {
                        genreMatch = targetGenre.includes(t.genre);
                    }
                    
                    let energyMatch = t.energy >= minEnergy && t.energy <= maxEnergy;
                    let valenceMatch = t.valence >= minValence && t.valence <= maxValence;

                    if (genreMatch && energyMatch && valenceMatch) {
                        matchedTrack = t;
                        break;
                    }
                }

                // Fallback to any unused if no exact match
                if (!matchedTrack) {
                    for (const t of tracks) {
                        if (!usedIds.has(t.id)) {
                            matchedTrack = t;
                            break;
                        }
                    }
                }

                if (matchedTrack) {
                    usedIds.add(matchedTrack.id);
                    await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [`https://open.spotify.com/track/${matchedTrack.id}`, p.id]);
                    updated++;
                }
            }

            console.log(`Successfully smart-matched ${updated} products.`);
            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
});
