const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function repair() {
    const client = await pool.connect();
    try {
        console.log('Auditing reviews table...');
        
        // 1. Ensure user_id column exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_id') THEN
                    ALTER TABLE reviews ADD COLUMN user_id VARCHAR(255);
                END IF;
            END $$;
        `);

        // 2. Ensure created_at has default
        await client.query("ALTER TABLE reviews ALTER COLUMN created_at SET DEFAULT NOW()");
        
        console.log('Successfully repaired reviews table.');
    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

repair();
