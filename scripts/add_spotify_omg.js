const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const trackUrl = 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY';
        const res = await pool.query("UPDATE products SET spotify_track_url = $1 WHERE name ILIKE '%omg%' RETURNING id, name", [trackUrl]);
        console.log('Updated:', res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
