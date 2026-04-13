import nodemailer from 'nodemailer';
import { logEmail } from './emailLogger';
import pool from './db';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, html, type = 'system', orderId = null) => {
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

        // Log successful send
        const recipient = Array.isArray(to) ? to.join(', ') : to;
        await logEmail({ recipient, subject, type, status: 'sent', orderId });

        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        
        // Log failed send
        const recipient = Array.isArray(to) ? to.join(', ') : to;
        await logEmail({ recipient, subject, type, status: 'failed', error: error.message, orderId });

        return null;
    }
};

/**
 * Replaces placeholders in a template string with actual data.
 * Supports {{key}} syntax.
 */
function replacePlaceholders(html, data = {}) {
    if (!html) return '';
    return html.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const value = data[key.trim()];
        return value !== undefined ? value : match;
    });
}

/**
 * Fetches a template from the database and fills its placeholders.
 * Fallback to a hardcoded function if the database template doesn't exist.
 */
export async function getTemplate(slug, data = {}, fallbackFn = null) {
    try {
        const res = await pool.query('SELECT content_html, subject FROM email_templates WHERE slug = $1 AND is_active = true', [slug]);
        if (res.rows.length > 0) {
            const template = res.rows[0];
            return {
                html: replacePlaceholders(template.content_html, data),
                subject: replacePlaceholders(template.subject, data)
            };
        }
    } catch (err) {
        console.error('Error fetching dynamic template:', err);
    }
    
    // Fallback to static template
    const html = fallbackFn ? fallbackFn(data) : '';
    return { html, subject: null }; // Subject will be handled by the caller if null
}

export const getNewProductTemplate = (product) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <!-- Fonts -->
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
            </style>
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

                <a href="${'https://www.ml-tlv.com'}/product/${product.id}" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
                    לרכישה ופרטים נוספים
                </a>
            </div>

            <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; text-align: center;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};

