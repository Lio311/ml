import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/email';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        const subject = `פנייה חדשה מהאתר: ${name}`;
        const html = `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
                <h2>פנייה חדשה מהאתר</h2>
                <p><strong>מאת:</strong> ${name}</p>
                <p><strong>אימייל:</strong> ${email}</p>
                <hr />
                <p><strong>תוכן ההודעה:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
            </div>
        `;

        // Send to admin email (GMAIL_USER)
        await sendEmail(process.env.GMAIL_USER || process.env.EMAIL_USER, subject, html, 'contact_form');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
