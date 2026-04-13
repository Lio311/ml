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

export const sendEmail = async (to, subject, html, type = 'system', orderId = null, campaignId = null) => {
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
        await logEmail({ recipient, subject, type, status: 'sent', orderId, campaignId });

        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        
        // Log failed send
        const recipient = Array.isArray(to) ? to.join(', ') : to;
        await logEmail({ recipient, subject, type, status: 'failed', error: error.message, orderId, campaignId });

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
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #333;">${item.name || (item.brand + ' ' + item.model)} (${item.size} מ"ל)</td>
            <td style="padding: 12px 8px; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
            <td style="padding: 12px 8px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">${item.price} ₪</td>
        </tr>
    `).join('') : items;

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv</div>
            </div>

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">תודה על ההזמנה!</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">הזמנה מספר <strong>#${orderId}</strong> התקבלה בהצלחה.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                        <tr style="background-color: #f8f8f8; color: #999;">
                            <th style="padding: 10px 8px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase;">מוצר</th>
                            <th style="padding: 10px 8px; text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase;">כמות</th>
                            <th style="padding: 10px 8px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">מחיר</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsContent}
                    </tbody>
                </table>

                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5;">
                    <div style="margin-top: 12px; font-size: 18px; font-weight: 900; color: #000; display: block; width: 100%; text-align: left;">
                        סה"כ לתשלום: ${total} ₪
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לצפייה בפרטי ההזמנה באתר</a>
                </div>
            </div>

            <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getStatusUpdateTemplate = (orderId, name, status, messageBody) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv</div>
            </div>
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000;">עדכון לגבי הזמנה #${orderId}</h2>
                <p style="margin-bottom: 20px;">היי ${name},</p>
                <div style="background-color: #f8f8f8; padding: 15px; border-radius: 12px; margin-bottom: 20px; border-right: 4px solid #000;">
                    סטטוס ההזמנה שלך השתנה ל: <strong style="font-size: 18px;">${status}</strong>
                </div>
                <p style="color: #666;">${messageBody}</p>
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: 900; font-size: 14px;">
                        לצפייה בסטטוס ההזמנה
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getUserWelcomeTemplate = (name) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv</div>
            </div>

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000;">ברוכים הבאים ל-ml_tlv! ✨</h1>
                <p style="margin: 0 0 25px; color: #666;">היי ${name || 'יקיר/ה'},</p>
                <p style="margin-bottom: 20px;">אנחנו שמחים שהצטרפת אלינו! מהיום יש לך גישה לעולם של ניחוחות יוקרתיים בחתיכות קטנות.</p>
                
                <div style="background-color: #f8f8f8; padding: 25px; border-radius: 16px; margin: 30px 0;">
                    <h3 style="margin-top: 0; font-size: 16px; font-weight: 900;">מה מחכה לך אצלנו?</h3>
                    <ul style="list-style: none; padding: 0; margin: 15px 0 0;">
                        <li style="margin-bottom: 12px; font-size: 14px;">✨ <strong>קטלוג מגוון</strong> - הבשמים הכי נחשקים בעולם</li>
                        <li style="margin-bottom: 12px; font-size: 14px;">🎁 <strong>מתנות בכל הזמנה</strong> - דוגמיות חינם לפי גובה הסל</li>
                        <li style="margin-bottom: 0; font-size: 14px;">🚀 <strong>משלוח מהיר</strong> - או איסוף עצמי מתל אביב</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/catalog" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">בואו נתחיל להריח...</a>
                </div>
            </div>
            
            <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getAdminNewOrderTemplate = (orderId, customerName, total, items, deliveryMethod, shippingCost, phoneNumber) => {
    const itemsContent = Array.isArray(items) ? items.map(item => `
        <li style="margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
            <span style="font-weight: 900; color: #000;">${item.brand || ''} ${item.model || ''}</span>
            <div style="font-size: 12px; color: #666;">${item.size || ''}ml x${item.quantity || 1}</div>
        </li>
    `).join('') : items;

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 18px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv ADMIN</div>
            </div>

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הזמנה חדשה! 🔥</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">התקבלה הזמנה חדשה #<strong>${orderId}</strong></p>
                
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
                    <div style="margin-bottom: 8px; font-size: 14px;"><span style="color: #888;">לקוח:</span> <strong style="color: #000;">${customerName}</strong></div>
                    <div style="margin-bottom: 8px; font-size: 14px;"><span style="color: #888;">טלפון:</span> <strong style="color: #000;">${phoneNumber || 'לא הוזן'}</strong></div>
                    <div style="margin-bottom: 8px; font-size: 14px;"><span style="color: #888;">שיטת משלוח:</span> <strong style="color: #000;">${deliveryMethod}</strong></div>
                    <div style="font-size: 18px; font-weight: 900; border-top: 1px dashed #ddd; margin-top: 15px; padding-top: 15px; color: #000;">
                        סה"כ לגבייה: ${total} ₪
                    </div>
                </div>

                <div style="border: 1px solid #f0f0f0; padding: 20px; border-radius: 16px;">
                    <h3 style="margin-top: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #999; letter-spacing: 1px;">פירוט הזמנה:</h3>
                    <ul style="list-style: none; padding: 0; margin: 15px 0 0;">${itemsContent}</ul>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/admin/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לניהול ההזמנה במערכת</a>
                </div>
            </div>
        </div>
    `;
};

