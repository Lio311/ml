const pool = require('./app/lib/db');

async function checkStockColumn() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'stock';
    `);

        if (res.rows.length > 0) {
            console.log('✅ Stock column exists:', res.rows[0]);
        } else {
            console.log('❌ Stock column matches NO records.');
        }

        // Also check a product to see if it has stock value
        const productRes = await client.query('SELECT id, name, stock FROM products LIMIT 5');
        console.log('Sample Products:', productRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
    }
}

checkStockColumn();
