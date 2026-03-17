const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function repair() {
    const client = await pool.connect();
    try {
        console.log('Repairing reviews table schema...');
        
        // Add content, order_id, is_public if they don't exist
        await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS content TEXT');
        await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id)');
        await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE');
        await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5');
        
        console.log('Successfully repaired reviews table.');
    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

repair();
