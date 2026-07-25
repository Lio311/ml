import { sendEmail, getOrderUpdatedTemplate } from './app/lib/email.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

async function run() {
    console.log("Sending marketing email with unsubscribe link...");
    await sendEmail(
        'lior31197@gmail.com',
        'טסט לשורת ביטול דיוור',
        '<div dir="rtl" style="padding: 20px; font-family: Arial;">זהו תוכן מייל שיווקי לדוגמה כדי לבדוק את שורת ביטול הדיוור החדשה המעוצבת.</div>',
        'marketing' // 'marketing' triggers unsubscribe link
    );

    console.log("Sending order updated to customer...");
    const changesSummary = [
        'סכום ההזמנה הכולל עודכן מ-150 ₪ ל-180 ₪',
        'שיטת המסירה שונתה מאיסוף עצמי למשלוח',
        'עודכנו פריטים או כמויות של מוצרים בהזמנה'
    ];
    const customerHtml = getOrderUpdatedTemplate('1024', 'ליאור', [
        { brand: 'Creed', model: 'Aventus', size: 5, quantity: 1, price: 180, image_url: '/logo-black.png' }
    ], 180, 'mail', 30, 'הערה מהמנהל: הוספנו דוגמית מתנה!', changesSummary);
    await sendEmail('lior31197@gmail.com', 'הזמנתך #1024 עודכנה - ml_tlv (טסט לקוח)', customerHtml, 'order_updated');

    console.log("Sending order updated to admin...");
    // Assuming getAdminOrderUpdatedTemplate is exported
    const { getAdminOrderUpdatedTemplate } = await import('./app/lib/email.js');
    const adminHtml = getAdminOrderUpdatedTemplate('1024', 'ליאור', 180, 'mail', changesSummary);
    await sendEmail('lior31197@gmail.com', 'הזמנה #1024 עודכנה בהצלחה 🔥 (טסט מנהל)', adminHtml, 'admin_alert');

    console.log("Done");
    process.exit(0);
}

run();
