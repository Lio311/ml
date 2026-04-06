import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail } from '@/app/lib/email';

export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // ==========================================
            // PHASE 1: GENERATE (Immediately post-order)
            // ==========================================
            const generateRes = await client.query(`
                SELECT id, customer_details, items
                FROM orders 
                WHERE status = 'completed' 
                AND created_at >= NOW() - INTERVAL '7 days'
            `);

            const orders = generateRes.rows;
            console.log(`[Recommendations Cron] Found ${orders.length} recently completed orders.`);

            let processedCount = 0;

            for (const order of orders) {
                const customer = order.customer_details || {};
                const clerkId = customer.clerk_id || 'guest_' + order.id;
                
                const existCheck = await client.query(`SELECT id FROM pending_recommendation_emails WHERE order_id = $1`, [order.id]);
                if (existCheck.rows.length > 0) continue;

                const items = order.items || [];
                const boughtProductIds = items.map(item => item.id);
                if (boughtProductIds.length === 0) continue;

                let avgPrice = 0;
                if (items.length > 0) {
                    const sum = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
                    avgPrice = sum / items.length;
                }

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

                    const price = parseFloat(p.price_5ml) || parseFloat(p.price_10ml) || 0;
                    const priceDiff = avgPrice > 0 ? Math.abs(price - avgPrice) : 0;
                    const pricePenalty = Math.floor(priceDiff / 50);

                    return {
                        id: p.id,
                        name: p.name,
                        brand: p.brand,
                        image_url: p.image_url,
                        price: price,
                        notes: [...pNotes].slice(0, 3).join(', '),
                        score: intersection - pricePenalty
                    };
                });

                candidates.sort((a, b) => b.score - a.score);
                const suggested = candidates.slice(0, 3);
                if (suggested.length === 0) continue;

                await client.query(`
                    INSERT INTO pending_recommendation_emails (user_id, order_id, suggested_products, status)
                    VALUES ($1, $2, $3, 'pending')
                `, [clerkId, order.id, JSON.stringify(suggested)]);

                processedCount++;
            }

            // ==========================================
            // PHASE 2: SEND (Approved & 30 days old)
            // ==========================================
            const sendRes = await client.query(`
                SELECT p.id, p.suggested_products, o.customer_details, o.id as order_id
                FROM pending_recommendation_emails p
                JOIN orders o ON p.order_id = o.id
                WHERE p.status = 'approved'
                AND o.created_at <= NOW() - INTERVAL '30 days'
            `);

            const readyToSend = sendRes.rows;
            console.log(`[Recommendations Cron] Found ${readyToSend.length} approved recommendations ready to send.`);

            let sentCount = 0;

            for (const rec of readyToSend) {
                const email = rec.customer_details?.email;
                const firstName = rec.customer_details?.first_name || 'לקוח';
                let suggestions = rec.suggested_products || [];
                
                if (!email) {
                    await client.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected_no_email', rec.id]);
                    continue;
                }

                if (typeof suggestions === 'string') {
                    try { suggestions = JSON.parse(suggestions); } catch(e) { suggestions = []; }
                }

                const mappedProductsHtml = suggestions.map(p => `
                    <div style="background: white; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="max-height: 150px; width: auto; margin-bottom: 10px;">` : ''}
                        <br>
                        <strong>${p.name}</strong> - ${p.brand}<br>
                        <span style="color: #666; font-size: 14px;">תווים דומים: ${p.notes}</span>
                    </div>
                `).join('');

                const subject = 'במיוחד בשבילך... המלצות ניחוחות שמחכות לך ✨';
                const html = `
                    <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right;">
                        <h2>שלום ${firstName}!</h2>
                        <p>עבר קצת זמן מאז ההזמנה האחרונה שלך, וכבר למדנו קצת על הטעם האישי שלך.</p>
                        <p>צוות המומחים שלנו והמערכת החכמה שלנו איתרו במיוחד עבורך כמה בשמים שמבוססים על תווי הריח שאתה אוהב שכדאי לך להכיר:</p>
                        
                        <div style="background: #fdfaf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            ${mappedProductsHtml}
                        </div>

                        <p>כל הניחוחות זמינים כדוגמיות להתנסות אצלנו באתר.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://www.ml-tlv.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                למעבר לאתר &gt;&gt;
                            </a>
                        </div>
                    </div>
                `;

                try {
                    await sendEmail(email, subject, html, 'recommendations', rec.order_id);
                    await client.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['sent', rec.id]);
                    sentCount++;
                } catch (err) {
                    console.error(`Failed to send recommendation email to ${email}:`, err);
                }
            }

            return NextResponse.json({ success: true, processed: processedCount, sent: sentCount });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Recommendations Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
