import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { sendEmail } from '../../../lib/email';
import { generateProductsGrid, monthsHe } from '../../../lib/monthlyRecommendationEmail';
import { checkCronOrAdmin } from "@/app/lib/admin";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const isAuthorized = await checkCronOrAdmin(req);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const year = now.getFullYear();
        const monthNum = now.getMonth() + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        const currentMonth = `${year}-${monthStr}`;
        const day = now.getDate();

        // 1. Get or create current month's record
        let res = await pool.query('SELECT * FROM monthly_recommendations WHERE month = $1', [currentMonth]);
        let record = res.rows[0];

        if (!record) {
            const insertRes = await pool.query(`
                INSERT INTO monthly_recommendations (month, perfume_ids, status) 
                VALUES ($1, $2, $3) RETURNING *
            `, [currentMonth, JSON.stringify([]), 'pending']);
            record = insertRes.rows[0];
        }

        const targetDay = record.send_at ? new Date(record.send_at).getDate() : 16;
        const reminderDays = [targetDay - 7, targetDay - 5, targetDay - 2];
        const skipDay = targetDay - 1;

        // 2. Manager Reminders (X-7, X-5, X-2) at 12:00 UTC
        if (now.getUTCHours() === 12 && reminderDays.includes(day) && record.status === 'pending') {
            const templateRes = await pool.query("SELECT * FROM email_templates WHERE slug = 'admin_monthly_recommendation_reminder'");
            if (templateRes.rows.length > 0) {
                const template = templateRes.rows[0];
                const html = template.content_html.replace(/\{\{month\}\}/g, monthsHe[monthNum - 1]);
                const subject = template.subject.replace(/\{\{month\}\}/g, monthsHe[monthNum - 1]);
                
                await sendEmail(
                    'lior31197@gmail.com',
                    subject,
                    html,
                    'system',
                    null,
                    null,
                    [],
                    true
                );
            }
            return NextResponse.json({ message: 'Reminder sent to manager' });
        }

        // 3. Skip if not selected by X-1 at 12:00 UTC
        if (now.getUTCHours() === 12 && day === skipDay && record.status === 'pending') {
            await pool.query('UPDATE monthly_recommendations SET status = $1 WHERE id = $2', ['skipped', record.id]);
            return NextResponse.json({ message: 'Month skipped due to no selection' });
        }

        // 4. Send Newsletter
        const url = new URL(req.url);
        const forceSend = url.searchParams.get('force') === 'true';
        
        let isSendDay = false;
        if (record.send_at) {
            const sendAtTime = new Date(record.send_at).getTime();
            if (now.getTime() >= sendAtTime) {
                isSendDay = true;
            }
        } else {
            // Default schedule: 16th at 12:00 UTC
            if (day === 16 && now.getUTCHours() === 12) {
                isSendDay = true;
            }
        }
        
        if (forceSend) isSendDay = true;
        
        if (isSendDay && record.status === 'selected') {
            const productsRes = await pool.query(
                'SELECT id, name, brand, image_url, COALESCE(price_2ml, single_price) AS price FROM products WHERE id = ANY($1)',
                [record.perfume_ids]
            );
            const products = productsRes.rows;

            if (products.length > 0) {
                const couponCode = 'MANAGER10'; 
                
                // Create or update the coupon MANAGER10 to be valid for 2 days and only on these products
                const limitations = {
                    allowed_products: record.perfume_ids
                };
                await pool.query(`
                    INSERT INTO coupons (code, discount_percent, expires_at, status, limitations)
                    VALUES ($1, $2, NOW() + INTERVAL '2 days', 'active', $3)
                    ON CONFLICT (code) DO UPDATE 
                    SET discount_percent = EXCLUDED.discount_percent,
                        expires_at = EXCLUDED.expires_at,
                        status = EXCLUDED.status,
                        limitations = EXCLUDED.limitations
                `, [couponCode, 10, JSON.stringify(limitations)]);
                
                const templateRes = await pool.query("SELECT * FROM email_templates WHERE slug = 'monthly_recommendation'");
                let html = '';
                let subject = 'המלצת החודש של מנהל האתר';
                if (templateRes.rows.length > 0) {
                    const template = templateRes.rows[0];
                    html = template.content_html
                        .replace(/\{\{month\}\}/g, monthsHe[monthNum - 1])
                        .replace(/\{\{productsHtml\}\}/g, generateProductsGrid(products))
                        .replace(/\{\{couponCode\}\}/g, couponCode);
                    subject = template.subject.replace(/\{\{month\}\}/g, monthsHe[monthNum - 1]);
                } else {
                    return NextResponse.json({ error: 'Email template not found' }, { status: 500 });
                }
                
                // Get all subscribers
                const subRes = await pool.query('SELECT email FROM users WHERE email IS NOT NULL');
                const subscriberEmails = subRes.rows.map(r => r.email);

                if (subscriberEmails.length > 0) {
                    await sendEmail(
                        subscriberEmails,
                        subject,
                        html,
                        'recommendations'
                    );
                }

                // Update status to sent
                await pool.query('UPDATE monthly_recommendations SET status = $1 WHERE id = $2', ['sent', record.id]);
                return NextResponse.json({ message: `Newsletter sent to ${subscriberEmails.length} subscribers` });
            }
        }

        return NextResponse.json({ message: 'No action required today' });
    } catch (error) {
        console.error('Error in monthly recommendation cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
