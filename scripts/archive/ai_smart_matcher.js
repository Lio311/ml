require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        const tracks = JSON.parse(fs.readFileSync('./app/lib/spotify_tracks.json', 'utf8'));
        console.log(`Loaded ${tracks.length} tracks.`);

        const dbRes = await pool.query('SELECT id, name, description_he, top_notes, middle_notes, base_notes FROM products WHERE active = true');
        const products = dbRes.rows;
        
        let unusedTracks = [...tracks];
        let updated = 0;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        for (const p of products) {
            // Shuffle and pick 150 candidate tracks
            unusedTracks.sort(() => 0.5 - Math.random());
            const candidateTracks = unusedTracks.slice(0, 150);

            let candidatesList = candidateTracks.map(t => `- ID: ${t.id} | Artist: ${t.artist} | Title: ${t.name} | Genre: ${t.genre}`).join('\n');
            
            const prompt = `You are a master DJ matching perfumes to songs.
Perfume Name: ${p.name}
Description: ${p.description_he}
Notes: ${p.top_notes}, ${p.middle_notes}, ${p.base_notes}

Here is a list of 150 available Spotify tracks:
${candidatesList}

Pick the single track that BEST matches the vibe, mood, and style of this perfume (e.g. Tropical/Carnival -> Latin/Pop, Oud/Woody -> Dark R&B/Rock).
Return ONLY the EXACT Track ID from the list. Do not write anything else.`;

            try {
                const result = await model.generateContent(prompt);
                const trackId = result.response.text().trim();
                
                if (trackId && candidateTracks.find(t => t.id === trackId)) {
                    await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [`https://open.spotify.com/track/${trackId}`, p.id]);
                    // Remove from unused
                    unusedTracks = unusedTracks.filter(t => t.id !== trackId);
                    updated++;
                    console.log(`Assigned track to ${p.name}`);
                } else {
                    console.log(`Failed to find valid track ID for ${p.name}: ${trackId}`);
                }
            } catch(e) {
                console.error(`Gemini failed for ${p.name}:`, e);
            }
            
            // tiny sleep to avoid rate limits
            await new Promise(r => setTimeout(r, 500));
        }
        
        console.log(`Done! Updated ${updated} products with AI-selected unique tracks.`);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
