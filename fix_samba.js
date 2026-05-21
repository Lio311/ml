require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

async function main() {
    try {
        const res = await pool.query("UPDATE products SET spotify_track_url = 'https://open.spotify.com/track/3XM0dIafWuy5xpptFGytiG' WHERE name ILIKE '%Sol e Samba%' RETURNING id, name");
        console.log('Updated:', res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
main();
