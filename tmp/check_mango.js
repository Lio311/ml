const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getMango() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, brand, model, seasons, seasons_en, top_notes, top_notes_en, middle_notes, middle_notes_en, base_notes, base_notes_en 
            FROM products 
            WHERE slug = 'elixir-priv-mango-white'
        `;
        const res = await client.query(query);
        console.log(JSON.stringify(res.rows[0], null, 2));
    } finally {
        client.release();
        await pool.end();
    }
}

getMango().catch(err => console.error(err));
