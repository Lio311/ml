const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const updates = [
    { slug: 'guide-perfume-decants-samples', image_url: '/images/blog/decants-guide.png' },
    { slug: 'best-niche-perfumes-summer-israel-2026', image_url: '/images/blog/summer-2026.png' },
    { slug: 'edp-vs-edt-vs-extrait-guide', image_url: '/images/blog/edp-edt-guide.png' },
    { slug: 'israel-fragrance-trends-2025-data', image_url: '/images/blog/trends-data.png' }
];

async function main() {
    const client = await pool.connect();
    try {
        for (const update of updates) {
            const res = await client.query(
                'UPDATE blog_posts SET image_url = $1 WHERE slug = $2',
                [update.image_url, update.slug]
            );
            console.log(`✅ Updated image for: ${update.slug} (${res.rowCount} rows)`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        process.exit();
    }
}

main();
