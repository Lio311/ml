require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

const tracks = [
    { url: 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY', keywords: ['טרופי', 'מנגו', 'פירות', 'פירותי', 'אננס', 'קוקוס', 'אבטיח', 'פסיפלורה'] }, // Watermelon Sugar
    { url: 'https://open.spotify.com/track/1BxfuPKylH5zH226gZ5yJj', keywords: ['קיץ', 'רענן', 'הדרים', 'לימון', 'ברגמוט', 'שמש', 'קיצי'] }, // Cruel Summer
    { url: 'https://open.spotify.com/track/25S6vE8VPZpP3bWlUaYlqP', keywords: ['חושני', 'דייט', 'עמוק', 'מסתורי', 'ערב', 'לילה', 'סקסי'] }, // Earned It
    { url: 'https://open.spotify.com/track/6S3JlQUWk1Ifb3O12Y8s61', keywords: ['נקי', 'סבוני', 'מים', 'ים', 'בריזה', 'שקט', 'אקווטי', 'מאסק', 'מושק'] }, // Ocean Eyes
    { url: 'https://open.spotify.com/track/0hN1YJv0sS3a6Xp68q8x8G', keywords: ['רגוע', 'שקיעה', 'ציל', 'אווירה', 'נעים', 'מרגיע', 'יומיומי'] }, // Sunset Lover
    { url: 'https://open.spotify.com/track/0VjIj9nkp3N9v2b5WvF9qV', keywords: ['אנרגטי', 'מסיבה', 'מועדון', 'צעיר', 'חשמל', 'קצב'] }, // Blinding Lights
    { url: 'https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI', keywords: ['מתוק', 'וניל', 'קרמל', 'שוקולד', 'אפרסק', 'פולי טונקה'] }, // Peaches
    { url: 'https://open.spotify.com/track/5FVd6KXrgO9B3JPWvzMopS', keywords: ['עצי', 'מעושן', 'עור', 'טבק', 'אפל', 'אגרסיבי', 'גברי', 'ארז', 'עוד'] }, // Do I Wanna Know
    { url: 'https://open.spotify.com/track/2QjOHNKaiLHeH60jR2vR8e', keywords: ['חורף', 'סתו', 'מתובל', 'חם', 'קינמון', 'הל', 'פלפל', 'ענבר'] }, // Sweater Weather
    { url: 'https://open.spotify.com/track/39n1bC4c14J1dYw40r2Lp8', keywords: ['פופ', 'כיף', 'שמח', 'קליל', 'ורוד', 'צבעוני', 'פרחוני', 'ורד', 'יסמין'] } // Levitating
];

const defaultTrack = 'https://open.spotify.com/track/0hN1YJv0sS3a6Xp68q8x8G'; // Sunset Lover as safe fallback

async function run() {
    try {
        const res = await pool.query('SELECT id, description_he, top_notes, middle_notes, base_notes, seasons FROM products');
        
        let updated = 0;
        for (const p of res.rows) {
            const textToSearch = [p.description_he, p.top_notes, p.middle_notes, p.base_notes, p.seasons].join(' ').toLowerCase();
            
            let matchedUrl = defaultTrack;
            let maxMatches = 0;

            for (const track of tracks) {
                let matches = 0;
                for (const kw of track.keywords) {
                    if (textToSearch.includes(kw)) {
                        matches++;
                    }
                }
                if (matches > maxMatches) {
                    maxMatches = matches;
                    matchedUrl = track.url;
                }
            }

            await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [matchedUrl, p.id]);
            updated++;
        }

        console.log(`Successfully mapped ${updated} products to real Spotify tracks!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
