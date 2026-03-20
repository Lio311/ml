const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDuplicates() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const brands = ["Elixir Privé", "Élixir Privé"];
        
        for (const brand of brands) {
            const res = await pool.query("SELECT COUNT(*) FROM products WHERE brand = $1", [brand]);
            console.log(`Products for "${brand}":`, res.rows[0].count);
        }

        const brandsTable = await pool.query("SELECT * FROM brands WHERE name = ANY($1)", [brands]);
        console.log('\nBrands table entries:');
        console.log(JSON.stringify(brandsTable.rows, null, 2));

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

checkDuplicates();
