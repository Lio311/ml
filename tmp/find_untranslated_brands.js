const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function findUntranslatedBrands() {
    const res = await pool.query(`
        SELECT name, title, description, highlights, perfumer 
        FROM brands 
        WHERE description_en ~ '[א-ת]' 
           OR description_en IS NULL 
           OR description_en = ''
           OR title_en ~ '[א-ת]'
           OR title_en IS NULL
           OR title_en = ''
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

findUntranslatedBrands().catch(err => console.error(err));
