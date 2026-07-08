import nodemailer from 'nodemailer';
import { logEmail } from './emailLogger';
import pool from './db';
import { getBrandName } from './brand';

const getAbsoluteImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDiscoverySize = (label) => {
    if (!label) return 'מארז דוגמיות';
    const nums = label.match(/\d+/g);
    if (nums && nums.length >= 2) {
        return `${nums[0]}X${nums[1]}ml`;
    }
    return label;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, html, type = 'system', orderId = null, campaignId = null, attachments = []) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Skipping email send: Missing EMAIL_USER or EMAIL_PASS environment variables.");
        return;
    }

    try {
        let finalTo = to;
        const isMarketing = ['manual_campaign', 'recommendations', 'new_product', 'review_request', 'cart_recovery', 'educational', 'nurture_10_days', 'nurture_25_days', 'discovery_launch'].includes(type) || campaignId !== null;

        if (isMarketing) {
            try {
                const unsubRes = await pool.query('SELECT email FROM unsubscribed_emails');
                const unsubEmails = unsubRes.rows.map(r => r.email.toLowerCase());
                
                if (Array.isArray(to)) {
                    finalTo = to.filter(email => !unsubEmails.includes(email.toLowerCase()));
                    if (finalTo.length === 0) return null;
                } else {
                    if (unsubEmails.includes(to.toLowerCase())) return null;
                }
            } catch (err) {
                console.error("Error checking unsubscribed emails:", err);
            }
        }

        let finalHtml = html;
        if (isMarketing) {
            const unsubscribeLink = Array.isArray(finalTo) 
                ? 'https://www.ml-tlv.com/unsubscribe' 
                : `https://www.ml-tlv.com/unsubscribe?email=${encodeURIComponent(finalTo)}`;
            const unsubscribeHtml = `
                <div dir="rtl" style="margin-top: 5px; text-align: center; font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #999;">
                    <p style="margin: 0 0 4px; font-size: 11px;">
                        קיבלת מייל זה כי נרשמת לעדכונים מ-<strong>ml_tlv</strong>.
                    </p>
                    <a href="${unsubscribeLink}" dir="rtl" style="display: inline-block; font-size: 11px; color: #999; text-decoration: underline;">
                        להסרה מרשימת התפוצה
                    </a>
                </div>
            `;
            // Append before closing body/div if possible, otherwise at the end
            if (finalHtml.includes('</body>')) {
                finalHtml = finalHtml.replace('</body>', unsubscribeHtml + '</body>');
            } else if (finalHtml.includes('</div>\n        </div>\n    `;') || finalHtml.trim().endsWith('</div>')) {
                // Heuristic for the custom templates
                finalHtml = finalHtml + unsubscribeHtml;
            } else {
                finalHtml += unsubscribeHtml;
            }
        }

        const brandName = await getBrandName();
        const mailOptions = {
            from: `"${brandName}" <${process.env.EMAIL_USER}>`,
            subject,
            html: finalHtml,
            attachments
        };

        if (Array.isArray(finalTo)) {
            mailOptions.bcc = finalTo;
        } else {
            mailOptions.to = finalTo;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);

        const recipient = Array.isArray(finalTo) ? finalTo.join(', ') : finalTo;
        await logEmail({ recipient, subject, type, status: 'sent', orderId, campaignId });

        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        
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
                subject: replacePlaceholders(template.subject, data) || null
            };
        }
    } catch (err) {
        console.error('Error fetching dynamic template:', err);
    }
    
    // Fallback to static template
    const html = fallbackFn ? fallbackFn(data) : '';
    
    // Get default subject from system defaults if possible
    let subject = null;
    try {
        const defaults = getSystemDefaults();
        if (defaults[slug]) {
            subject = replacePlaceholders(defaults[slug].subject, data);
        }
    } catch (e) {
        // Ignore errors in getting defaults
    }

    return { html, subject }; 
}

