const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getCategories() {
    const res = await pool.query("SELECT DISTINCT category FROM products WHERE active = true");
    const cats = new Set();
    res.rows.forEach(r => {
        if(r.category) r.category.split(',').forEach(c => cats.add(c.trim()));
    });
    console.log(Array.from(cats));
    await pool.end();
}

getCategories().catch(err => console.error(err));
