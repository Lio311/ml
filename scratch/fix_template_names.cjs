const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const hebrewNames = {
    'order_confirmation': 'אישור הזמנה ללקוח',
    'admin_order_alert': 'התראת הזמנה חדשה (למנהל)',
    'admin_user_alert': 'התראת נרשם חדש (למנהל)',
    'admin_alert': 'התראה כללית (למנהל)',
    'order_updated': 'עדכון הזמנה ללקוח',
    'status_update': 'עדכון סטטוס הזמנה',
    'welcome': 'ברוכים הבאים (לנרשם חדש)',
    'back_in_stock': 'מוצר חזר למלאי',
    'new_product': 'מוצר חדש באתר',
    'review_request': 'בקשת חוות דעת מלקוח',
    'cart_recovery': 'שחזור עגלה נטושה',
    'contact_form_alert': 'התראת פנייה מטופס צור קשר',
    'nurture_10_days': 'טיפוח 10 ימים - בקשת בושם',
    'nurture_25_days': 'טיפוח 25 ימים - התאמה אישית',
    'educational': 'מייל חינוכי (טיפים לשימוש בבושם)',
    'recommendations': 'המלצות בשמים מותאמות אישית',
    'review_reward': 'תגמול על חוות דעת (קופון 10%)',
};

async function fix() {
    console.log("🔤 Fixing template names to Hebrew...");
    const client = await pool.connect();
    try {
        for (const [slug, name] of Object.entries(hebrewNames)) {
            const res = await client.query(
                'UPDATE email_templates SET name = $1 WHERE slug = $2 AND (name = slug OR name IS NULL OR name = $2)',
                [name, slug]
            );
            if (res.rowCount > 0) {
                console.log(`  ✅ ${slug} → ${name}`);
            }
        }
        console.log("🎉 Done!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
