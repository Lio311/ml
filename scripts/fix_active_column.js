require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixActive() {
    console.log("Checking DB connection...");
    const client = await pool.connect();
    try {
        console.log("Connected.");

        // Check counts
        const countRes = await client.query(`
            SELECT 
                count(*) as total, 
                count(active) as active_not_null, 
                count(*) filter (where active = true) as active_true,
                count(*) filter (where active = false) as active_false,
                count(*) filter (where active IS NULL) as active_null
            FROM products
        `);
        console.table(countRes.rows);

        // Update if needed
        const nullCount = parseInt(countRes.rows[0].active_null);
        if (nullCount > 0) {
            console.log(`Found ${nullCount} products with NULL active status. Updating to TRUE...`);
            const updateRes = await client.query("UPDATE products SET active = true WHERE active IS NULL");
            console.log(`Updated ${updateRes.rowCount} rows.`);
        } else {
            console.log("No NULL active products found.");
        }

        // Check filtering query
        const testRes = await client.query('SELECT count(*) FROM products WHERE active = true');
        console.log(`Confirmed: Query 'WHERE active = true' returns ${testRes.rows[0].count} rows.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

fixActive();
