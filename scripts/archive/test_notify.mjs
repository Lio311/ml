import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testNotify() {
    const client = await pool.connect();
    try {
        const productRes = await client.query('UPDATE products SET is_preorder = false WHERE name ILIKE \'%mango%\' RETURNING *');
        console.log(productRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

testNotify();
