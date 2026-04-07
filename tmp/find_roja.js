const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function findProduct() {
    const res = await pool.query("SELECT id, slug, description_en, description_he FROM products WHERE slug = 'roja-amber-aoud-absolue-precieux'");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

findProduct().catch(err => console.error(err));
