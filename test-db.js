const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://postgres:postgres@localhost:5432/ml_tlv", // Fallback to local if env not set
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL LIMIT 10');
        console.log('Brands with logos:', res.rows.length);
        res.rows.forEach(r => console.log(`- ${r.name}: ${r.logo_url}`));
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        process.exit();
    }
}

check();
