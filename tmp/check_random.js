const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkRandom() {
    const res = await pool.query("SELECT id, brand, model, description_en FROM products WHERE active = true LIMIT 10 OFFSET 30");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

checkRandom().catch(err => console.error(err));
