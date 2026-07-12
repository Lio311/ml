import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { email, phone, items, currentOrderId } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ hasDuplicates: false });
        }
        if (!email && !phone) {
            return NextResponse.json({ hasDuplicates: false });
        }

        const productIds = items.map(i => i.product_id || i.id).filter(id => id && !String(id).startsWith('bundle-'));
        if (productIds.length === 0) {
            return NextResponse.json({ hasDuplicates: false });
        }

        const client = await pool.connect();
        try {
            // Find past orders from this customer (excluding the current order)
            const query = `
                SELECT items FROM orders 
                WHERE id != $1 
                AND (
                    (customer_details->>'email' = $2 AND customer_details->>'email' != '') OR 
                    (customer_details->>'phone' = $3 AND customer_details->>'phone' != '')
                )
                AND status != 'cancelled'
            `;
            const res = await client.query(query, [currentOrderId, email || '', phone || '']);
            
            const pastItemIds = new Set();
            for (const row of res.rows) {
                if (row.items && Array.isArray(row.items)) {
                    for (const item of row.items) {
                        const pid = item.product_id || item.id;
                        if (pid && !String(pid).startsWith('bundle-')) {
                            pastItemIds.add(String(pid));
                        }
                    }
                }
            }

            const duplicateNames = [];
            for (const item of items) {
                const pid = String(item.product_id || item.id);
                if (pastItemIds.has(pid)) {
                    duplicateNames.push(item.name || `${item.brand} ${item.model}`);
                }
            }

            // Deduplicate names
            const uniqueNames = [...new Set(duplicateNames)];

            return NextResponse.json({ 
                hasDuplicates: uniqueNames.length > 0,
                duplicateNames: uniqueNames
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Check History Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
