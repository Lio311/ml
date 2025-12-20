const { Pool } = require('pg');
require('dotenv').config({ path: './.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupInventoryDB() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB...");

    // 1. Create Inventory Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bottle_inventory (
        size INTEGER PRIMARY KEY,
        quantity INTEGER DEFAULT 0
      );
    `);

    // 2. Create Purchases Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bottle_purchases (
        id SERIAL PRIMARY KEY,
        size INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        purchase_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Seed Initial Inventory (if empty)
    const res = await client.query('SELECT COUNT(*) FROM bottle_inventory');
    if (parseInt(res.rows[0].count) === 0) {
      console.log("Seeding initial inventory...");
      await client.query(`
        INSERT INTO bottle_inventory (size, quantity) VALUES
        (2, 0),
        (5, 0),
        (10, 0),
        (11, 0)
        ON CONFLICT (size) DO NOTHING;
      `);
    }

    console.log("Inventory DB Setup Complete! 🧪");
    client.release();
  } catch (err) {
    console.error("Error setting up DB:", err);
  } finally {
    pool.end();
  }
}

setupInventoryDB();
