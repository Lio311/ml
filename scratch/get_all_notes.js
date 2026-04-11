const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function getAllNotes() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT top_notes, middle_notes, base_notes FROM products');
        const notes = new Set();
        res.rows.forEach(row => {
            [row.top_notes, row.middle_notes, row.base_notes].forEach(noteStr => {
                if (noteStr) {
                    noteStr.split(',').forEach(n => {
                        const trimmed = n.trim();
                        if (trimmed) notes.add(trimmed);
                    });
                }
            });
        });
        
        const sortedNotes = Array.from(notes).sort();
        console.log(JSON.stringify(sortedNotes, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getAllNotes();
