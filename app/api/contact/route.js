import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        // In a real production environment, you would use 'nodemailer' or an external service (SendGrid/Resend) here.
        // For now, since we don't have SMTP credentials configured, we will log the message.

        console.log('--- NEW CONTACT FORM SUBMISSION ---');
        console.log('To: lior31197@gmail.com');
        console.log('From:', name, `(${email})`);
        console.log('Message:', message);
        console.log('-----------------------------------');

        // Simulate success
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
