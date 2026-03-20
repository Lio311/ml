const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findSimilarBrands() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT DISTINCT brand FROM products WHERE brand ILIKE '%Elixir%' OR brand ILIKE '%Prive%'");
        console.log('Similar brands in "products":');
        console.log(res.rows);

        const allBrands = await pool.query("SELECT name FROM brands WHERE name ILIKE '%Elixir%' OR name ILIKE '%Prive%'");
        console.log('\nSimilar brands in "brands" table:');
        console.log(allBrands.rows);

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

findSimilarBrands();
