import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { sendEmail, getDailySummaryTemplate, getTemplate } from '../../../lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
            WHERE (sent_at AT TIME ZONE 'Asia/Jerusalem')::date = (NOW() AT TIME ZONE 'Asia/Jerusalem')::date
            AND TRIM(recipient) != $1
            ORDER BY sent_at DESC
        `, [adminEmail]);

        const rawEmails = res.rows;

        const groupedEmails = [];
        const groupMap = new Map();

        rawEmails.forEach(email => {
            const isCommaSeparated = email.recipient && email.recipient.includes(',');
            const recipientCount = isCommaSeparated ? email.recipient.split(',').length : 1;
            
            const key = email.type ? `${email.type}_${email.subject}` : email.subject;

            if (groupMap.has(key)) {
                const existing = groupMap.get(key);
                existing.count += recipientCount;
                existing.recipient = `כל המשתמשים (${existing.count} נמענים)`;
            } else {
                const newEmailObj = { ...email, count: recipientCount };
                if (recipientCount > 1) {
                    newEmailObj.recipient = `כל המשתמשים (${recipientCount} נמענים)`;
                }
                groupMap.set(key, newEmailObj);
                groupedEmails.push(newEmailObj);
            }
        });

        const emails = groupedEmails;

        // Generate the rows HTML
        let rowsHtml = '';
        if (emails && emails.length > 0) {
            rowsHtml = emails.map(email => `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px 10px; font-size: 14px; color: #333; text-align: right;">${email.subject || 'ללא נושא'}</td>
                    <td style="padding: 12px 10px; font-size: 14px; color: #333; text-align: right;" dir="ltr">${email.recipient || 'לא ידוע'}</td>
                    <td style="padding: 12px 10px; font-size: 14px; color: #666; text-align: center;" dir="ltr">${new Date(email.sent_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Jerusalem'})}</td>
                </tr>
            `).join('');
        } else {
            rowsHtml = `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">לא נשלחו מיילים היום.</td></tr>`;
        }

        const templateData = {
            date: new Date().toLocaleDateString('he-IL'),
            rowsHtml,
            totalCount: emails ? emails.length : 0
        };

        const { html, subject } = await getTemplate('daily_summary', templateData, () => getDailySummaryTemplate(emails));
        const finalSubject = subject || `סיכום אימיילים יומי - ${new Date().toLocaleDateString('he-IL')}`;

        // Send to admin
        await sendEmail(
            adminEmail,
            finalSubject,
            html,
            'system'
        );

        return NextResponse.json({ message: `Daily summary sent successfully to ${adminEmail}`, count: emails.length });
    } catch (error) {
        console.error('Error in daily summary cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
