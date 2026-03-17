const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const client = await pool.connect();
    try {
        console.log('Checking reviews table...');
        const res = await client.query(`
            SELECT EXISTS (
               SELECT FROM information_schema.tables 
               WHERE  table_schema = 'public'
               AND    table_name   = 'reviews'
            );
        `);
        console.log('Reviews table exists:', res.rows[0].exists);
        
        if (res.rows[0].exists) {
            const columns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'reviews'
            `);
            console.log('Columns in reviews table:', columns.rows);
        } else {
            console.log('Creating reviews table...');
            await client.query(`
                CREATE TABLE reviews (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255),
                    order_id INTEGER REFERENCES orders(id),
                    content TEXT,
                    rating INTEGER DEFAULT 5,
                    is_public BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('Successfully created reviews table.');
        }
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
