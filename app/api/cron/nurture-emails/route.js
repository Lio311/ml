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
            // Because adding tracking columns to users table is complex, we use email_logs 
            // to check if a nurture email was already sent to avoid resending.
            // In Postgres we can check NOT EXISTS

            const res10Days = await client.query(`
                SELECT id, first_name, email, created_at 
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '11 days'
                AND created_at < NOW() - INTERVAL '10 days'
                AND NOT EXISTS (
                    SELECT 1 FROM email_logs 
                    WHERE recipient_email = users.email 
                    AND type = 'nurture_10_days'
                )
            `);

            const res25Days = await client.query(`
                SELECT id, first_name, email, created_at 
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '26 days'
                AND created_at < NOW() - INTERVAL '25 days'
                AND NOT EXISTS (
                    SELECT 1 FROM email_logs 
                    WHERE recipient_email = users.email 
                    AND type = 'nurture_25_days'
                )
            `);

            const users10 = res10Days.rows;
            const users25 = res25Days.rows;
            
            console.log(`[Nurture Cron] Found ${users10.length} users for 10-days, ${users25.length} users for 25-days.`);

            let processed10 = 0;
            let processed25 = 0;

            // Send 10-day emails
            for (const user of users10) {
                if (!user.email) continue;
                const firstName = user.first_name || 'לקוח/ה';
                const { html, subject } = await getTemplate('nurture_10_days', { name: firstName });
                
                if (html && subject) {
                    await sendEmail(user.email, subject, html, 'nurture_10_days');
                    processed10++;
                }
            }

            // Send 25-day emails
            for (const user of users25) {
                if (!user.email) continue;
                const firstName = user.first_name || 'לקוח/ה';
                const { html, subject } = await getTemplate('nurture_25_days', { name: firstName });
                
                if (html && subject) {
                    await sendEmail(user.email, subject, html, 'nurture_25_days');
                    processed25++;
                }
            }

            return NextResponse.json({ 
                success: true, 
                processed10,
                processed25
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Nurture Email Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
