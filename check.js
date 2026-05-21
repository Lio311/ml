require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});
pool.query("SELECT id, name, spotify_track_url FROM products WHERE name ILIKE '%roja%'").then(r => {
    console.log(r.rows);
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
