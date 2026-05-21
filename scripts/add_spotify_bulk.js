const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    console.log("Starting bulk Spotify track generation...");
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const res = await pool.query('SELECT id, name, description_en, top_notes_en, middle_notes_en, base_notes_en FROM products WHERE spotify_track_url IS NULL ORDER BY id DESC');
        const products = res.rows;
        console.log(`Found ${products.length} products to process.`);

        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            console.log(`Processing [${i+1}/${products.length}] ${p.name}...`);
            
            const prompt = `You are a music and perfume expert. I have a luxury niche perfume. 
Perfume Name: ${p.name}
Description: ${p.description_en}
Top Notes: ${p.top_notes_en}
Middle Notes: ${p.middle_notes_en}
Base Notes: ${p.base_notes_en}

Find ONE specific Spotify track that perfectly matches the vibe, mood, and notes of this perfume.
For example, a dark woody scent might get a dark jazz track. A fresh citrus scent gets an upbeat acoustic track.
Search your knowledge base for a real Spotify track URL.
Return ONLY the raw Spotify track URL (e.g. https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT). No other text, no markdown, no quotes.`;

            try {
                const result = await model.generateContent(prompt);
                const text = result.response.text().trim();
                const urlMatch = text.match(/https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/);
                
                if (urlMatch) {
                    const trackUrl = urlMatch[0];
                    await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [trackUrl, p.id]);
                    console.log(` -> Success: ${trackUrl}`);
                } else {
                    console.log(` -> Failed to find URL in response: ${text}`);
                }
            } catch (aiErr) {
                console.error(` -> AI Error for ${p.name}:`, aiErr.message);
                if (aiErr.message.includes('429')) {
                    console.log("Rate limit hit. Waiting longer...");
                    await delay(10000);
                }
            }

            // Sleep 3 seconds to avoid rate limits
            await delay(3000);
        }
        
        console.log("Finished bulk processing!");
    } catch (e) {
        console.error("Critical Error:", e);
    } finally {
        pool.end();
    }
}

run();
