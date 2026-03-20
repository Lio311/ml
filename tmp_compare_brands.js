const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function compareBrands() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const brandsTableRes = await pool.query('SELECT name FROM brands');
        const brandsFromTable = new Set(brandsTableRes.rows.map(r => r.name));

        const activeBrandsRes = await pool.query('SELECT DISTINCT brand FROM products WHERE active = true');
        const activeBrands = new Set(activeBrandsRes.rows.map(r => r.brand));

        console.log('Brands in table but NOT in products:');
        for (const b of brandsFromTable) {
            if (!activeBrands.has(b)) console.log(`- "${b}"`);
        }

        console.log('\nBrands in products but NOT in table:');
        for (const b of activeBrands) {
            if (!brandsFromTable.has(b)) console.log(`+ "${b}"`);
        }

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

compareBrands();
