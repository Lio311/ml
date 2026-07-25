import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function fixDbPadding() {
    try {
        const res = await pool.query('SELECT key, value FROM settings WHERE value LIKE \'%padding: 30px 0;%\'');
        console.log(`Found ${res.rows.length} templates to update in DB.`);
        
        for (const row of res.rows) {
            const newValue = row.value.replace(/padding:\s*30px\s*0;/g, 'padding-top: 15px; padding-bottom: 0;');
            await pool.query('UPDATE settings SET value = $1 WHERE key = $2', [newValue, row.key]);
            console.log(`Updated key: ${row.key}`);
        }
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fixDbPadding();
