const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkAndFixDB() {
    try {
        const res = await pool.query('SELECT id, title, content, excerpt FROM blog_posts');
        for (const post of res.rows) {
            let updated = false;
            let newTitle = post.title;
            let newContent = post.content;
            let newExcerpt = post.excerpt;

            if (post.title.includes('ML_TLV')) {
                newTitle = post.title.replace(/ML_TLV/g, 'ml_tlv');
                updated = true;
            }
            if (post.content.includes('ML_TLV')) {
                newContent = post.content.replace(/ML_TLV/g, 'ml_tlv');
                updated = true;
            }
            if (post.excerpt.includes('ML_TLV')) {
                newExcerpt = post.excerpt.replace(/ML_TLV/g, 'ml_tlv');
                updated = true;
            }

            if (updated) {
                await pool.query('UPDATE blog_posts SET title = $1, content = $2, excerpt = $3 WHERE id = $4', [newTitle, newContent, newExcerpt, post.id]);
                console.log(`Updated post ID ${post.id}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkAndFixDB();
