const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding rating column to reviews table...');
        await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5');
        console.log('Successfully added rating column.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
