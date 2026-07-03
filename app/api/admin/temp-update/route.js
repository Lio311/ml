import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const client = await pool.connect();
    try {
        const orderRes = await client.query('SELECT id, customer_details FROM orders WHERE id = 201');
        if (orderRes.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' });
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
        await client.query('UPDATE orders SET customer_details = $1 WHERE id = 201', [customerDetails]);

        // Also update the user's address just to be safe
        const userRes = await client.query("SELECT id FROM users WHERE email = '5555hade@gmail.com'");
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            await client.query('UPDATE users SET address = $1 WHERE id = $2', [customerDetails.address, userId]);
        }

        return NextResponse.json({ success: true, customerDetails });
    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
