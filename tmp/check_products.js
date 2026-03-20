const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT id, name, name_en, brand FROM products WHERE brand ILIKE '%Roja%' OR brand ILIKE '%Elixir%' LIMIT 10");
        console.log("Results:", JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
