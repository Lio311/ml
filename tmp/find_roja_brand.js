const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function findRojaBrand() {
    const res = await pool.query("SELECT name, title, description, highlights, perfumer, title_en, description_en, highlights_en, perfumer_en FROM brands WHERE name ILIKE 'Roja%'");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

findRojaBrand().catch(err => console.error(err));
