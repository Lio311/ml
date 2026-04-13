import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail } from '@/app/lib/email';
import { generateReviewToken } from '@/app/lib/reviewToken';

export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Find completed orders created between 7 and 8 days ago
            const res = await client.query(`
                SELECT id, customer_details, items
                FROM orders 
                WHERE status = 'completed' 
                AND review_email_sent = false
                AND created_at >= NOW() - INTERVAL '8 days'
                AND created_at < NOW() - INTERVAL '7 days'
            `);

            const orders = res.rows;
            console.log(`[Review Cron] Found ${orders.length} eligible orders.`);

            if (orders.length === 0) {
                return NextResponse.json({ success: true, count: 0 });
            }

            let processed = 0;

            for (const order of orders) {
                const customer = order.customer_details || {};
                const email = customer.email;
                const firstName = customer.first_name || 'לקוח';

                if (!email) continue;
                
                const items = order.items || [];
                const firstProductName = items.length > 0 ? items[0].name : "הבשמים שלנו";
                const token = generateReviewToken(order.id);

                // Check if user already received a coupon for any other order
                const rewardedCheck = await client.query(`
                    SELECT 1 FROM orders 
                    WHERE (customer_details->>'email' = $1 OR customer_details->>'clerk_id' = $2) 
                    AND coupon_rewarded = true 
                    LIMIT 1
                `, [email, customer.clerk_id]);
                const alreadyRewarded = rewardedCheck.rows.length > 0;

                const { html, subject } = await getTemplate('review_request', 
                    { name: firstName, orderId: order.id },
                    () => {
                        // Fallback static template (matching what was there before)
                        return `
                        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: right;">
                            <h2 style="color: #111827;">שלום ${firstName},</h2>
                            <p>ראינו שקיבלת לא מזמן את ההזמנה האחרונה שלך מאיתנו ואנחנו סקרנים לדעת איך הייתה חוויית השירות שלך איתנו!</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://www.ml-tlv.com/review?id=${order.id}&token=${token}" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                    לדירוג חוויית השירות בקליק >>
                                </a>
                            </div>
                            ${!alreadyRewarded ? `
                            <p style="text-align: center; color: #d97706; font-weight: bold; background: #fef3c7; padding: 10px; border-radius: 6px;">
                                🎁 בונוס קטן: על כל דירוג שתשאיר/י באתר, נשלח אליך למייל קופון של 10% הנחה לקנייה הבאה!
                            </p>` : ''}
                            <p>תודה מראש,<br>צוות ml_tlv</p>
                        </div>`;
                    }
                );

                try {
                    await sendEmail(email, subject, html, 'review_request', order.id);

                    await client.query(`
                        UPDATE orders 
                        SET review_email_sent = true 
                        WHERE id = $1
                    `, [order.id]);

                    processed++;
                } catch (err) {
                    console.error(`Failed to send review email to ${email}:`, err);
                }
            }

            return NextResponse.json({ success: true, processed });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Review Email Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
