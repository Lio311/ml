import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { getAutomationConfig, isAutomationActive } from '@/app/lib/automationConfig';

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

            const config10 = await getAutomationConfig('nurture_10_days');
            const delay10 = config10.delay_days || 10;
            const active10 = await isAutomationActive('טיפוח לקוחות: 10 ימים (בקשת בושם)');

            let users10 = [];
            if (active10) {
                const res10Days = await client.query(`
                    SELECT id, first_name, email, created_at 
                    FROM users 
                    WHERE created_at >= NOW() - INTERVAL '${delay10 + 1} days'
                    AND created_at < NOW() - INTERVAL '${delay10} days'
                    AND NOT EXISTS (
                        SELECT 1 FROM email_logs 
                        WHERE recipient = users.email 
                        AND type = 'nurture_10_days'
                    )
                `);
                users10 = res10Days.rows;
            }

            const config25 = await getAutomationConfig('nurture_25_days');
            const delay25 = config25.delay_days || 25;
            const active25 = await isAutomationActive('טיפוח לקוחות: 25 ימים (התאמה אישית)');

            let users25 = [];
            if (active25) {
                const res25Days = await client.query(`
                    SELECT id, first_name, email, created_at 
                    FROM users 
                    WHERE created_at >= NOW() - INTERVAL '${delay25 + 1} days'
                    AND created_at < NOW() - INTERVAL '${delay25} days'
                    AND NOT EXISTS (
                        SELECT 1 FROM email_logs 
                        WHERE recipient = users.email 
                        AND type = 'nurture_25_days'
                    )
                `);
                users25 = res25Days.rows;
            }
            
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

            // Update workflow last_run for visual sync
            await client.query(`
                UPDATE workflows 
                SET last_run = NOW(), total_runs = total_runs + $1 
                WHERE name IN ('טיפוח לקוחות: 10 ימים (בקשת בושם)', 'טיפוח לקוחות: 25 ימים (התאמה אישית)')
            `, [processed10 + processed25]);

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
