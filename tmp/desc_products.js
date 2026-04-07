const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getProductsSchema() {
    const res = await pool.query("SELECT * FROM products LIMIT 1");
    console.log(Object.keys(res.rows[0]).join(', '));
    await pool.end();
}

getProductsSchema().catch(err => console.error(err));
