require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const corrections = [
    {
        dbNamePattern: 'Goti Alchemico Visione 2 Acqua',
        notesName: 'Alchemico Acqua (Water)',
        top: "ג'ינג'ר, ילאנג ילאנג",
        middle: "פרח טיארה, תווים ימיים",
        base: "אצות ים, מאסק"
    },
    {
        dbNamePattern: 'Goti Alchemico Visione 2 Fuoco',
        notesName: 'Alchemico Fuoco (Fire)',
        top: "עשן, שרף",
        middle: "תבלינים חריפים, פלפל",
        base: "שרפים חמים, עץ שרוף"
    }
];

async function fixGoti() {
    const client = await pool.connect();
    try {
        for (const item of corrections) {
            console.log(`Fixing ${item.dbNamePattern}...`);
            const res = await client.query(
                `UPDATE products 
                 SET top_notes = $1, middle_notes = $2, base_notes = $3
                 WHERE name ILIKE $4
                 RETURNING id, name`,
                [item.top, item.middle, item.base, `%${item.dbNamePattern}%`]
            );

            if (res.rowCount > 0) {
                console.log(`✅ Updated: ${res.rows[0].name}`);
            } else {
                console.log(`❌ Not found: ${item.dbNamePattern}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

fixGoti();
