import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Find completed orders exactly 30 days ago
            const res = await client.query(`
                SELECT id, customer_details, items
                FROM orders 
                WHERE status = 'completed' 
                AND created_at >= NOW() - INTERVAL '31 days'
                AND created_at < NOW() - INTERVAL '30 days'
            `);

            const orders = res.rows;
            console.log(`[Recommendations Cron] Found ${orders.length} eligible orders 30 days old.`);

            if (orders.length === 0) {
                return NextResponse.json({ success: true, count: 0 });
            }

            let processed = 0;

            for (const order of orders) {
                const customer = order.customer_details || {};
                const clerkId = customer.clerk_id || 'guest_' + order.id;
                
                // Ensure we don't duplicate
                const existCheck = await client.query(`SELECT id FROM pending_recommendation_emails WHERE order_id = $1`, [order.id]);
                if (existCheck.rows.length > 0) continue;

                // 1. Gather all product IDs from the order
                const items = order.items || [];
                const boughtProductIds = items.map(item => item.id);
                if (boughtProductIds.length === 0) continue;

                // Calculate average price of bought items (approximate user's budget range)
                let avgPrice = 0;
                if (items.length > 0) {
                    const sum = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
                    avgPrice = sum / items.length;
                }

                // 2. Fetch Notes from those products
                const boughtProducts = await client.query(`
                    SELECT top_notes, middle_notes, base_notes
                    FROM products 
                    WHERE id = ANY($1)
                `, [boughtProductIds]);

                const userNotes = new Set();
                boughtProducts.rows.forEach(p => {
                    [...(p.top_notes || '').split(','), 
                     ...(p.middle_notes || '').split(','), 
                     ...(p.base_notes || '').split(',')].forEach(n => {
                        const note = n.trim();
                        if (note) userNotes.add(note);
                     });
                });

                // 3. Find 3-5 similar products NOT in the original order
                // Only active products
                const allOtherProducts = await client.query(`
                    SELECT id, name, brand, image_url, top_notes, middle_notes, base_notes, price_5ml, price_10ml
                    FROM products 
                    WHERE active = true 
                    AND NOT (id = ANY($1))
                `, [boughtProductIds]);

                let candidates = allOtherProducts.rows.map(p => {
                    const pNotes = new Set([
                        ...(p.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                        ...(p.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                        ...(p.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
                    ]);
                    
                    let intersection = 0;
                    pNotes.forEach(note => {
                        if (userNotes.has(note)) intersection++;
                    });

                    // Price similarity penalty
                    const price = parseFloat(p.price_5ml) || parseFloat(p.price_10ml) || 0;
                    const priceDiff = avgPrice > 0 ? Math.abs(price - avgPrice) : 0;
                    // Lower score if price diff is high. Let's simple penalty: -1 point for every 50 NIS diff
                    const pricePenalty = Math.floor(priceDiff / 50);

                    return {
                        id: p.id,
                        name: p.name,
                        brand: p.brand,
                        image_url: p.image_url,
                        price: price, // For display
                        notes: [...pNotes].slice(0, 3).join(', '),
                        score: intersection - pricePenalty
                    };
                });

                // Sort by score DESC
                candidates.sort((a, b) => b.score - a.score);

                // Take top 3
                const suggested = candidates.slice(0, 3);
                
                if (suggested.length === 0) continue;

                // 4. Save to pending_recommendation_emails table
                await client.query(`
                    INSERT INTO pending_recommendation_emails (user_id, order_id, suggested_products, status)
                    VALUES ($1, $2, $3, 'pending')
                `, [clerkId, order.id, JSON.stringify(suggested)]);

                processed++;
            }

            return NextResponse.json({ success: true, processed });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Recommendations Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
