const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function extract() {
    try {
        const prod = await pool.query("SELECT id, name, description, category, brand, top_notes, middle_notes, base_notes, seasons, country, perfumers FROM products");
        const brands = await pool.query("SELECT name, title, description, highlights, perfumer FROM brands");
        const blog = await pool.query("SELECT id, title, slug, excerpt, content, tags FROM blog_posts");
        
        const fs = require('fs');
        fs.writeFileSync('data_to_translate.json', JSON.stringify({
            products: prod.rows,
            brands: brands.rows,
            blog_posts: blog.rows
        }, null, 2));
        
        console.log("Data extracted to data_to_translate.json");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

extract();
