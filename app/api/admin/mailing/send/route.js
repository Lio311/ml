import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/email';
import { currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { recipient_type, recipients, subject, content_html, title } = body;

        let recipientData = [];
        if (recipient_type === 'all') {
            const usersRes = await pool.query('SELECT email, first_name, last_name FROM users WHERE email IS NOT NULL');
            recipientData = usersRes.rows.map(u => ({ email: u.email, first_name: u.first_name, last_name: u.last_name }));
        } else if (Array.isArray(recipients) && recipients.length > 0) {
            const placeholders = recipients.map((_, i) => `$${i + 1}`).join(',');
            const usersRes = await pool.query(`SELECT email, first_name, last_name FROM users WHERE email IN (${placeholders})`, recipients);
            const userMap = {};
            usersRes.rows.forEach(u => userMap[u.email] = u);
            
            recipientData = recipients.map(email => ({
                email,
                first_name: userMap[email]?.first_name || '',
                last_name: userMap[email]?.last_name || ''
            }));
        }

        try {
            const unsubRes = await pool.query('SELECT email FROM unsubscribed_emails');
            const unsubEmails = unsubRes.rows.map(r => r.email.toLowerCase());
            recipientData = recipientData.filter(u => !unsubEmails.includes(u.email.toLowerCase()));
        } catch (err) {
            console.error("Error fetching unsubscribed emails in send route:", err);
        }

        if (recipientData.length === 0) {
            return NextResponse.json({ error: 'No recipients after filtering unsubscribed' }, { status: 400 });
        }

        // Send immediately (Sync or background)
        let successCount = 0;
        for (const data of recipientData) {
            try {
                const displayName = data.first_name ? data.first_name : 'לקוח/ה יקר/ה';
                const personalizedHtml = (content_html || '').replace(/\{\{name\}\}/g, displayName);
                const personalizedSubject = (subject || '').replace(/\{\{name\}\}/g, displayName);

                await sendEmail(
                    data.email,
                    personalizedSubject,
                    personalizedHtml,
                    'manual_campaign'
                );
                successCount++;
            } catch (err) {
                console.error(`Failed to send email to ${data.email}:`, err);
            }
        }

        return NextResponse.json({ success: true, count: successCount });

    } catch (err) {
        console.error('Error in send API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