export const getOrderConfirmationTemplate = (orderId, items, total, freeSamples, notes, deliveryMethod, shippingCost) => {
    const itemsContent = Array.isArray(items) ? items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name || (item.brand + ' ' + item.model)} (${item.size} מ"ל)</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.price} ₪</td>
        </tr>
    `).join('') : items; // items could be a pre-rendered string like '{{itemsHtml}}'

    const deliveryText = deliveryMethod === 'self_pickup' ? 'איסוף עצמי (תל אביב)' : (deliveryMethod === '{{deliveryMethod}}' ? '{{deliveryMethod}}' : 'משלוח בדואר');
    const shippingCostText = shippingCost === 0 ? 'חינם' : (shippingCost === '{{shippingCost}}' ? '{{shippingCost}}' : `${shippingCost} ₪`);

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333;">
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
                    ${itemsContent}
                </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
                <p style="margin: 5px 0;"><strong>שיטת משלוח:</strong> ${deliveryText}</p>
                <p style="margin: 5px 0;"><strong>עלות משלוח:</strong> ${shippingCostText}</p>
                <p style="margin: 5px 0; font-size: 18px;"><strong>סה"כ לתשלום: ${total} ₪</strong></p>
                ${freeSamples > 0 ? `<p style="margin: 5px 0; color: green; font-weight: bold;">+ ${freeSamples} דוגמיות מתנה עלינו! 🎁</p>` : ''}
            </div>

            ${notes ? `
            <div style="background-color: #fffde7; padding: 15px; border: 1px solid #fff9c4; border-radius: 8px; margin-top: 20px; font-size: 14px;">
                <strong>הערות להזמנה:</strong><br>
                ${notes}
            </div>
            ` : ''}
            
            <p style="margin-top: 20px;">אנחנו מטפלים בהזמנה וכבר נצור קשר לתיאום תשלום ומשלוח.</p>
            
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};

export const getStatusUpdateTemplate = (orderId, status, customerName) => {
    let statusText = '';
    let messageBody = '';

    switch (status) {
        case 'pending':
            statusText = 'ממתין';
            messageBody = 'ההזמנה שלך התקבלה וממתינה לאישור.';
            break;
        case 'processing':
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

    const cleanName = customerName && String(customerName).replace(' null', '').trim();

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            <h2 style="color: #000;">עדכון לגבי הזמנה #${orderId}</h2>
            <p>היי ${cleanName || 'לקוח יקר'},</p>
            <p style="font-size: 16px;">
                סטטוס ההזמנה שלך השתנה ל: <strong>${statusText}</strong>
            </p>
            <p>${messageBody}</p>
            
            <div style="margin-top: 30px;">
                <a href="${'https://www.ml-tlv.com'}/orders" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    לצפייה בפרטי ההזמנה
                </a>
            </div>

            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};

export const getAdminNewOrderTemplate = (orderId, customerName, total, items, deliveryMethod, shippingCost, phoneNumber) => {
    const itemsContent = Array.isArray(items) ? items.map(item => `<li>${item.name || (item.brand + ' ' + item.model)} (${item.size}ml) x${item.quantity}</li>`).join('') : items;
    const deliveryText = deliveryMethod === 'self_pickup' ? 'איסוף עצמי (תל אביב)' : (deliveryMethod === '{{deliveryMethod}}' ? '{{deliveryMethod}}' : 'משלוח בדואר');
    
    return `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>הזמנה חדשה באתר! 🎉</h2>
            <p><strong>מספר הזמנה:</strong> #${orderId}</p>
            <p><strong>לקוח:</strong> ${customerName}</p>
            <p><strong>טלפון:</strong> ${phoneNumber || 'לא הוזן'}</p>
            <p><strong>שיטת משלוח:</strong> ${deliveryText}</p>
            <p><strong>עלות משלוח:</strong> ${shippingCost} ₪</p>
            <p><strong>סה"כ סופי:</strong> ${total} ₪</p>
            <p><strong>פריטים:</strong></p>
            <ul>${itemsContent}</ul>
            <p><a href="${'https://www.ml-tlv.com'}/admin/orders">לצפייה בניהול הזמנות</a></p>
        </div>
    `;
};

export const getAdminNewUserTemplate = (user) => {
    return `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>משתמש חדש נרשם למערכת! ✨</h2>
            <p><strong>שם:</strong> ${user.first_name} ${user.last_name}</p>
            <p><strong>אימייל:</strong> ${user.email}</p>
            <p><a href="${'https://www.ml-tlv.com'}/admin/users">לצפייה בניהול משתמשים</a></p>
        </div>
    `;
};

export const getUserWelcomeTemplate = (customerName) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            
            <h1 style="color: #000; text-align: center;">ברוכים הבאים למשפחת ml! ✨</h1>
            <p style="font-size: 18px; text-align: center;">היי ${customerName || 'יקיר/ה'},</p>
            
            <p style="line-height: 1.6; text-align: center;">
                אנחנו שמחים שהצטרפת אלינו! מהיום יש לך גישה לעולם של ניחוחות יוקרתיים בחתיכות קטנות.
            </p>
            
            <div style="background-color: #f8f8f8; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
                <h3 style="margin-top: 0;">מה מחכה לך באתר?</h3>
                <ul style="list-style: none; padding: 0; display: inline-block; text-align: right;">
                    <li style="margin-bottom: 10px;">✨ <strong>קטלוג מגוון</strong> - הבשמים הכי נחשקים בעולם</li>
                    <li style="margin-bottom: 10px;">🎁 <strong>מתנות בכל הזמנה</strong> - דוגמיות חינם לפי גובה הסל</li>
                    <li style="margin-bottom: 10px;">🚀 <strong>משלוח מהיר</strong> - או איסוף עצמי מתל אביב</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="${'https://www.ml-tlv.com'}/catalog" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
                    בואו נתחיל להריח...
                </a>
            </div>
            
            <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; text-align: center;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};

export const getBackInStockTemplate = (product) => {
    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com'}/product/${product.id}`;
    
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            
            <h1 style="color: #000; text-align: center;">הוא חזר! 🎉</h1>
            <p style="font-size: 18px; text-align: center;">היי, יש לנו חדשות מעולות בשבילך!</p>
            
            <p style="line-height: 1.6; text-align: center;">
                הבושם שחיכית לו חזר למלאי וזמין כעת לרכישה באתר.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <img src="${product.image_url}" alt="${product.brand} ${product.model}" style="max-width: 200px; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" />
            </div>
            
            <div style="text-align: center; background-color: #f8f8f8; padding: 25px; border-radius: 16px; margin: 30px 0;">
                <h2 style="margin: 0; font-size: 20px;">${product.brand_he || product.brand}</h2>
                <h3 style="margin: 5px 0 15px; color: #666; font-size: 18px;">${product.model_he || product.model}</h3>
                
                <p style="font-size: 14px; color: #888; margin-bottom: 20px;">
                    אל תחכה יותר מדי, המלאי עשוי להיגמר מהר...
                </p>

                <a href="${productUrl}" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 32px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    אני רוצה להזמין עכשיו
                </a>
            </div>
            
            <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; text-align: center;">ml - יוקרה בחתיכות קטנות</p>
        </div>
    `;
};

/**
 * Returns a mapping of slug to default subject and content for system templates.
 * Used to pre-fill the editor for administrators.
 */
export function getSystemDefaults() {
    return {
        'order_confirmation': {
            subject: 'אישור הזמנה #{{orderId}} - ml_tlv',
            content_html: getOrderConfirmationTemplate('{{orderId}}', '{{itemsHtml}}', '{{total}}', '{{freeSamples}}', '{{notes}}', '{{deliveryMethod}}', '{{shippingCost}}')
        },
        'status_update': {
            subject: 'עדכון לגבי הזמנה #{{orderId}} - ml_tlv',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333;">
            <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ml_tlv</div>
            <h2 style="color: #000;">עדכון לגבי הזמנה #{{orderId}}</h2>
            <p>היי {{name}},</p>
            <p style="font-size: 16px;">
                סטטוס ההזמנה שלך השתנה ל: <strong>{{status}}</strong>
            </p>
            <p>{{messageBody}}</p>
            <div style="margin-top: 30px;">
                <a href="https://www.ml-tlv.com/orders" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    לצפייה בפרטי ההזמנה
                </a>
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">ml - יוקרה בחתיכות קטנות</p>
        </div>`
        },
        'welcome': {
            subject: 'ברוכים הבאים ל-ml_tlv! ✨',
            content_html: getUserWelcomeTemplate('{{name}}')
        },
        'back_in_stock': {
            subject: 'הוא חזר! הבושם שחיכית לו זמין שוב ✨',
            content_html: getBackInStockTemplate({ 
                id: '{{productId}}', 
                brand: '{{brand}}', 
                model: '{{model}}', 
                image_url: 'https://www.ml-tlv.com/logo-black.png' 
            })
        },
        'review_request': {
            subject: 'נשמח לשמוע מה דעתך! ⭐',
            content_html: `<div dir="rtl" style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: right;">
                <h2 style="color: #111827;">שלום {{name}},</h2>
                <p>ראינו שקיבלת לא מזמן את ההזמנה האחרונה שלך מאיתנו ואנחנו סקרנים לדעת איך הייתה חוויית השירות שלך איתנו!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.ml-tlv.com/review?id={{orderId}}" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        לדירוג חוויית השירות בקליק >>
                    </a>
                </div>
                <p style="text-align: center; color: #d97706; font-weight: bold; background: #fef3c7; padding: 10px; border-radius: 6px;">
                    🎁 בונוס קטן: על כל דירוג שתשאיר/י באתר, נשלח אליך למייל קופון של 10% הנחה לקנייה הבאה!
                </p>
                <p>תודה מראש,<br>צוות ml_tlv</p>
            </div>`
        },
        'cart_recovery': {
            subject: 'שכחת משהו אצלנו... קח מתנה! 👀',
            content_html: `<div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h2>ראינו שהשארת מספר פריטים בסל... 👀</h2>
                <p>אנחנו שומרים לך עליהם, אבל המלאי מוגבל!</p>
                <p>כדי להקל עליך, הנה קוד קופון מיוחד של <strong>5% הנחה</strong>:</p>
                <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #16a34a; margin: 0;">{{couponCode}}</h1>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">תקף ל-24 השעות הקרובות בלבד!</p>
                </div>
                <p><a href="https://www.ml-tlv.com/cart" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">לחזרה לעגלה >></a></p>
            </div>`
        },
        'recommendations': {
            subject: 'במיוחד בשבילך... המלצות ניחוחות שמחכות לך ✨',
            content_html: `<div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right;">
                <h2>שלום {{name}}!</h2>
                <p>עבדנו קצת על הטעם האישי שלך והכנו לך המלצות מיוחדות:</p>
                <div style="background: #fdfaf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    {{productsHtml}}
                </div>
                <p>כל הניחוחות זמינים כדוגמיות להתנסות אצלנו באתר.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.ml-tlv.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">למעבר לאתר >></a>
                </div>
            </div>`
        },
        'educational': {
            subject: 'איך להפיק את המרב מהבשמים שלך? ✨',
            content_html: `<div dir="rtl" style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: right;">
                <h2>היי {{name}},</h2>
                <p>הנה כמה טיפים לשימוש נכון בבושם שקיבלת:</p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111827;">💡 טיפים לשימוש נכון בבושם:</h3>
                    <ul>
                        <li><strong>הנקודות החמות:</strong> רסס על נקודות הדופק - צוואר ומפרקי הידיים.</li>
                        <li><strong>לא לשפשף!</strong> זה "שובר" את מולקולות הריח.</li>
                        <li><strong>אחסון:</strong> שמור את הבשמים במקום קריר ומוצל.</li>
                    </ul>
                </div>
                <p>באהבה,<br>צוות ml_tlv</p>
            </div>`
        },
        'admin_order_alert': {
            subject: 'הזמנה חדשה התקבלה! #{{orderId}} 🔥',
            content_html: getAdminNewOrderTemplate('{{orderId}}', '{{name}}', '{{total}}', '{{itemsHtml}}', '{{deliveryMethod}}', '{{shippingCost}}', '{{phone}}')
        },
        'admin_user_alert': {
            subject: 'משתמש חדש נרשם למערכת! ✨',
            content_html: getAdminNewUserTemplate({ first_name: '{{firstName}}', last_name: '{{lastName}}', email: '{{email}}' })
        },
        'contact_form_alert': {
            subject: 'פנייה חדשה מהאתר: {{name}}',
            content_html: `<div dir="rtl" style="font-family: Arial, sans-serif;">
                <h2>פנייה חדשה מהאתר</h2>
                <p><strong>מאת:</strong> {{name}}</p>
                <p><strong>אימייל:</strong> {{email}}</p>
                <hr /><p><strong>תוכן ההודעה:</strong></p>
                <p style="white-space: pre-wrap;">{{message}}</p>
            </div>`
        }
    };
}
