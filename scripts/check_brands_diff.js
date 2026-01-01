const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const client = await pool.connect();

        console.log("--- Brands in 'brands' table ---");
        const brandsRes = await client.query('SELECT name FROM brands ORDER BY name ASC');
        const brandsTable = brandsRes.rows.map(r => r.name);
        console.log(`Total: ${brandsTable.length}`);
        // console.log(brandsTable.join(', '));

        console.log("\n--- Distinct brands in 'products' table ---");
        const productsRes = await client.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != \'\' ORDER BY brand ASC');
        const productsTable = productsRes.rows.map(r => r.brand);
        console.log(`Total: ${productsTable.length}`);
        // console.log(productsTable.join(', '));

        const missing = productsTable.filter(p => !brandsTable.includes(p));

        if (missing.length > 0) {
            console.log("\n!!! MIRACLE: The following brands are in PRODUCTS but NOT in BRANDS table !!!");
            console.log(missing.join('\n'));
        } else {
            console.log("\nAll product brands exist in the brands table.");
        }

        console.log("\n--- RECENTLY ADDED BRANDS (Last 5 IDs) ---");
        const recentRes = await client.query('SELECT id, name FROM brands ORDER BY id DESC LIMIT 5');
        console.log(recentRes.rows);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

check();
