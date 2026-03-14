require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('ALTER TABLE user_catalogs ADD COLUMN IF NOT EXISTS self_pickup_active BOOLEAN DEFAULT false;');
    await client.query('ALTER TABLE user_catalogs ADD COLUMN IF NOT EXISTS delivery_active BOOLEAN DEFAULT false;');
    await client.query('ALTER TABLE user_catalogs ADD COLUMN IF NOT EXISTS delivery_price NUMERIC DEFAULT 0;');
    await client.query(`ALTER TABLE user_catalogs ADD COLUMN IF NOT EXISTS sample_tiers JSONB DEFAULT '[]'::jsonb;`);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
