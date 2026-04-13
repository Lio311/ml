import { NextResponse } from 'next/server';
import { sendEmail, getTemplate } from '@/app/lib/email';

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

        // Send to admin email (GMAIL_USER)
        await sendEmail(process.env.GMAIL_USER || process.env.EMAIL_USER, subject, html, 'contact_form_alert');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
