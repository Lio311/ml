const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  try {
    const orderRes = await pool.query('SELECT id, customer_details FROM orders WHERE id = 201');
    if (orderRes.rows.length === 0) {
        console.error('Order not found');
        return;
    }

    const order = orderRes.rows[0];
    let customerDetails = order.customer_details || {};
    
    if (typeof customerDetails === 'string') {
        try {
            customerDetails = JSON.parse(customerDetails);
        } catch (e) {}
    }
    
    // Update the address in customerDetails
    customerDetails.address = {
        city: 'אכסאל',
        street: 'לעאדכן 5',
        houseNumber: '',
        apartment: '',
        notes: 'ת.ד 664'
    };

    // If customer_details is a JSON column, we pass the object directly in pg or use JSON.stringify
    await pool.query('UPDATE orders SET customer_details = $1 WHERE id = 201', [customerDetails]);
    console.log('Order 201 updated successfully');

    // Also update the user's address just to be safe
    const userRes = await pool.query("SELECT id FROM users WHERE email = '5555hade@gmail.com'");
    if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        await pool.query('UPDATE users SET address = $1 WHERE id = $2', [customerDetails.address, userId]);
        console.log('User address updated successfully');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
