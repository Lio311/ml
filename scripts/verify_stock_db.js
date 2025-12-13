require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testStock() {
    if (!process.env.DATABASE_URL) { require('dotenv').config(); }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
        // 1. Insert product with stock directly to DB safely
        const insertRes = await client.query(`
      INSERT INTO products (name, brand, model, category, stock)
      VALUES ('Test Stock Product', 'TEST', 'v1', 'General', 555)
      RETURNING id, stock;
    `);
        console.log('✅ Direct DB Insert:', insertRes.rows[0]);

        // 2. Fetch it back
        const fetchRes = await client.query('SELECT stock FROM products WHERE id = $1', [insertRes.rows[0].id]);
        console.log('✅ Fetched Stock:', fetchRes.rows[0].stock);

        // 3. Clean up
        await client.query('DELETE FROM products WHERE id = $1', [insertRes.rows[0].id]);
        console.log('✅ Cleaned up test product.');

    } catch (err) {
        console.error('❌ Test Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}
testStock();