export const getNewProductTemplate = (product) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הגיע חדש! ✨</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">אנחנו מתרגשים להציג את התוספת החדשה לקולקציה שלנו:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <img src="${getAbsoluteImageUrl(product.image_url)}" alt="${product.brand} ${product.model}" style="max-width: 260px; height: auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background-color: #ffffff; padding: 10px;" />
                </div>

                <div style="text-align: center; background-color: #fcfcfc; padding: 25px; border-radius: 20px; border: 1px solid #f5f5f5;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #000;">${product.brand}</h2>
                    <h3 style="margin: 5px 0 20px; color: #666; font-size: 18px;">${product.model}</h3>

                    <p style="line-height: 1.6; margin-bottom: 25px; font-size: 14px;">
                        ${product.description}
                    </p>

                    <div style="background-color: #fff; padding: 15px; border-radius: 12px; margin-bottom: 25px; text-align: center; border: 1px dashed #e5e5e5;">
                        <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #999; margin-bottom: 10px;">מחירים</div>
                        <div style="margin-bottom: 8px; font-size: 14px;">2 מ"ל - <strong>${product.price_2ml} ₪</strong></div>
                        <div style="margin-bottom: 8px; font-size: 14px;">5 מ"ל - <strong>${product.price_5ml} ₪</strong></div>
                        <div style="font-size: 14px;">10 מ"ל - <strong>${product.price_10ml} ₪</strong></div>
                    </div>

                    <a href="${'https://www.ml-tlv.com'}/product/${product.id}" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 10px 20px rgba(0,0,0,0.15);">
                        לרכישה ופרטים נוספים
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const formatItemsHtmlCustomer = (items) => {
    if (!Array.isArray(items)) return items;
    const rowsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #f5f5f5;">
            <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #333;">
                ${item.image_url ? `<img src="${getAbsoluteImageUrl(item.image_url)}" width="40" style="vertical-align: middle; margin-left: 10px; border-radius: 6px; display: inline-block; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain; background-color: #ffffff;" alt="${item.name || 'product'}" />` : ''}
                <span style="vertical-align: middle;">${item.name || (item.brand + ' ' + item.model)} ${item.is_discovery_set ? `(${formatDiscoverySize(item.volume_label)})` : `(${item.size} מ"ל)`}</span>
            </td>
            <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
            <td style="padding: 12px 10px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">${item.price} ₪</td>
        </tr>
    `).join('');

    return `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
                <tr style="background-color: #f8f8f8; color: #999;">
                    <th style="padding: 12px 10px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase;">מוצר</th>
                    <th style="padding: 12px 10px; text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase;">כמות</th>
                    <th style="padding: 12px 10px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">מחיר</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>`;
};

export const formatItemsHtmlAdmin = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map(item => `
        <li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: table; width: 100%;">
            ${item.image_url ? `<div style="display: table-cell; vertical-align: middle; width: 50px;"><img src="${getAbsoluteImageUrl(item.image_url)}" width="40" style="border-radius: 6px; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain; background-color: #ffffff;" alt="product" /></div>` : ''}
            <div style="display: table-cell; vertical-align: middle;">
                <span style="font-weight: 900; color: #000;">${item.name || (item.brand + ' ' + item.model)}</span>
                <div style="font-size: 12px; color: #666;">${item.is_discovery_set ? formatDiscoverySize(item.volume_label) : `${item.size || ''}ml`} x${item.quantity || 1}</div>
            </div>
        </li>
    `).join('');
};

export const formatNotesHtml = (notes) => {
    return notes && notes.trim() !== '' ? `
        <div style="margin-top: 20px; background-color: #fffde7; padding: 15px 20px; border-radius: 16px; border: 1px dashed #fde047;">
            <div style="font-size: 12px; font-weight: 900; color: #ca8a04; margin-bottom: 5px; text-transform: uppercase;">הערות להזמנה:</div>
            <div style="font-size: 14px; color: #854d0e;">${notes}</div>
        </div>` : '';
};

export const getOrderConfirmationTemplate = (orderId, items, total, freeSamples, notesHtml, deliveryMethod, shippingCost) => {
    let finalItemsTable = items;
    
    if (Array.isArray(items)) {
        const rowsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #f5f5f5;">
            <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #333;">
                ${item.image_url ? `<img src="${getAbsoluteImageUrl(item.image_url)}" width="40" style="vertical-align: middle; margin-left: 10px; border-radius: 6px; display: inline-block; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain; background-color: #ffffff;" alt="${item.name || 'product'}" />` : ''}
                <span style="vertical-align: middle;">${item.name || (item.brand + ' ' + item.model)} ${item.is_discovery_set ? `(${formatDiscoverySize(item.volume_label)})` : `(${item.size} מ"ל)`}</span>
            </td>
            <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
            <td style="padding: 12px 10px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">${item.price} ₪</td>
        </tr>`).join('');
        
        finalItemsTable = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                        <tr style="background-color: #f8f8f8; color: #999;">
                            <th style="padding: 12px 10px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase;">מוצר</th>
                            <th style="padding: 12px 10px; text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase;">כמות</th>
                            <th style="padding: 12px 10px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">מחיר</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>`;
    }

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">תודה על ההזמנה!</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">הזמנה מספר <strong>#${orderId}</strong> התקבלה בהצלחה.</p>
                
                ${finalItemsTable}

                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666;">
                        <tr>
                            <td style="padding: 6px 0; text-align: right;">שיטת מסירה:</td>
                            <td style="padding: 6px 0; text-align: left;"><strong style="color: #000;">${deliveryMethod}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0 12px 0; text-align: right;">דמי משלוח:</td>
                            <td style="padding: 6px 0 12px 0; text-align: left;">
                                <strong style="color: #16a34a;">${shippingCost}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top: 1px dashed #ddd; padding-top: 15px;"></td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: right;">סה"כ לתשלום:</td>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: left;">${total} ₪</td>
                        </tr>
                    </table>
                </div>

                ${notesHtml}

                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לצפייה בפרטי ההזמנה באתר</a>
                </div>
            </div>

            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getOrderUpdatedTemplate = (orderId, name, items, total, deliveryMethod, shippingCost, notes, changesSummary = []) => {
    let itemsTable = '';
    if (Array.isArray(items)) {
        const rowsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #f5f5f5;">
            <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #333;">
                ${item.image || item.image_url ? `<img src="${getAbsoluteImageUrl(item.image || item.image_url)}" width="40" style="vertical-align: middle; margin-left: 10px; border-radius: 6px; display: inline-block; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain; background-color: #ffffff;" alt="${item.name || 'product'}" />` : ''}
                <span style="vertical-align: middle;">${item.name || (item.brand + ' ' + item.model)} ${item.is_discovery_set ? `(${formatDiscoverySize(item.volume_label)})` : `(${item.size} מ"ל)`}</span>
            </td>
            <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
            <td style="padding: 12px 10px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">${item.price} ₪</td>
        </tr>`).join('');
        
        itemsTable = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0;">
                    <thead style="background-color: #fafafa;">
                        <tr>
                            <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase;">מוצר</th>
                            <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase;">כמות</th>
                            <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase;">מחיר</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>`;
    }

    let changesHtml = '';
    if (changesSummary && changesSummary.length > 0) {
        changesHtml = `
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 900; color: #0284c7;">מה השתנה בהזמנה?</h3>
                <ul style="margin: 0; padding-right: 20px; color: #0369a1; font-size: 14px; line-height: 1.8;">
                    ${changesSummary.map(change => `<li style="margin-bottom: 5px;">${change}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הזמנה #${orderId} עודכנה</h1>
                <p style="margin-bottom: 20px;">היי ${name},</p>
                <p style="margin-bottom: 25px; color: #555;">ההזמנה שלך עודכנה על ידי צוות ml_tlv. להלן הפרטים המעודכנים:</p>
                
                ${changesHtml}
                
                ${itemsTable}

                <div style="background-color: #fafafa; padding: 20px; border-radius: 16px; border: 1px solid #f0f0f0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #555;">
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">שיטת מסירה:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">${deliveryMethod === 'mail' ? 'משלוח' : 'איסוף עצמי'}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0 16px 0; text-align: right;">דמי משלוח:</td>
                            <td style="padding: 8px 0 16px 0; text-align: left;">
                                <strong style="color: #16a34a;">${shippingCost === 0 ? 'חינם' : shippingCost + ' ₪'}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top: 1px dashed #e5e5e5; padding-top: 16px;"></td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: right;">סה"כ לתשלום מעודכן:</td>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: left;">${total} ₪</td>
                        </tr>
                    </table>
                </div>

                ${notes ? `<div style="margin-top: 25px; padding: 18px; background: #fffbe6; border-radius: 16px; font-size: 14px; border: 1px solid #ffe58f; color: #d48806;"><strong style="display:block; margin-bottom: 5px;">הערות מהצוות:</strong> ${notes}</div>` : ''}

                <div style="margin-top: 35px; text-align: center;">
                    <a href="https://www.ml-tlv.com/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        לצפייה בהזמנה המעודכנת
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #aaa; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getAdminOrderUpdatedTemplate = (orderId, customerName, total, deliveryMethod, changesSummary = []) => {
    let changesHtml = '';
    if (changesSummary && changesSummary.length > 0) {
        changesHtml = `
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 900; color: #0284c7;">פירוט השינויים שבוצעו:</h3>
                <ul style="margin: 0; padding-right: 20px; color: #0369a1; font-size: 14px; line-height: 1.8;">
                    ${changesSummary.map(change => `<li style="margin-bottom: 5px;">${change}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הזמנה #${orderId} עודכנה (מנהל)</h1>
                
                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666;">
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">לקוח:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">${customerName}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">שיטת מסירה:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">${deliveryMethod === 'mail' ? 'משלוח' : 'איסוף עצמי'}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top: 1px dashed #e5e5e5; padding-top: 16px;"></td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: right;">סכום חדש:</td>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: left;">${total} ₪</td>
                        </tr>
                    </table>
                </div>
                
                ${changesHtml}
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/admin/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        למעבר לניהול הזמנות
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #aaa; font-size: 11px;">
                ml_tlv Admin Notification
            </div>
        </div>
    `;
};

export const getStatusUpdateTemplate = (orderId, name, status, messageBody) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
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
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getUserWelcomeTemplate = (firstName) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000;">ברוכים הבאים ל-ml_tlv! ✨</h1>
                <p style="margin: 0 0 25px; color: #666;">היי ${firstName || 'יקיר/ה'},</p>
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
            
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;
};

export const getAdminNewOrderTemplate = (orderId, customerName, total, items, deliveryMethod, shippingCost, phoneNumber, orderDate) => {
    const itemsContent = Array.isArray(items) ? items.map(item => `
        <li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #000; font-size: 14px;">${item.name || (item.brand + ' ' + item.model)}</strong>
                <div style="color: #666; font-size: 12px; margin-top: 4px;">${item.is_discovery_set ? formatDiscoverySize(item.volume_label) : `${item.size || ''} מ"ל`}</div>
            </div>
            <div style="font-weight: bold; background: #f8f8f8; padding: 4px 10px; border-radius: 8px; font-size: 14px;">x${item.quantity || 1}</div>
        </li>
    `).join('') : items;

    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="display: inline-block; background-color: #fef08a; color: #854d0e; font-size: 12px; font-weight: 900; padding: 6px 12px; border-radius: 20px; margin-bottom: 15px;">הזמנה חדשה במערכת</div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #000;">הזמנה #${orderId}</h1>
                </div>
                
                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666;">
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">תאריך:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">${orderDate || ''}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">לקוח:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">${customerName}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">טלפון:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;" dir="ltr">${phoneNumber || 'לא הוזן'}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">שיטת משלוח:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">${deliveryMethod}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top: 1px dashed #e5e5e5; padding-top: 16px;"></td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: right;">סה"כ שולם:</td>
                            <td style="font-size: 18px; font-weight: 900; color: #16a34a; text-align: left;">${total} ₪</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 900; color: #000; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">פירוט פריטים:</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">${itemsContent}</ul>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/admin/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        לניהול ההזמנה במערכת
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #aaa; font-size: 11px;">
                ml_tlv Admin Notification
            </div>
        </div>
    `;
};

export const getAdminNewUserTemplate = (user) => {
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 900; padding: 6px 12px; border-radius: 20px; margin-bottom: 15px;">משתמש חדש במערכת</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #000;">הצטרפות חדשה! ✨</h1>
                </div>
                
                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">שם המשתמש:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: left;"><strong style="color: #000;">${user.first_name || ''} ${user.last_name || ''}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; text-align: right;">אימייל:</td>
                            <td style="padding: 10px 0; text-align: left;"><strong style="color: #000;" dir="ltr">${user.email}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/admin/users" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        לניהול משתמשים
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #aaa; font-size: 11px;">
                ml_tlv Admin Notification
            </div>
        </div>
    `;
};


export const getBackInStockTemplate = (product) => {
    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com'}/product/${product.id}`;
    
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">

            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הוא חזר! 🎉</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">היי, יש לנו חדשות מעולות בשבילך!</p>
                
                <p style="text-align: center; margin-bottom: 25px;">
                    הבושם שחיכית לו חזר למלאי וזמין כעת לרכישה באתר.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <img src="${getAbsoluteImageUrl(product.imageUrl || product.image_url) || 'https://www.ml-tlv.com/logo-black.png'}" alt="${product.brand} ${product.model}" style="max-width: 220px; height: auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background-color: #ffffff; padding: 10px;" />
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
            
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
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
        'order_pdf_form': {
            subject: 'טופס הזמנה - ml_tlv #{{orderId}}',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הזמנתך מאושרת ומצורפת כ-PDF 📄</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">היי {{name}}, הזמנה מספר <strong>#{{orderId}}</strong> מצורפת למייל זה כקובץ PDF.</p>
                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5; text-align: center;">
                    <p style="margin: 0; color: #333; font-size: 14px;">תוכל למצוא בקובץ המצורף את כל פרטי ההזמנה שלך כולל פירוט מוצרים, מחירי המוצרים, ושיטת השילוח שבחרת.</p>
                </div>
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.ml-tlv.com/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לצפייה בפרטי ההזמנה באתר</a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
            `
        },
        'order_confirmation': {
            subject: 'אישור הזמנה #{{orderId}} - ml_tlv',
            content_html: getOrderConfirmationTemplate('{{orderId}}', '{{itemsHtml}}', '{{total}}', '{{freeSamples}}', '{{notesHtml}}', '{{deliveryMethod}}', '{{shippingCost}}')
        },
        'admin_order_alert': {
            subject: 'הזמנה חדשה התקבלה! #{{orderId}} 🔥',
            content_html: getAdminNewOrderTemplate('{{orderId}}', '{{customerName}}', '{{total}}', '{{itemsHtmlAdmin}}', '{{deliveryMethod}}', '{{shippingCost}}', '{{phoneNumber}}', '{{orderDate}}')
        },
        'admin_user_alert': {
            subject: 'משתמש חדש נרשם למערכת! ✨',
            content_html: getAdminNewUserTemplate({ first_name: '{{firstName}}', last_name: '{{lastName}}', email: '{{email}}' })
        },
        'order_updated': {
            subject: 'עדכון חשוב לגבי הזמנה #{{orderId}} - ml_tlv',
            content_html: getOrderUpdatedTemplate('{{orderId}}', '{{name}}', '{{items}}', '{{total}}', '{{deliveryMethod}}', '{{shippingCost}}', '{{notes}}')
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
        'new_product': {
            subject: 'חדש באתר: {{brand}} {{model}} ✨ - ml_tlv',
            content_html: getNewProductTemplate({
                brand: '{{brand}}',
                model: '{{model}}',
                description: '{{description}}',
                price_2ml: '{{price_2ml}}',
                price_5ml: '{{price_5ml}}',
                price_10ml: '{{price_10ml}}',
                image_url: '{{imageUrl}}',
                id: '{{productId}}'
            })
        },
        'review_request': {
            subject: 'נשמח לשמוע מה דעתך! ⭐',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">איך הבשמים החדשים שלך? ⭐</h2>
                <p style="margin-bottom: 20px;">שלום {{name}},</p>
                <p>ראינו שקיבלת לא מזמן את ההזמנה שלך מאיתנו ואנחנו סקרנים לדעת איך הייתה חוויית השירות שלך!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.ml-tlv.com/review?id={{orderId}}&token={{token}}" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לדירוג השירות בקליק >></a>
                </div>

{{bonusText}}

            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'cart_recovery': {
            subject: 'שכחת משהו אצלנו... קח מתנה! 👀',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
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
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'contact_form_alert': {
            subject: 'פנייה חדשה מהאתר: {{name}}',
            content_html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e5e5e5; border-radius: 12px; padding: 25px;">
            <h2 style="margin-top: 0; color: #000;">פנייה חדשה מהאתר</h2>
            
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0;"><strong>מאת:</strong> {{name}}</p>
                <p style="margin: 0;"><strong>אימייל:</strong> {{email}}</p>
            </div>
            
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333;">תוכן ההודעה:</h3>
            <div style="white-space: pre-wrap; background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">{{message}}</div>
        </div>`
        },
        'educational': {
            subject: 'היי {{name}}, טיפים לשימוש נכון בבשמים שקיבלת! ✨',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">טיפים לשימוש נכון בבושם 💡</h1>
                <p style="text-align: center; color: #666; margin-bottom: 25px;">היי {{name}}, אנחנו מקווים שאתה נהנה מהניחוחות החדשים שלך!</p>
                <div style="background-color: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f5f5f5;">
                    <ul style="margin: 0; padding-right: 20px;">
                        <li style="margin-bottom: 12px;"><strong>הנקודות החמות:</strong> רסס על נקודות הדופק - צוואר, מפרקי הידיים, ואפילו מאחורי הברכיים.</li>
                        <li style="margin-bottom: 12px;"><strong>לא לשפשף!</strong> שפשוף הבושם לאחר הריסוס "שובר" את מולקולות הריח ומשנה את התפתחות הניחוח.</li>
                        <li style="margin-bottom: 12px;"><strong>לחות:</strong> בושם מחזיק מעמד טוב יותר על עור לח.</li>
                        <li style="margin-bottom: 0;"><strong>אחסון:</strong> שמור את הבשמים במקום קריר ומוצל בחדר.</li>
                    </ul>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'recommendations': {
            subject: 'המלצות אישיות (מערכת)',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">במיוחד בשבילך... המלצות ניחוחות שמחכות לך ✨</h1>
                <p style="text-align: center; color: #666; margin-bottom: 25px;">שלום {{name}}!<br>עבדנו קצת על הטעם האישי שלך והכנו לך המלצות מיוחדות:</p>
                <div style="background-color: #fdfaf6; padding: 20px; border-radius: 16px; margin: 20px 0;">
                    {{productsHtml}}
                </div>
                <p style="text-align: center; color: #666;">כל הניחוחות זמינים כדוגמיות להתנסות אצלנו באתר.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">למעבר לאתר >></a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'nurture_10_days': {
            subject: 'לא מצאת את הבושם שחיפשת? 🔍',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">אנחנו מביאים את הבושם בשבילך! 📦</h2>
                <p style="margin-bottom: 20px;">היי {{name}},</p>
                <p>שמנו לב שאת/ה כבר מספר ימים איתנו ב-ml_tlv! רצינו להזכיר לך שאם חיפשת בושם מסוים ולא מצאת אותו בקטלוג שלנו, זה לא הסוף.</p>
                <p style="margin-bottom: 25px;">בנינו עבורך במיוחד את עמוד <strong>בקשת בשמים</strong> - המקום בו תוכלי לבקש כל בושם שתרצי (גם את הנישתיים והנדירים שבהם) ואנחנו נדאג להביא אותו עבורך במידות קטנות!</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://www.ml-tlv.com/requests" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">לבקשת בושם מיוחד</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">נשמח להמשיך להפתיע אותך עם ניחוחות חדשים,</p>
                <p style="font-weight: bold; margin-top: 5px;">צוות ml_tlv</p>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'nurture_25_days': {
            subject: 'בוא/י למצוא את חתימת הריח הבאה שלך ✨',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">התאמה אישית של בשמים 🎯</h2>
                <p style="margin-bottom: 20px;">היי {{name}},</p>
                <p>למצוא את הבושם המושלם יכול להיות מאתגר, במיוחד כשיש כל כך הרבה אפשרויות מדהימות. בגלל זה יצרנו את הקסם הבא ב-ml_tlv.</p>
                <p style="margin-bottom: 25px;">היכנס/י לעמוד <strong>התאמת הבשמים</strong> שלנו. המערכת החכמה שלנו לומדת את הטעם שלך (הבשמים אליהם את/ה מתחבר/ת, התווים האהובים עליך) ומרכיבה לך רשימה מדויקת של בשמים שכנראה פשוט תתאהב/י בהם!</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://www.ml-tlv.com/admin/recommendations" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">למציאת ההתאמה המושלמת</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">נשמח להמשיך להפתיע אותך עם ניחוחות חדשים,</p>
                <p style="font-weight: bold; margin-top: 5px;">צוות ml_tlv</p>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'discovery_launch': {
            subject: 'הגיע הזמן לגלות את הריח הבא שלך ✨ - ml_tlv',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הגיע הזמן לגלות את הריח הבא שלך ✨</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">היי {{name}}, השקנו קטגוריה חדשה שאתה פשוט חייב להכיר!</p>
                <p style="margin-bottom: 20px; color: #333; text-align: center; font-size: 15px;">אנחנו נרגשים להציג את קטגוריית ה-<strong>Discovery Sets &amp; דוגמיות רשמיות</strong> שלנו.<br/>הדרך המושלמת לנסות, לחוות ולהתאהב בניחוחות יוקרתיים חדשים – לפני שמתחייבים לבקבוק מלא.</p>
                <div style="background-color: #111; color: #fff; padding: 30px; border-radius: 20px; text-align: center; margin: 25px 0;">
                    <div style="font-size: 14px; font-weight: 900; color: #ca8a04; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">⏱️ מבצע סוף שבוע יוצא לדרך</div>
                    <p style="margin: 0 0 15px; font-size: 13px; opacity: 0.8;">בכל יום חמישי עד שישי ב-18:00:</p>
                    <div style="font-size: 20px; font-weight: 900; margin-bottom: 10px; line-height: 1.5;">🎁 קונים 3 ערכות דיסקברי – מקבלים <span style="color: #fde047;">1 במתנה!</span><br/>🎁 קונים 8 דוגמיות רשמיות – מקבלים <span style="color: #fde047;">2 במתנה!</span></div>
                    <div style="font-size: 13px; opacity: 0.8; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">*ההנחה מתעדכנת אוטומטית בעגלת הקניות</div>
                </div>
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin: 25px 0;">
                    <p style="margin: 0; font-weight: 900; color: #000;">💡 מה זה בעצם Discovery Set?</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">ערכת דוגמיות שמרכזת את הניחוחות המובילים של המותג בבקבוקונים קטנים, כך שתוכלו להתנסות בכל אחד מהם על העור לפני שבוחרים את המועדף.</p>
                </div>
                <p style="margin-bottom: 20px; color: #333; text-align: center;">מוכן לצאת למסע חושני?</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/discovery-sets" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 35px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">לקטגוריה החדשה &gt;&gt;</a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'nurture_3_days': {
            subject: 'הכל בסדר? שמנו לב שלא מצאת את מה שחיפשת...',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 900; color: #000; text-align: center;">הכל בסדר? 💭</h2>
                <p style="margin-bottom: 20px;">היי {{name}}, שמנו לב שנרשמת לאתר שלנו לפני מספר ימים, אבל עדיין לא ביצעת הזמנה.</p>
                <p style="margin-bottom: 25px;">רצינו לשאול אם הכל בסדר - האם נתקלת בבעיה טכנית באתר? האם לא מצאת את הבושם שחיפשת? או אולי סתם הלכת לאיבוד בין כל האפשרויות?</p>
                <p style="margin-bottom: 25px;">אנחנו כאן כדי לעזור! השב למייל זה ונשמח להתאים לך בדיוק את הבושם שאתה מחפש ולענות על כל שאלה.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://www.ml-tlv.com/contact" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">ליצירת קשר איתנו</a>
                </div>
                <p style="color: #666; font-size: 14px;">נשמח לעמוד לשירותך,</p>
                <p style="font-weight: bold; margin-top: 5px;">צוות ml_tlv</p>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        },
        'monthly_discovery': {
            subject: 'מבצע הדיסקברי החודשי שלנו יוצא לדרך! ✨',
            content_html: `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">מבצע הדיסקברי החודשי שלנו מתחיל היום! ✨</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">היי {{name}}, יום רביעי הגיע וזה אומר ש... מבצע הדיסקברי שלנו חוזר!</p>
                <div style="background-color: #111; color: #fff; padding: 30px; border-radius: 20px; text-align: center; margin: 25px 0;">
                    <div style="font-size: 14px; font-weight: 900; color: #ca8a04; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">⏱️ המבצע החודשי שלנו</div>
                    <div style="font-size: 20px; font-weight: 900; margin-bottom: 10px; line-height: 1.5;">🎁 קונים 3 ערכות דיסקברי – מקבלים <span style="color: #fde047;">1 במתנה!</span><br/>🎁 קונים 8 דוגמיות רשמיות – מקבלים <span style="color: #fde047;">2 במתנה!</span></div>
                    <div style="font-size: 13px; opacity: 0.8; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">*ההנחה מתעדכנת אוטומטית בעגלת הקניות</div>
                </div>
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin: 25px 0;">
                    <p style="margin: 0; font-weight: 900; color: #000;">💡 תזכורת: מה זה Discovery Set?</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">ערכת דוגמיות שמרכזת את הניחוחות המובילים של המותג בבקבוקונים קטנים, כך שתוכלו להתנסות בכל אחד מהם על העור לפני שבוחרים את המועדף.</p>
                </div>
                <p style="margin-bottom: 20px; color: #333; text-align: center;">מוכן לצאת למסע חושני?</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/discovery-sets" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 35px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">למעבר לאתר &gt;&gt;</a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
        </div>`
        }
    };
}
