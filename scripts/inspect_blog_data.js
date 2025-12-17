const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT slug, title, image_url, content FROM blog_posts LIMIT 1');
        const row = res.rows[0];
        console.log('--- DB Row Check ---');
        console.log('Slug:', row.slug);
        console.log('Image URL:', row.image_url);
        console.log('Content Preview:', row.content.substring(0, 300));

        // Check if content contains image tags
        const imgMatch = row.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            console.log('Embedded Image Src:', imgMatch[1]);
        } else {
            console.log('No embedded images found in first 300 chars (might be further down).');
            const fullMatch = row.content.match(/<img[^>]+src="([^">]+)"/);
            console.log('Any embedded image?', fullMatch ? fullMatch[1] : 'NONE');
        }

    } finally {
        client.release();
        pool.end();
    }
}

check();
