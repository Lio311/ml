const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function findUntranslated() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, brand, model, description, top_notes, middle_notes, base_notes, 
                   description_en, top_notes_en, middle_notes_en, base_notes_en 
            FROM products 
            WHERE description_en ~ '[א-ת]' 
               OR top_notes_en ~ '[א-ת]' 
               OR middle_notes_en ~ '[א-ת]' 
               OR base_notes_en ~ '[א-ת]' 
            LIMIT 20
        `;
        const res = await client.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        client.release();
        await pool.end();
    }
}

findUntranslated().catch(err => console.error(err));
