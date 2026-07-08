import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { checkCronOrAdmin } from "@/app/lib/admin";

export async function GET(req) {
    const isAuthorized = await checkCronOrAdmin(req);
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        // Enforce running only on the FIRST Wednesday of the month
        // Vercel cron might trigger every Wednesday if we use '0 19 * * 3'
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday, 3 is Wednesday
        const date = today.getDate(); // 1-31
        
        // If it's not Wednesday, or the date is greater than 7, it's not the first Wednesday.
        if (dayOfWeek !== 3 || date > 7) {
            return NextResponse.json({ success: true, message: 'Not the first Wednesday of the month. Skipping.' });
        }

        const client = await pool.connect();
        try {
            // Get all active users who are subscribed to marketing emails
            // Note: Since this is monthly, we will limit how many emails we send if it's a huge list.
            // Or use a batch processing approach if needed.
            const res = await client.query(`
                SELECT id, first_name, email 
                FROM users 
                WHERE email_marketing = true OR email_marketing IS NULL
            `);
            
            const users = res.rows;
            console.log(`[Monthly Discovery Cron] Found ${users.length} users to send to.`);

            let processed = 0;

            for (const user of users) {
                if (!user.email) continue;
                
                // We could check if we already sent this month using email_logs
                // but since the cron is triggered exactly once a month via Vercel, it's fine.
                // However, as a safety net:
                const logRes = await client.query(`
                    SELECT 1 FROM email_logs 
                    WHERE recipient = $1 
                    AND type = 'monthly_discovery' 
                    AND created_at > NOW() - INTERVAL '20 days'
                `, [user.email]);

                if (logRes.rows.length > 0) {
                    continue; // Already sent this month
                }

                const firstName = user.first_name || 'לקוח/ה';
                const { html, subject } = await getTemplate('monthly_discovery', { name: firstName });
                
                if (html && subject) {
                    await sendEmail(user.email, subject, html, 'monthly_discovery');
                    processed++;
                }
            }

            return NextResponse.json({ 
                success: true, 
                processed
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Monthly Discovery Email Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
