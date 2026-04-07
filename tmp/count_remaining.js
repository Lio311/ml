const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getRemainingCount() {
    const res = await pool.query("SELECT COUNT(*) FROM products WHERE (description_en ~ '[א-ת]' OR description_en = '' OR description_en IS NULL) AND active = true");
    console.log(res.rows[0].count);
    await pool.end();
}

getRemainingCount().catch(err => console.error(err));
