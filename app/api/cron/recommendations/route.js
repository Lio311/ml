import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { generateRecommendationForOrder } from '@/app/lib/recommendations';
import { getAutomationConfig } from '@/app/lib/automationConfig';

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

                const result = await generateRecommendationForOrder(client, order.id, clerkId);
                if (result) processedCount++;
            }

            // ==========================================
            // PHASE 2: SEND (Approved & delay_days old)
            // ==========================================
            const sendConfig = await getAutomationConfig('recommendations_send');
            const sendDelay = sendConfig.delay_days || 30;

            const sendRes = await client.query(`
                SELECT p.id, p.suggested_products, o.customer_details, o.id as order_id
                FROM pending_recommendation_emails p
                JOIN orders o ON p.order_id = o.id
                WHERE p.status = 'approved'
                AND o.created_at <= NOW() - INTERVAL '${sendDelay} days'
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

                const mappedProductsHtml = suggestions.map(p => {
                    const imageUrl = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com'}${p.image_url.startsWith('/') ? '' : '/'}${p.image_url}`) : '';
                    return `
                    <div style="background: white; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${p.name}" style="max-height: 150px; width: auto; margin-bottom: 10px;">` : ''}
                        <br>
                        <strong>${p.name}</strong> - ${p.brand}<br>
                        <span style="color: #666; font-size: 14px;">תווים דומים: ${p.notes}</span>
                    </div>
                `}).join('');

                const { html, subject } = await getTemplate('recommendations', 
                    { name: firstName, productsHtml: mappedProductsHtml },
                    () => {
                        return `
                        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right;">
                            <h2>שלום ${firstName}!</h2>
                            <p>עבדנו קצת על הטעם האישי שלך והכנו לך המלצות מיוחדות מבוססות על הרכישות הקודמות שלך:</p>
                            <div style="background: #fdfaf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                ${mappedProductsHtml}
                            </div>
                            <p>כל הניחוחות זמינים כדוגמיות להתנסות אצלנו באתר.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://www.ml-tlv.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                    למעבר לאתר >>
                                </a>
                            </div>
                        </div>`;
                    }
                );

                try {
                    await sendEmail(email, subject, html, 'recommendations', rec.order_id);
                    await client.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['sent', rec.id]);
                    sentCount++;
                } catch (err) {
                    console.error(`Failed to send recommendation email to ${email}:`, err);
                }
            }

            // Update workflow last_run for visual sync
            await client.query(`
                UPDATE workflows 
                SET last_run = NOW(), total_runs = total_runs + $1 
                WHERE name = 'המלצות בשמים מותאמות אישית'
            `, [sent]);

            return NextResponse.json({ success: true, processed: processedCount, sent: sentCount });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Recommendations Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
