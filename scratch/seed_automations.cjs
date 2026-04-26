const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const systemAutomations = [
    {
        name: "אישור קבלת הזמנה",
        description: "נשלח אוטומטית ללקוח מיד לאחר ביצוע הזמנה בהצלחה באתר.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 250, y: 150 }, data: { label: "לקוח השלים הזמנה", triggerType: "new_order", category: "הזמנות" } },
            { id: "2", type: "action", position: { x: 650, y: 150 }, data: { label: "שליחת מייל: אישור הזמנה", actionType: "email", target: "customer", description: "מייל עם פרטי ההזמנה וקבלה.", templateSlug: "order_confirmation" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } } ]
    },
    {
        name: "התראת הזמנה חדשה (למנהל)",
        description: "התראה שמגיעה ישירות אליך כשלקוח מבצע הזמנה.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 250, y: 150 }, data: { label: "לקוח השלים הזמנה", triggerType: "new_order", category: "הזמנות" } },
            { id: "2", type: "action", position: { x: 650, y: 150 }, data: { label: "התראה במייל למנהל", actionType: "admin_notify", target: "admin", description: "מכיל את פרטי הלקוח, פריטים וסכום.", templateSlug: "admin_order_alert" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#000", strokeWidth: 2 } } ]
    },
    {
        name: "מייל ברוכים הבאים (למשתמש חדש)",
        description: "מייל קבלת פנים חם לכל לקוח שנרשם לאתר בפעם הראשונה.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 250, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "משתמשים" } },
            { id: "2", type: "action", position: { x: 650, y: 150 }, data: { label: "שליחת מייל: ברוכים הבאים", actionType: "email", target: "customer", description: "הכרות קצרה עם ml_tlv וקטלוג הבשמים.", templateSlug: "welcome" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } } ]
    },
    {
        name: "התראת נרשם חדש (למנהל)",
        description: "מייל שמיידע אותך על לקוח חדש שנרשם באתר.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 250, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "משתמשים" } },
            { id: "2", type: "action", position: { x: 650, y: 150 }, data: { label: "התראה במייל למנהל", actionType: "admin_notify", target: "admin", description: "כולל שם וכתובת אימייל של הנרשם.", templateSlug: "admin_user_alert" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#000", strokeWidth: 2 } } ]
    },
    {
        name: "שחזור עגלה נטושה (+5% הנחה)",
        description: "נשלח אוטומטית ללקוחות שהוסיפו מוצרים לעגלה ולא קנו.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "עגלה נטושה במערכת", triggerType: "abandoned_cart", category: "שיווק" } },
            { id: "2", type: "wait", position: { x: 400, y: 150 }, data: { label: "המתנה", waitValue: "3", waitUnit: "hours" } },
            { id: "3", type: "action", position: { x: 700, y: 150 }, data: { label: "שליחת מייל + קופון", actionType: "coupon", target: "customer", description: "מייל שחזור עם קופון 5% הנחה.", discount_percent: 5, coupon_validity_hours: 24, cooldown_days: 7, templateSlug: "cart_recovery" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },
    {
        name: "טיפוח לקוחות: 10 ימים (בקשת בושם)",
        description: "מייל שנשלח לאחר 10 ימים להזמין את הלקוח להשתמש בעמוד הבקשות.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "שימור לקוחות" } },
            { id: "2", type: "wait", position: { x: 400, y: 150 }, data: { label: "המתנה", waitValue: "10", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 700, y: 150 }, data: { label: "מייל: שירות בקשת בושם", actionType: "email", target: "customer", description: "הזמנה להזמין בושם שאינו בקטלוג.", templateSlug: "nurture_10_days" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },
    {
        name: "טיפוח לקוחות: 25 ימים (התאמה אישית)",
        description: "מייל שנשלח לאחר 25 ימים להזמין את הלקוח להתאמה אישית.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "שימור לקוחות" } },
            { id: "2", type: "wait", position: { x: 400, y: 150 }, data: { label: "המתנה", waitValue: "25", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 700, y: 150 }, data: { label: "מייל: שאלון התאמת בשמים", actionType: "email", target: "customer", description: "עידוד הלקוח למצוא את חתימת הריח הבאה שלו.", templateSlug: "nurture_25_days" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },
    {
        name: "בקשת כתיבת חוות דעת מלקוח",
        description: "נשלח אוטומטית זמן מה לאחר ביצוע הזמנה, מבקש מהלקוח לדרג.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "סטטוס הזמנה הושלם", triggerType: "order_status_changed", customTrigger: "completed", category: "חוות דעת" } },
            { id: "2", type: "wait", position: { x: 400, y: 150 }, data: { label: "המתנה", waitValue: "7", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 700, y: 150 }, data: { label: "מייל: נשמח לשמוע מה דעתך", actionType: "email", target: "customer", description: "קישור לעמוד הדירוג עם הבטחה למתנה.", templateSlug: "review_request" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },
    {
        name: "תגמול על חוות דעת (10% הנחה)",
        description: "נשלח מידית ללקוח לאחר שכתב חוות דעת על מוצר/שירות.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 250, y: 150 }, data: { label: "לקוח פרסם ביקורת", triggerType: "custom", customTrigger: "review_submitted", category: "חוות דעת" } },
            { id: "2", type: "action", position: { x: 650, y: 150 }, data: { label: "מייל: תודה על הדירוג + מתנה", actionType: "coupon", target: "customer", description: "נשלח מייל עם קופון SAVE10 דינאמי." } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } } ]
    },
    {
        name: "התראת פנייה - טופס צור קשר",
        description: "מייל שקופץ אליך ברגע שלקוח משאיר פרטים או שואל שאלה בטופס.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 250, y: 150 }, data: { label: "מילוי טופס צור קשר", triggerType: "custom", customTrigger: "contact_form", category: "כללי" } },
            { id: "2", type: "action", position: { x: 650, y: 150 }, data: { label: "העברת הפנייה למנהל", actionType: "admin_notify", target: "admin", description: "כולל שם, טלפון/מייל ותוכן ההודעה.", templateSlug: "contact_form_alert" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#000", strokeWidth: 2 } } ]
    }
];

async function seed() {
    console.log("🌱 Seeding system automations (with Wait nodes)...");
    const client = await pool.connect();
    try {
        for (const auto of systemAutomations) {
            const existing = await client.query('SELECT id FROM workflows WHERE name = $1', [auto.name]);
            if (existing.rows.length === 0) {
                await client.query(
                    'INSERT INTO workflows (name, description, nodes, edges, is_active) VALUES ($1, $2, $3, $4, true)',
                    [auto.name, auto.description, JSON.stringify(auto.nodes), JSON.stringify(auto.edges)]
                );
                console.log(`✅ Added: ${auto.name}`);
            } else {
                await client.query(
                    'UPDATE workflows SET description = $1, nodes = $2, edges = $3 WHERE id = $4',
                    [auto.description, JSON.stringify(auto.nodes), JSON.stringify(auto.edges), existing.rows[0].id]
                );
                console.log(`🔄 Updated: ${auto.name}`);
            }
        }
        console.log("🎉 Seeding complete!");
    } catch (err) {
        console.error("Error seeding automations:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
