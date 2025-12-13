const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const client = await pool.connect();

        console.log("Creating 'brands' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS brands (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                logo_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Fetching distinct brands from products...");
        const res = await client.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != \'\'');
        const existingBrands = res.rows.map(r => r.brand);

        console.log(`Found ${existingBrands.length} distinct brands.`);

        for (const brand of existingBrands) {
            await client.query(`
                INSERT INTO brands (name) 
                VALUES ($1) 
                ON CONFLICT (name) DO NOTHING
            `, [brand]);
        }

        console.log("Migration complete.");
        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
