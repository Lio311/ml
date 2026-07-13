import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { sendEmail, getDailySummaryTemplate } from '../../../lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Uncomment in production to secure the cron
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'lior31197@gmail.com';
        
        // Fetch emails sent today
        // We use CURRENT_DATE to get all logs created today (in database time)
        const res = await pool.query(`
            SELECT subject, recipient, sent_at, type, status 
            FROM email_logs 
            WHERE (sent_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jerusalem')::date = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jerusalem')::date
            ORDER BY sent_at DESC
        `);

        const emails = res.rows;

        // Generate the HTML summary using the template
        const html = getDailySummaryTemplate(emails);
        const subject = `סיכום אימיילים יומי - ${new Date().toLocaleDateString('he-IL')}`;

        // Send to admin
        await sendEmail(
            adminEmail,
            subject,
            html,
            'system'
        );

        return NextResponse.json({ message: `Daily summary sent successfully to ${adminEmail}`, count: emails.length });
    } catch (error) {
        console.error('Error in daily summary cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
