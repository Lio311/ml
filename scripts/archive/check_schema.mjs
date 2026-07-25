import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL });

async function query() {
    try {
        const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'`);
        console.log(res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
query();
