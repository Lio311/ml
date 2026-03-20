const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkBrands() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const brandsFromTable = await pool.query('SELECT COUNT(*) FROM brands');
        console.log('Total brands in "brands" table:', brandsFromTable.rows[0].count);

        const brandsFromProductsAll = await pool.query('SELECT COUNT(DISTINCT brand) FROM products');
        console.log('Total distinct brands in "products" table (all):', brandsFromProductsAll.rows[0].count);

        const brandsFromProductsActive = await pool.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true');
        console.log('Distinct brands in "products" table (active=true):', brandsFromProductsActive.rows[0].count);

        const brandsFromProductsActiveInStock = await pool.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true AND stock > 0');
        console.log('Distinct brands in "products" table (active=true AND stock > 0):', brandsFromProductsActiveInStock.rows[0].count);

        const specificBrandsCount = await pool.query("SELECT brand, COUNT(*) as count FROM products WHERE active = true AND stock > 0 GROUP BY brand ORDER BY count ASC");
        console.log('\nBrands with few products (active & in stock):');
        specificBrandsCount.rows.slice(0, 10).forEach(b => console.log(`${b.brand}: ${b.count}`));

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

checkBrands();
