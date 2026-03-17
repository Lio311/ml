const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function repairUsersTable() {
    const client = await pool.connect();
    try {
        console.log('Finalizing users table repair...');
        
        // 1. Fill any existing NULLs in created_at/updated_at
        await client.query("UPDATE users SET created_at = NOW() WHERE created_at IS NULL");
        await client.query("UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL");
        
        // 2. Add defaults if they don't exist (robust approach)
        await client.query("ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW()");
        await client.query("ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW()");
        
        // 3. Ensure NOT NULL constraints
        await client.query("ALTER TABLE users ALTER COLUMN created_at SET NOT NULL");
        // updated_at can be null in some schemas, but for us we want it not null
        await client.query("ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL");

        console.log('Users table constraints enforced successfully.');
        
        // 4. Verify reviews table user_id
        console.log('Verifying reviews table...');
        const reviewsRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'user_id'
        `);
        
        if (reviewsRes.rows.length === 0) {
            console.log('Adding missing user_id to reviews...');
            await client.query("ALTER TABLE reviews ADD COLUMN user_id TEXT");
            console.log('user_id added to reviews.');
        } else {
            console.log('user_id already exists in reviews.');
        }

    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

repairUsersTable();
