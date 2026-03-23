const { Pool } = require('pg');
const { translateText, translateList } = require('../app/lib/translate.js');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    try {
        const res = await pool.query('SELECT id, description, category, top_notes, middle_notes, base_notes, seasons FROM products WHERE id = 202');
        const p = res.rows[0];
        
        const descEnc = await translateText(p.description);
        const catEnc = translateList(p.category);
        const topEnc = translateList(p.top_notes);
        const midEnc = translateList(p.middle_notes);
        const baseEnc = translateList(p.base_notes);
        const seaEnc = translateList(p.seasons);

        await pool.query(
            `UPDATE products SET description_en = $1, category_en = $2, top_notes_en = $3, middle_notes_en = $4, base_notes_en = $5, seasons_en = $6 WHERE id = 202`,
            [descEnc, catEnc, topEnc, midEnc, baseEnc, seaEnc]
        );
        console.log('Fixed Product 202 successfully');
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
fix();
