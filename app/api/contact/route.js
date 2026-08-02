import { NextResponse } from 'next/server';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { isAutomationActive } from '@/app/lib/automationConfig';
import pool from '@/app/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email) || email.length > 254) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 5000) {
            return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
        }

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

        // Send to admin email
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        await sendEmail(adminEmail, subject, html, 'contact_form_alert', null, null, [], true, email);

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
