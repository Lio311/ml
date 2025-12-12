import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to yourself
            replyTo: email, // Allow replying to the customer
            subject: `פנייה חדשה מהאתר: ${name}`,
            text: `
מאת: ${name}
אימייל: ${email}

תוכן ההודעה:
${message}
            `,
            html: `
<div dir="rtl" style="font-family: Arial, sans-serif;">
    <h2>פנייה חדשה מהאתר</h2>
    <p><strong>מאת:</strong> ${name}</p>
    <p><strong>אימייל:</strong> ${email}</p>
    <hr />
    <p><strong>תוכן ההודעה:</strong></p>
    <p style="white-space: pre-wrap;">${message}</p>
</div>
            `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
