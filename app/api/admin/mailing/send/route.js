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

        let targetEmails = [];
        if (recipient_type === 'all') {
            const usersRes = await pool.query('SELECT email FROM users WHERE email IS NOT NULL');
            targetEmails = usersRes.rows.map(u => u.email);
        } else if (Array.isArray(recipients)) {
            targetEmails = recipients;
        }

        let finalTargetEmails = targetEmails;
        try {
            const unsubRes = await pool.query('SELECT email FROM unsubscribed_emails');
            const unsubEmails = unsubRes.rows.map(r => r.email.toLowerCase());
            finalTargetEmails = targetEmails.filter(email => !unsubEmails.includes(email.toLowerCase()));
        } catch (err) {
            console.error("Error fetching unsubscribed emails in send route:", err);
        }

        if (finalTargetEmails.length === 0) {
            return NextResponse.json({ error: 'No recipients after filtering unsubscribed' }, { status: 400 });
        }

        // Send immediately (Sync or background)
        // Note: For large numbers, we might want to offload to a job, 
        // but for now we follow the existing pattern in lib/email.js
        await sendEmail(
            finalTargetEmails,
            subject,
            content_html,
            'manual_campaign'
        );

        return NextResponse.json({ success: true, count: finalTargetEmails.length });

    } catch (err) {
        console.error('Error in send API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
