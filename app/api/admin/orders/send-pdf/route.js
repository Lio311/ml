import { NextResponse } from 'next/server';
import { sendEmail, getTemplate } from '../../../../lib/email';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(request) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const emailAddress = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = emailAddress === process.env.ADMIN_EMAIL;
        
        if (!user || (!isSuperAdmin && role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, email, name, pdfBase64 } = await request.json();

        if (!orderId || !email || !pdfBase64) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the template
        const { html, subject } = await getTemplate('order_pdf_form', { 
            orderId: String(orderId), 
            name: name || 'לקוח' 
        });

        const finalSubject = subject || `טופס הזמנה - ml_tlv #${orderId} (v2)`;
        const finalHtml = html || `<p>היי ${name || 'לקוח'},</p><p>מצורף טופס ההזמנה שלך (PDF) עבור הזמנה #${orderId}.</p>`;

        const attachments = [
            {
                filename: `order-${orderId}-full-details.pdf`,
                content: pdfBase64,
                encoding: 'base64',
                contentType: 'application/pdf'
            }
        ];

        // Send the email
        await sendEmail(email, finalSubject, finalHtml, 'system', orderId, null, attachments);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in send-pdf API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
