import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate } from '@/app/lib/email';

export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Find completed orders created between 3 and 4 days ago
            const res = await client.query(`
                SELECT id, customer_details 
                FROM orders 
                WHERE status = 'completed' 
                AND educational_email_sent = false
                AND created_at >= NOW() - INTERVAL '4 days'
                AND created_at < NOW() - INTERVAL '3 days'
            `);

            const orders = res.rows;
            console.log(`[Educational Cron] Found ${orders.length} eligible orders.`);

            if (orders.length === 0) {
                return NextResponse.json({ success: true, count: 0 });
            }

            let processed = 0;

            for (const order of orders) {
                const customer = order.customer_details || {};
                const email = customer.email;
                const firstName = customer.first_name || 'לקוח';

                if (!email) continue;

                const { html, subject } = await getTemplate('educational', 
                    { name: firstName, orderId: order.id },
                    () => {
                        return `
                        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: right;">
                            <h2>היי ${firstName},</h2>
                            <p>עברו כמה ימים מאז שקיבלת את ההזמנה שלך (מספר ${order.id})! אנחנו מקווים שאתה כבר נהנה מהניחוחות החדשים.</p>
                            
                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #111827;">💡 טיפים לשימוש נכון בבושם:</h3>
                                <ul style="margin-bottom: 0;">
                                    <li style="margin-bottom: 10px;"><strong>הנקודות החמות:</strong> רסס על נקודות הדופק - צוואר, מפרקי הידיים, ואפילו מאחורי הברכיים.</li>
                                    <li style="margin-bottom: 10px;"><strong>לא לשפשף!</strong> שפשוף הבושם לאחר הריסוס "שובר" את מולקולות הריח ומשנה את התפתחות הניחוח.</li>
                                    <li style="margin-bottom: 10px;"><strong>לחות:</strong> בושם מחזיק מעמד טוב יותר על עור לח. מומלץ להשתמש בקרם גוף ללא ריח לפני הריסוס.</li>
                                    <li style="margin-bottom: 0;"><strong>אחסון:</strong> שמור את הבשמים במקום קריר ומוצל בחדר, ולא בחדר האמבטיה שבו יש שינויי טמפרטורה ולחות.</li>
                                </ul>
                            </div>
                            
                            <p>אם יש לך שאלות או שאתה רוצה להתייעץ לגבי הבושם הבא שלך, אנחנו כאן תמיד!</p>
                            <p>באהבה,<br>צוות ml_tlv</p>
                        </div>`;
                    }
                );

                try {
                    await sendEmail(email, subject, html, 'educational', order.id);

                    await client.query(`
                        UPDATE orders 
                        SET educational_email_sent = true 
                        WHERE id = $1
                    `, [order.id]);

                    processed++;
                } catch (err) {
                    console.error(`Failed to send educational email to ${email}:`, err);
                }
            }

            return NextResponse.json({ success: true, processed });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Educational Email Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