export const getAdminNewUserTemplate = (user) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 16px; font-weight: 900; color: #000;">ml_tlv ADMIN</div>
            </div>

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">משתמש חדש נרשם! ✨</h1>
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin-top: 20px; text-align: center;">
                    <p style="margin: 5px 0; font-size: 18px; font-weight: 900; color: #000;">${user.first_name || ''} ${user.last_name || ''}</p>
                    <p style="margin: 5px 0; color: #666;">${user.email}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/admin/users" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: 900; font-size: 14px;">לניהול משתמשים</a>
                </div>
            </div>
        </div>
    `;
};


export const getBackInStockTemplate = (product) => {
    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com'}/product/${product.id}`;
    
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv</div>
            </div>

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הוא חזר! 🎉</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">היי, יש לנו חדשות מעולות בשבילך!</p>
                
                <p style="text-align: center; margin-bottom: 25px;">
                    הבושם שחיכית לו חזר למלאי וזמין כעת לרכישה באתר.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <img src="${product.imageUrl || product.image_url || 'https://www.ml-tlv.com/logo-black.png'}" alt="${product.brand} ${product.model}" style="max-width: 220px; height: auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" />
                </div>
                
                <div style="text-align: center; background-color: #f8f8f8; padding: 25px; border-radius: 20px; margin: 30px 0;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: 900;">${product.brand_he || product.brand}</h2>
                    <h3 style="margin: 5px 0 15px; color: #666; font-size: 18px; font-weight: 700;">${product.model_he || product.model}</h3>
                    
                    <p style="font-size: 12px; color: #999; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">
                        אל תחכה יותר מדי, המלאי עשוי להיגמר מהר...
                    </p>

                    <a href="${productUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 10px 20px rgba(0,0,0,0.15);">
                        אני רוצה להזמין עכשיו
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
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
            content_html: getStatusUpdateTemplate('{{orderId}}', '{{name}}', '{{status}}', '{{messageBody}}')
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
                imageUrl: 'https://www.ml-tlv.com/favicon.png' 
            })
        },
        'review_request': {
            subject: 'נשמח לשמוע מה דעתך! ⭐',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv</div>
            </div>
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">איך הבשמים החדשים שלך? ⭐</h2>
                <p style="margin-bottom: 20px;">שלום {{name}},</p>
                <p>ראינו שקיבלת לא מזמן את ההזמנה שלך מאיתנו ואנחנו סקרנים לדעת איך הייתה חוויית השירות שלך!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.ml-tlv.com/review?id={{orderId}}" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לדירוג השירות בקליק >></a>
                </div>

                <div style="background-color: #fffde7; padding: 20px; border-radius: 16px; border: 1px solid #fff9c4; text-align: center;">
                    <p style="margin: 0; color: #d97706; font-weight: 900; font-size: 14px;">
                        🎁 בונוס קטן: על כל דירוג שתשאיר/י באתר, נשלח אליך למייל קופון של 10% הנחה לקנייה הבאה!
                    </p>
                </div>
            </div>
            <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'cart_recovery': {
            subject: 'שכחת משהו אצלנו... קח מתנה! 👀',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #000;">ml_tlv</div>
            </div>
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">ראינו שהשארת פריטים בסל... 👀</h2>
                <p style="text-align: center; color: #666;">אנחנו שומרים לך עליהם, אבל המלאי מוגבל!</p>
                
                <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 20px; text-align: center; margin: 25px 0; border-radius: 16px;">
                    <p style="margin: 0 0 10px; color: #666; font-size: 14px;">כדי להקל עליך, הנה קוד קופון של <strong>5% הנחה</strong>:</p>
                    <h1 style="color: #16a34a; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 2px;">{{couponCode}}</h1>
                    <p style="margin: 10px 0 0 0; color: #16a34a; font-size: 10px; font-weight: 900; text-transform: uppercase;">תקף ל-24 השעות הקרובות בלבד!</p>
                </div>

                <div style="text-align: center;">
                    <a href="https://www.ml-tlv.com/cart" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לחזרה לסל הקניות >></a>
                </div>
            </div>
            <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'contact_form_alert': {
            subject: 'פנייה חדשה מהאתר: {{name}}',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 18px; font-weight: 900; color: #000;">ml_tlv ADMIN</div>
            </div>
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">פנייה חדשה מהאתר</h1>
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
                    <div style="margin-bottom: 10px; font-size: 14px;"><span style="color: #888;">מאת:</span> <strong style="color: #000;">{{name}}</strong></div>
                    <div style="margin-bottom: 10px; font-size: 14px;"><span style="color: #888;">אימייל:</span> <strong style="color: #000;">{{email}}</strong></div>
                </div>
                <div style="background-color: #fff; border: 1px solid #eee; padding: 20px; border-radius: 16px;">
                    <h3 style="margin-top: 0; font-size: 12px; font-weight: 900; color: #999; text-transform: uppercase;">תוכן ההודעה:</h3>
                    <div style="white-space: pre-wrap; font-size: 15px; color: #333;">{{message}}</div>
                </div>
            </div>
        </div>`
        }
    };
}
