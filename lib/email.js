
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Skipping email send: Missing EMAIL_USER or EMAIL_PASS environment variables.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"ml_tlv" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // We generally don't want to crash the request if email fails, just log it.
        return null;
    }
};

export const getOrderConfirmationTemplate = (orderId, items, total, freeSamples) => {
    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (${item.size} מ"ל)</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.price} ₪</td>
        </tr>
    `).join('');

    return `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            <h1 style="color: #000;">תודה על ההזמנה!</h1>
            <p>הזמנה מספר <strong>#${orderId}</strong> התקבלה בהצלחה.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f8f8f8;">
                        <th style="padding: 10px; text-align: right;">מוצר</th>
                        <th style="padding: 10px; text-align: right;">כמות</th>
                        <th style="padding: 10px; text-align: right;">מחיר</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <p style="margin-top: 20px;">
                <strong>סה"כ לתשלום: ${total} ₪</strong>
                ${freeSamples > 0 ? `<br><span style="color: green;">+ ${freeSamples} דוגמיות מתנה עלינו! 🎁</span>` : ''}
            </p>
            
            <p>אנחנו מטפלים בהזמנה וכבר נצור קשר לתיאום תשלום ומשלוח.</p>
            
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};

export const getStatusUpdateTemplate = (orderId, status, customerName) => {
    let statusText = '';
    let messageBody = '';

    switch (status) {
        case 'processing': // Or whatever your statuses are
            statusText = 'בטיפול';
            messageBody = 'ההזמנה שלך התקבלה ונמצאת בטיפול הצוות.';
            break;
        case 'shipped':
            statusText = 'נשלחה';
            messageBody = 'חדשות טובות! ההזמנה שלך נארזה ונמסרה לשליח / יצאה למשלוח.';
            break;
        case 'completed':
            statusText = 'הושלמה / נמסרה';
            messageBody = 'ההזמנה נמסרה בהצלחה. תודה שבחרת בנו!';
            break;
        case 'cancelled':
            statusText = 'בוטלה';
            messageBody = 'ההזמנה בוטלה. אם זו טעות, נא ליצור איתנו קשר.';
            break;
        default:
            statusText = status;
            messageBody = `הסטטוס של ההזמנה שלך עודכן ל-${status}.`;
    }

    return `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            <h2 style="color: #000;">עדכון לגבי הזמנה #${orderId}</h2>
            <p>היי ${customerName || 'לקוח יקר'},</p>
            <p style="font-size: 16px;">
                סטטוס ההזמנה שלך השתנה ל: <strong>${statusText}</strong>
            </p>
            <p>${messageBody}</p>
            
            <div style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://ml-perfume.vercel.app'}/orders" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    לצפייה בפרטי ההזמנה
                </a>
            </div>

            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};
