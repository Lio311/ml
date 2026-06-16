const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    await client.connect();

    try {
        const clientEmailHtml = `
<div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; background-color: #f9f9f9; padding: 20px;">
    <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://www.ml-tlv.com/logo.png" alt="ml_tlv logo" style="max-width: 150px; height: auto;" />
        </div>
        
        <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">המלצת החודש של מנהל האתר 👑</h1>
        <p style="margin: 0 0 25px; color: #666; text-align: center; font-size: 16px;">
            חודש {{month}} כבר כאן, ומנהל האתר שלנו בחר בקפידה 4 בשמים מנצחים במיוחד בשבילכם.
        </p>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin: 25px 0;">
            <h2 style="margin: 0 0 15px; font-size: 18px; font-weight: 900; color: #000; text-align: center;">הנבחרת של החודש</h2>
            {{productsHtml}}
        </div>

        <div style="background: linear-gradient(135deg, #000 0%, #333 100%); color: #fff; padding: 30px; border-radius: 20px; text-align: center; margin: 25px 0;">
            <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-bottom: 10px;">קוד קופון בלעדי ליומיים</div>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 3px; margin-bottom: 10px; background: rgba(255,255,255,0.1); display: inline-block; padding: 5px 20px; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.3);">
                {{couponCode}}
            </div>
            <div style="font-size: 16px; font-weight: bold;">10% הנחה על הבשמים המומלצים!</div>
            <div style="font-size: 12px; opacity: 0.6; margin-top: 10px;">מהר, המבצע פג תוקף בעוד 48 שעות!</div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.ml-tlv.com/catalog" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                לרכישה עכשיו &gt;&gt;
            </a>
        </div>
    </div>
    
    <div style="text-align: center; padding: 30px 0; color: #aaa; font-size: 11px;">
        <p>מייל זה נשלח אליך כי נרשמת לדיוור שלנו.</p>
        <p>ml - יוקרה בחתיכות קטנות</p>
    </div>
</div>
`;

        const managerAlertHtml = `
<div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; background-color: #f9f9f9; padding: 20px;">
    <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">פעולה נדרשת: המלצת החודש ⚠️</h1>
        <p style="margin: 0 0 25px; color: #666; text-align: center; font-size: 16px;">
            שלום מנהל יקר,<br />
            הגיע הזמן לבחור את הבשמים להמלצת החודש ({{month}}).
        </p>

        <div style="background-color: #fff8f1; border: 1px solid #fed7aa; padding: 20px; border-radius: 16px; margin: 25px 0;">
            <p style="margin: 0; color: #c2410c; font-size: 14px; text-align: center; font-weight: bold;">
                עליך לבחור 4 בשמים. אם לא תבחר עד ה-28 לחודש, המייל האוטומטי לא יישלח ללקוחות.
            </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.ml-tlv.com/admin/monthly-recommendation" style="display: inline-block; background-color: #3b82f6; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(59,130,246,0.3);">
                לבחירת הבשמים כעת &gt;&gt;
            </a>
        </div>
    </div>
</div>
`;

        // Insert client email template
        await client.query(`
            INSERT INTO email_templates (slug, name, subject, content_html, type, is_active)
            VALUES ('monthly_recommendation', 'המלצת החודש', 'המלצת החודש של מנהל האתר 👑', $1, 'automated', true)
            ON CONFLICT (slug) DO UPDATE SET content_html = EXCLUDED.content_html, is_active = true
        `, [clientEmailHtml]);

        // Insert manager alert template
        await client.query(`
            INSERT INTO email_templates (slug, name, subject, content_html, type, is_active)
            VALUES ('admin_monthly_recommendation_reminder', 'תזכורת למנהל - המלצת החודש', 'תזכורת: בחר בשמים להמלצת החודש', $1, 'automated', true)
            ON CONFLICT (slug) DO UPDATE SET content_html = EXCLUDED.content_html, is_active = true
        `, [managerAlertHtml]);

        console.log("Templates inserted successfully!");

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
