const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkId74() {
    const res = await pool.query("SELECT description_en FROM products WHERE id = 74");
    console.log(JSON.stringify(res.rows[0], null, 2));
    await pool.end();
}

checkId74().catch(err => console.error(err));
