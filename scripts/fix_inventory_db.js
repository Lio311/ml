const { Pool } = require('pg');
require('dotenv').config({ path: './.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixInventoryDB() {
    try {
        const client = await pool.connect();
        console.log("Connected to DB...");

        // Insert 11 if not exists
        await client.query(`
      INSERT INTO bottle_inventory (size, quantity) 
      VALUES (11, 0)
      ON CONFLICT (size) DO NOTHING;
    `);

        // Also double check 2, 5, 10 just in case
        await client.query(`
        INSERT INTO bottle_inventory (size, quantity) VALUES
        (2, 0),
        (5, 0),
        (10, 0)
        ON CONFLICT (size) DO NOTHING;
      `);

        console.log("Inventory DB Fixed! (ID 11 guaranteed) 🧪");
        client.release();
    } catch (err) {
        console.error("Error fixing DB:", err);
    } finally {
        pool.end();
    }
}

fixInventoryDB();
