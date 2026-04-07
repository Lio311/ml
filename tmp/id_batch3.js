const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function findBatch3() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, brand, model, description, top_notes, middle_notes, base_notes 
            FROM products 
            WHERE (description_en ~ '[א-ת]' OR description_en = '' OR description_en IS NULL) 
              AND active = true 
            LIMIT 10 OFFSET 16
        `;
        const res = await client.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        client.release();
        await pool.end();
    }
}

findBatch3().catch(err => console.error(err));
