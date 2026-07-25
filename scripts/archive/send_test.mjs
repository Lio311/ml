import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function run() {
    const unsubscribeLink = 'https://www.ml-tlv.com/unsubscribe';
    const unsubscribeHtml = `
        <div dir="rtl" style="margin-top: 40px; padding: 25px 20px; background-color: #fafafa; border-radius: 12px; text-align: center; font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #888;">
                קיבלת מייל זה כי נרשמת לעדכונים מ-<strong>ml_tlv</strong>.
            </p>
            <a href="${unsubscribeLink}" style="display: inline-block; font-size: 11px; color: #555; text-decoration: none; border-bottom: 1px dashed #ccc; padding-bottom: 2px; transition: color 0.2s;">
                להסרה מרשימת הדיוור (Unsubscribe)
            </a>
        </div>
    `;

    console.log("Sending marketing email with unsubscribe link...");
    await transporter.sendMail({
        from: '"ml_tlv" <' + process.env.EMAIL_USER + '>',
        to: 'lior31197@gmail.com',
        subject: 'טסט לשורת ביטול דיוור',
        html: '<div dir="rtl" style="padding: 20px; font-family: Arial;">זהו תוכן מייל שיווקי לדוגמה כדי לבדוק את שורת ביטול הדיוור החדשה המעוצבת.</div>' + unsubscribeHtml
    });

    const changesSummary = [
        'סכום ההזמנה הכולל עודכן מ-150 ₪ ל-180 ₪',
        'שיטת המסירה שונתה מאיסוף עצמי למשלוח',
        'עודכנו פריטים או כמויות של מוצרים בהזמנה'
    ];

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

    const itemsTable = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0;">
            <thead style="background-color: #fafafa;">
                <tr>
                    <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase;">מוצר</th>
                    <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase;">כמות</th>
                    <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 900; color: #666; text-transform: uppercase;">מחיר</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #f5f5f5;">
                    <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #333;">
                        <span style="vertical-align: middle;">Creed Aventus (5 מ"ל)</span>
                    </td>
                    <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #333;">1</td>
                    <td style="padding: 12px 10px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">180 ₪</td>
                </tr>
            </tbody>
        </table>`;

    const customerHtml = `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הזמנה #1024 עודכנה</h1>
                <p style="margin-bottom: 20px;">היי ליאור,</p>
                <p style="margin-bottom: 25px; color: #555;">ההזמנה שלך עודכנה על ידי צוות ml_tlv. להלן הפרטים המעודכנים:</p>
                
                ${changesHtml}
                
                ${itemsTable}

                <div style="background-color: #fafafa; padding: 20px; border-radius: 16px; border: 1px solid #f0f0f0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #555;">
                        <tr>
                            <td style="padding: 8px 0; text-align: right;">שיטת מסירה:</td>
                            <td style="padding: 8px 0; text-align: left;"><strong style="color: #000;">משלוח</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0 16px 0; text-align: right;">דמי משלוח:</td>
                            <td style="padding: 8px 0 16px 0; text-align: left;">
                                <strong style="color: #16a34a;">30 ₪</strong>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top: 1px dashed #e5e5e5; padding-top: 16px;"></td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: right;">סה"כ לתשלום מעודכן:</td>
                            <td style="font-size: 18px; font-weight: 900; color: #000; text-align: left;">180 ₪</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 25px; padding: 18px; background: #fffbe6; border-radius: 16px; font-size: 14px; border: 1px solid #ffe58f; color: #d48806;"><strong style="display:block; margin-bottom: 5px;">הערות מהצוות:</strong> הוספנו דוגמית במתנה!</div>

                <div style="margin-top: 35px; text-align: center;">
                    <a href="https://www.ml-tlv.com/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        לצפייה בהזמנה המעודכנת
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding: 30px 0; color: #aaa; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;

    console.log("Sending order updated to customer...");
    await transporter.sendMail({
        from: '"ml_tlv" <' + process.env.EMAIL_USER + '>',
        to: 'lior31197@gmail.com',
        subject: 'הזמנתך #1024 עודכנה - ml_tlv (טסט לקוח)',
        html: customerHtml
    });

    const adminChangesHtml = `
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333;">פירוט השינויים שבוצעו:</h3>
            <ul style="margin: 0; padding-right: 20px; color: #555; font-size: 14px;">
                ${changesSummary.map(change => `<li style="margin-bottom: 5px;">${change}</li>`).join('')}
            </ul>
        </div>
    `;
    const adminHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e5e5e5; border-radius: 12px; padding: 25px;">
            <h2 style="margin-top: 0; color: #000;">הזמנה #1024 עודכנה על ידי מנהל</h2>
            <p><strong>לקוח:</strong> ליאור</p>
            <p><strong>סכום חדש:</strong> 180 ₪</p>
            <p><strong>שיטת מסירה:</strong> משלוח</p>
            
            ${adminChangesHtml}
            
            <p style="margin-top: 25px;"><a href="https://www.ml-tlv.com/admin/orders" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">למעבר לניהול הזמנות</a></p>
        </div>
    `;

    console.log("Sending order updated to admin...");
    await transporter.sendMail({
        from: '"ml_tlv" <' + process.env.EMAIL_USER + '>',
        to: 'lior31197@gmail.com',
        subject: 'הזמנה #1024 עודכנה בהצלחה 🔥 (טסט מנהל)',
        html: adminHtml
    });

    console.log("Done");
    process.exit(0);
}

run().catch(console.error);
