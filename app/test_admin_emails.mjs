import { config } from 'dotenv';
config({ path: '../.env.local' });
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const getAbsoluteImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://www.ml-tlv.com${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getAdminNewOrderTemplate = (orderId, customerName, total, items, deliveryMethod, shippingCost, phoneNumber, orderDate) => {
    const itemsContent = Array.isArray(items) ? items.map(item => `
        <li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #000; font-size: 14px;">${item.name || (item.brand + ' ' + item.model)}</strong>
                <div style="color: #666; font-size: 12px; margin-top: 4px;">${item.size || ''} מ"ל</div>
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


async function run() {
    const email = 'lior31197@gmail.com';
    
    console.log("Sending getAdminNewOrderTemplate...");
    const orderItems = [
        { name: 'Baccarat Rouge 540', size: 5, quantity: 2 },
        { name: 'Aventus Creed', size: 10, quantity: 1 }
    ];
    await transporter.sendMail({
        from: '"ml. Admin" <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: 'הזמנה חדשה באתר! - #1001',
        html: getAdminNewOrderTemplate(1001, 'ליאור בדיקה', '450.00', orderItems, 'משלוח עד הבית', '35.00', '050-1234567', '07/06/2026 15:00')
    });

    console.log("Sending getAdminOrderUpdatedTemplate...");
    await transporter.sendMail({
        from: '"ml. Admin" <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: 'הזמנה #1002 עודכנה על ידי מנהל',
        html: getAdminOrderUpdatedTemplate(1002, 'ליאור מנהל', '550.00', 'mail', ['הוסר מוצר X', 'דמי משלוח עודכנו לחינם'])
    });

    console.log("Sending getAdminNewUserTemplate...");
    await transporter.sendMail({
        from: '"ml. Admin" <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: 'משתמש חדש במערכת! ✨',
        html: getAdminNewUserTemplate({ first_name: 'ישראל', last_name: 'ישראלי', email: 'test@ml-tlv.com' })
    });

    console.log("All test emails sent.");
}

run().catch(console.error);
