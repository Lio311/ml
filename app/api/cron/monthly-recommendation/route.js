import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { sendEmail } from '../../../../lib/email';
import { getMonthlyRecommendationTemplate, getManagerReminderTemplate } from '../../../../lib/monthlyRecommendationEmail';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Uncomment in production to secure the cron
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        // 2. Manager Reminders (15, 20, 25)
        if ((day === 15 || day === 20 || day === 25) && record.status === 'pending') {
            const html = getManagerReminderTemplate(currentMonth);
            await sendEmail(
                'lior31197@gmail.com',
                `תזכורת: בחירת בשמים להמלצת החודש (${monthStr}/${year})`,
                html,
                'system'
            );
            return NextResponse.json({ message: 'Reminder sent to manager' });
        }

        // 3. Skip if not selected by 28th (excluding Feb which sends on 28th)
        if (day === 28 && monthNum !== 2 && record.status === 'pending') {
            await pool.query('UPDATE monthly_recommendations SET status = $1 WHERE id = $2', ['skipped', record.id]);
            return NextResponse.json({ message: 'Month skipped due to no selection' });
        }

        // 4. Send Newsletter on 30th (or 28th for Feb)
        const isSendDay = (day === 30 && monthNum !== 2) || (day === 28 && monthNum === 2);
        
        if (isSendDay && record.status === 'selected') {
            // Fetch products
            const productsRes = await pool.query(
                'SELECT id, name, brand, image_url, price FROM products WHERE id = ANY($1)',
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
                
                const html = await getMonthlyRecommendationTemplate(products, couponCode, monthNum);
                
                // Get all subscribers
                const subRes = await pool.query('SELECT email FROM subscribers WHERE status = $1', ['active']);
                const subscriberEmails = subRes.rows.map(r => r.email);

                if (subscriberEmails.length > 0) {
                    await sendEmail(
                        subscriberEmails,
                        'המלצת החודש של מנהל האתר',
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
