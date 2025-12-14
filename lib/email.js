
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
        const mailOptions = {
            from: `"ml_tlv" <${process.env.EMAIL_USER}>`,
            subject,
            html,
        };

        if (Array.isArray(to)) {
            mailOptions.bcc = to; // If array, use BCC
        } else {
            mailOptions.to = to; // Single recipient
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // We generally don't want to crash the request if email fails, just log it.
        return null;
    }
};

export const getNewProductTemplate = (product) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            
            <h1 style="color: #000; text-align: center;">הגיע חדש! ✨</h1>
            <p style="text-align: center; font-size: 18px;">אנחנו מתרגשים להציג את התוספת החדשה לקולקציה שלנו:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <img src="${product.image_url}" alt="${product.brand} ${product.model}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
            </div>

            <div style="text-align: center;">
                <h2 style="margin: 0;">${product.brand}</h2>
                <h3 style="margin: 5px 0 20px; color: #666;">${product.model}</h3>
                
                <p style="line-height: 1.6; margin-bottom: 30px;">
                    ${product.description}
                </p>

                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 15px;">מחירים:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 8px;">2 מ"ל - <strong>${product.price_2ml} ₪</strong></li>
                        <li style="margin-bottom: 8px;">5 מ"ל - <strong>${product.price_5ml} ₪</strong></li>
                        <li>10 מ"ל - <strong>${product.price_10ml} ₪</strong></li>
                    </ul>
                </div>

                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://ml-perfume.vercel.app'}/product/${product.id}" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
                    לרכישה ופרטים נוספים
                </a>
            </div>
            
            <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; text-align: center;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
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
