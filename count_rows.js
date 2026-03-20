const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function count() {
    try {
        const prod = await pool.query("SELECT COUNT(*) FROM products");
        const brands = await pool.query("SELECT COUNT(*) FROM brands");
        const blog = await pool.query("SELECT COUNT(*) FROM blog_posts");
        
        console.log(`Products: ${prod.rows[0].count}`);
        console.log(`Brands: ${brands.rows[0].count}`);
        console.log(`Blog Posts: ${blog.rows[0].count}`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

count();
