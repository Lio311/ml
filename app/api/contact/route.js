import { NextResponse } from 'next/server';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { isAutomationActive } from '@/app/lib/automationConfig';
import pool from '@/app/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        const { html, subject } = await getTemplate('contact_form_alert', 
            { name, email, message },
            () => {
                return `
                <div dir="rtl" style="font-family: Arial, sans-serif;">
                    <h2>פנייה חדשה מהאתר</h2>
                    <p><strong>מאת:</strong> ${name}</p>
                    <p><strong>אימייל:</strong> ${email}</p>
                    <hr />
                    <p><strong>תוכן ההודעה:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>`;
            }
        );

        // Check if this automation is enabled
        const active = await isAutomationActive('התראת פנייה - טופס צור קשר');
        if (!active) {
            return NextResponse.json({ success: true });
        }

        // Send to admin email (GMAIL_USER)
        await sendEmail(process.env.GMAIL_USER || process.env.EMAIL_USER, subject, html, 'contact_form_alert');

        // Update visual workflow last_run
        await pool.query(`
            UPDATE workflows 
            SET last_run = NOW(), total_runs = total_runs + 1
            WHERE name = 'התראת פנייה - טופס צור קשר'
        `);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
