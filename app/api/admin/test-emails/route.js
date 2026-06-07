import { NextResponse } from 'next/server';
import { sendEmail, getAdminNewOrderTemplate, getAdminOrderUpdatedTemplate, getAdminNewUserTemplate } from '@/app/lib/email';
import { checkAdmin } from '@/app/lib/admin';

export async function GET(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const email = 'lior31197@gmail.com';
        
        const orderItems = [
            { name: 'Baccarat Rouge 540', size: 5, quantity: 2 },
            { name: 'Aventus Creed', size: 10, quantity: 1 }
        ];

        await sendEmail(email, 'הזמנה חדשה באתר! - #1001', getAdminNewOrderTemplate(
            1001, 'ליאור בדיקה', '450.00', orderItems, 'משלוח עד הבית', '35.00', '050-1234567', '07/06/2026 15:00'
        ));

        await sendEmail(email, 'הזמנה #1002 עודכנה (מנהל)', getAdminOrderUpdatedTemplate(
            1002, 'ליאור מנהל', '550.00', 'mail', ['הוסר מוצר X', 'דמי משלוח עודכנו לחינם']
        ));

        await sendEmail(email, 'משתמש חדש במערכת! ✨', getAdminNewUserTemplate(
            { first_name: 'ישראל', last_name: 'ישראלי', email: 'test@ml-tlv.com' }
        ));

        return NextResponse.json({ success: true, message: 'Emails sent successfully to ' + email });
    } catch (error) {
        console.error('Test emails error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
