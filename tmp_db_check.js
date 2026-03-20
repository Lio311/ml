
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const client = await pool.connect();
    try {
        console.log("Checking products table columns...");
        const columnsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `);
        console.log("Columns:", columnsRes.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        console.log("\nChecking Roja Qatar product...");
        const prodRes = await client.query(`
            SELECT id, brand, model, image_url, name_he FROM products WHERE model ILIKE '%Qatar%' OR brand ILIKE '%Roja%'
        `);
        console.table(prodRes.rows);

        console.log("\nChecking brands table for Roja...");
        const brandsRes = await client.query(`
            SELECT name, logo_url FROM brands WHERE name ILIKE '%Roja%'
        `);
        console.table(brandsRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
