const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupBlogDB() {
    const client = await pool.connect();
    try {
        console.log('Creating blog_posts table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                image_url TEXT,
                tags TEXT[],
                published_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Verification: Checking table creation...');
        const res = await client.query("SELECT to_regclass('public.blog_posts');");
        if (res.rows[0].to_regclass) {
            console.log('✅ Table blog_posts exists.');
        } else {
            console.error('❌ Failed to create table.');
        }

    } catch (err) {
        console.error('Error setting up blog DB:', err);
    } finally {
        client.release();
        pool.end();
    }
}

setupBlogDB();
