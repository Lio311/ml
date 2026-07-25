import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { getAutomationConfig } from '@/app/lib/automationConfig';

import { checkCronOrAdmin } from "@/app/lib/admin";

export async function GET(req) {
    const isAuthorized = await checkCronOrAdmin(req);
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            const config = await getAutomationConfig('educational_email');
            const delayDays = config.delay_days || 3;

            // Find completed orders created between delayDays and delayDays+1 days ago
            // Ensure we haven't already sent an educational email to this user in a previous order
            await client.query('BEGIN');
            const res = await client.query(`
                UPDATE orders o1
                SET educational_email_sent = true
                WHERE id IN (
                    SELECT id 
                    FROM orders sub
                    WHERE status = 'completed' 
                    AND educational_email_sent = false
                    AND created_at >= NOW() - INTERVAL '${delayDays + 1} days'
                    AND created_at < NOW() - INTERVAL '${delayDays} days'
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM orders o2 
                        WHERE o2.customer_details->>'email' = sub.customer_details->>'email'
                        AND o2.educational_email_sent = true
                    )
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id, customer_details
            `);
            await client.query('COMMIT');

            const orders = res.rows;
            console.log(`[Educational Cron] Found ${orders.length} eligible orders.`);

            let processed = 0;
            if (orders.length > 0) {
                const processedEmails = new Set();

                for (const order of orders) {
                    const customer = order.customer_details || {};
                    const email = customer.email;
                    const firstName = customer.first_name || 'לקוח';

                    if (!email) continue;
                    
                    if (processedEmails.has(email)) continue;

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

                        processedEmails.add(email);
                        processed++;
                    } catch (err) {
                        console.error(`Failed to send educational email to ${email}:`, err);
                    }
                }
            }

            // Update workflow last_run for visual sync
            await client.query(`
                UPDATE workflows 
                SET last_run = NOW(), total_runs = total_runs + $1 
                WHERE name = 'מייל חינוכי (טיפים לשימוש בבושם)'
            `, [processed]);

            return NextResponse.json({ success: true, processed });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Educational Email Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
