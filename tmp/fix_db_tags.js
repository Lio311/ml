const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function fixTags() {
    try {
        const res = await pool.query('SELECT id, tags FROM blog_posts');
        for (const post of res.rows) {
            if (post.tags && Array.isArray(post.tags)) {
                const newTags = post.tags.map(tag => tag === 'ML_TLV' ? 'ml_tlv' : tag);
                if (JSON.stringify(newTags) !== JSON.stringify(post.tags)) {
                    await pool.query('UPDATE blog_posts SET tags = $1 WHERE id = $2', [newTags, post.id]);
                    console.log(`Updated tags for post ID ${post.id}`);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixTags();
