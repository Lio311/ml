const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findMissingBrand() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const brandsTableRes = await pool.query('SELECT name FROM brands');
        const brandsFromTable = brandsTableRes.rows.map(r => r.name);

        const activeBrandsRes = await pool.query('SELECT DISTINCT brand FROM products WHERE active = true');
        const activeBrands = activeBrandsRes.rows.map(r => r.brand);

        const missing = brandsFromTable.filter(b => !activeBrands.includes(b));
        console.log('Brands in "brands" table but NOT in active "products":');
        console.log(missing);

        const inProductsNotActive = await pool.query('SELECT brand, active, stock FROM products WHERE brand = ANY($1)', [missing]);
        console.log('\nStatus of those brands in "products" table:');
        console.log(inProductsNotActive.rows);

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

findMissingBrand();
