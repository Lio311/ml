import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // 1. Clear existing sales data (re-calculating from scratch is safer for consistency)
            await client.query('DELETE FROM product_sales');

            // 2. Fetch all non-cancelled orders
            const ordersRes = await client.query(`
                SELECT items FROM orders WHERE status != 'cancelled'
            `);

            // 3. Aggregate sales
            const salesMap = {}; // productId -> count

            ordersRes.rows.forEach(order => {
                const items = order.items; // JSONB array
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        if (item.id) {
                            // Convert to int just in case
                            const pid = parseInt(item.id);
                            const qty = parseInt(item.quantity) || 1;

                            if (salesMap[pid]) {
                                salesMap[pid] += qty;
                            } else {
                                salesMap[pid] = qty;
                            }
                        }
                    });
                }
            });

            // 4. Insert into DB
            // Using a loop for simplicity, batch insert would be better for huge datasets but fine for now.
            for (const [pid, count] of Object.entries(salesMap)) {
                await client.query(`
                    INSERT INTO product_sales (product_id, sales_count)
                    VALUES ($1, $2)
                `, [pid, count]);
            }

            return NextResponse.json({
                success: true,
                message: `Synced sales for ${Object.keys(salesMap).length} products.`
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Sync Sales Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
