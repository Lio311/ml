const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const systemAutomations = [
    // ===== הזמנות =====
    {
        name: "אישור קבלת הזמנה",
        description: "נשלח אוטומטית ללקוח מיד לאחר ביצוע הזמנה בהצלחה באתר.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "לקוח השלים הזמנה", triggerType: "new_order", category: "הזמנות" } },
            { id: "2", type: "action", position: { x: 500, y: 150 }, data: { label: "שליחת מייל: אישור הזמנה", actionType: "email", target: "customer", description: "מייל עם פרטי ההזמנה, פריטים, סכום וקבלה.", templateSlug: "order_confirmation" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } } ]
    },
    {
        name: "התראת הזמנה חדשה (למנהל)",
        description: "התראה שמגיעה ישירות אליך כשלקוח מבצע הזמנה — כולל פרטי הלקוח, רשימת פריטים, סכום, שיטת משלוח וטלפון.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "לקוח השלים הזמנה", triggerType: "new_order", category: "הזמנות" } },
            { id: "2", type: "action", position: { x: 500, y: 150 }, data: { label: "שליחת מייל למנהל", actionType: "admin_notify", target: "admin", description: "כולל: שם לקוח, טלפון, פריטים, סכום, שיטת משלוח.", templateSlug: "admin_order_alert" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#475569", strokeWidth: 2 } } ]
    },

    // ===== משתמשים =====
    {
        name: "מייל ברוכים הבאים (למשתמש חדש)",
        description: "מייל קבלת פנים חם לכל לקוח שנרשם לאתר בפעם הראשונה.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "משתמשים" } },
            { id: "2", type: "action", position: { x: 500, y: 150 }, data: { label: "שליחת מייל: ברוכים הבאים", actionType: "email", target: "customer", description: "הכרות קצרה עם האתר וקישור לקטלוג הבשמים.", templateSlug: "welcome" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } } ]
    },
    {
        name: "התראת נרשם חדש (למנהל)",
        description: "מייל שמיידע אותך על לקוח חדש שנרשם באתר — כולל שם ואימייל.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "משתמשים" } },
            { id: "2", type: "action", position: { x: 500, y: 150 }, data: { label: "שליחת התראה למנהל", actionType: "admin_notify", target: "admin", description: "כולל שם פרטי, משפחה וכתובת אימייל.", templateSlug: "admin_user_alert" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#475569", strokeWidth: 2 } } ]
    },

    // ===== שחזור עגלה =====
    {
        name: "שחזור עגלה נטושה (+5% הנחה)",
        description: "נשלח ללקוחות שהוסיפו מוצרים לעגלה ולא השלימו את הרכישה. כולל יצירת קופון ייחודי ושליחת מייל שחזור.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 50, y: 250 }, data: { label: "עגלה נטושה במערכת", triggerType: "abandoned_cart", category: "שיווק" } },
            { id: "2", type: "wait", position: { x: 320, y: 250 }, data: { label: "המתנה", waitValue: "3", waitUnit: "hours" } },
            { id: "3", type: "action", position: { x: 600, y: 50 }, data: { label: "יצירת קופון אישי", actionType: "coupon", target: "customer", description: "קופון SAVE5-XXXXX, 5% הנחה, תקף 24 שעות. צינון: 7 ימים.", discount_percent: 5, coupon_validity_hours: 24, cooldown_days: 7 } },
            { id: "4", type: "action", position: { x: 600, y: 450 }, data: { label: "שליחת מייל שחזור", actionType: "email", target: "customer", description: "מייל 'שכחת משהו?' עם קוד הקופון וקישור לעגלה.", templateSlug: "cart_recovery" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-4", source: "2", target: "4", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },

    // ===== טיפוח לקוחות =====
    {
        name: "טיפוח לקוחות: 10 ימים (בקשת בושם)",
        description: "מייל שנשלח 10 ימים לאחר הרשמה — מזמין את הלקוח לבקש בושם שאינו בקטלוג.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 100, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "שימור לקוחות" } },
            { id: "2", type: "wait", position: { x: 350, y: 150 }, data: { label: "המתנה", waitValue: "10", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 600, y: 150 }, data: { label: "מייל: שירות בקשת בושם", actionType: "email", target: "customer", description: "הזמנה להזמין בושם שאינו בקטלוג דרך עמוד הבקשות.", templateSlug: "nurture_10_days" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },
    {
        name: "טיפוח לקוחות: 25 ימים (התאמה אישית)",
        description: "מייל שנשלח 25 ימים לאחר הרשמה — מזמין את הלקוח לשאלון התאמת בשמים אישי.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 100, y: 150 }, data: { label: "משתמש נרשם לאתר", triggerType: "new_user", category: "שימור לקוחות" } },
            { id: "2", type: "wait", position: { x: 350, y: 150 }, data: { label: "המתנה", waitValue: "25", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 600, y: 150 }, data: { label: "מייל: שאלון התאמת בשמים", actionType: "email", target: "customer", description: "עידוד הלקוח למצוא את חתימת הריח הבאה שלו.", templateSlug: "nurture_25_days" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },

    // ===== מייל חינוכי =====
    {
        name: "מייל חינוכי (טיפים לשימוש בבושם)",
        description: "נשלח 3 ימים לאחר השלמת הזמנה — טיפים לשימוש נכון בבושם (נקודות חמות, אחסון, לחות).",
        nodes: [
            { id: "1", type: "trigger", position: { x: 100, y: 150 }, data: { label: "הזמנה הושלמה", triggerType: "order_status_changed", customTrigger: "completed", category: "הזמנות" } },
            { id: "2", type: "wait", position: { x: 350, y: 150 }, data: { label: "המתנה", waitValue: "3", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 600, y: 150 }, data: { label: "מייל: טיפים לשימוש בבושם", actionType: "email", target: "customer", description: "נקודות חמות, אחסון, ושימוש בלחות לפני ריסוס.", templateSlug: "educational" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },

    // ===== חוות דעת =====
    {
        name: "בקשת כתיבת חוות דעת מלקוח",
        description: "נשלח 7 ימים לאחר השלמת ההזמנה — מבקש מהלקוח לדרג את חוויית השירות ומבטיח מתנה.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 100, y: 150 }, data: { label: "הזמנה הושלמה", triggerType: "order_status_changed", customTrigger: "completed", category: "חוות דעת" } },
            { id: "2", type: "wait", position: { x: 350, y: 150 }, data: { label: "המתנה", waitValue: "7", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 600, y: 150 }, data: { label: "מייל: בקשת חוות דעת", actionType: "email", target: "customer", description: "קישור לעמוד הדירוג עם הבטחה לקופון 10%.", templateSlug: "review_request" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },
    {
        name: "תגמול על חוות דעת (10% הנחה)",
        description: "כשלקוח משאיר חוות דעת — נוצר לו קופון SAVE10 ייחודי ונשלח מייל תודה עם הקופון.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 50, y: 250 }, data: { label: "לקוח פרסם ביקורת", triggerType: "custom", customTrigger: "review_submitted", category: "חוות דעת" } },
            { id: "2", type: "action", position: { x: 420, y: 50 }, data: { label: "יצירת קופון 10%", actionType: "coupon", target: "customer", description: "קופון SAVE10-XXXXX, 10% הנחה, תקף 7 ימים. חד-פעמי לכל לקוח.", discount_percent: 10, coupon_validity_hours: 168, cooldown_days: 0 } },
            { id: "3", type: "action", position: { x: 420, y: 450 }, data: { label: "מייל: תודה + קופון", actionType: "email", target: "customer", description: "מייל תודה על הדירוג עם קוד הקופון.", templateSlug: "review_reward" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },

    // ===== המלצות =====
    {
        name: "המלצות בשמים מותאמות אישית",
        description: "30 ימים לאחר הזמנה שאושרה ידנית — נשלח מייל עם בשמים שמתאימים ללקוח על בסיס רכישות קודמות.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 100, y: 150 }, data: { label: "הזמנה הושלמה", triggerType: "order_status_changed", customTrigger: "completed", category: "שיווק" } },
            { id: "2", type: "wait", position: { x: 350, y: 150 }, data: { label: "המתנה", waitValue: "30", waitUnit: "days" } },
            { id: "3", type: "action", position: { x: 600, y: 150 }, data: { label: "מייל: המלצות אישיות", actionType: "email", target: "customer", description: "מייל עם בשמים דומים מבוסס על תווי ריח מההזמנה.", templateSlug: "recommendations" } }
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#16a34a", strokeWidth: 2 } }
        ]
    },

    // ===== כללי =====
    {
        name: "התראת פנייה - טופס צור קשר",
        description: "מייל שקופץ אליך ברגע שלקוח שולח הודעה דרך טופס צור קשר — כולל שם, מייל ותוכן ההודעה.",
        nodes: [
            { id: "1", type: "trigger", position: { x: 150, y: 150 }, data: { label: "מילוי טופס צור קשר", triggerType: "custom", customTrigger: "contact_form", category: "כללי" } },
            { id: "2", type: "action", position: { x: 500, y: 150 }, data: { label: "העברת הפנייה למנהל", actionType: "admin_notify", target: "admin", description: "כולל: שם, כתובת מייל ותוכן ההודעה.", templateSlug: "contact_form_alert" } }
        ],
        edges: [ { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#475569", strokeWidth: 2 } } ]
    }
];

async function seed() {
    console.log("🌱 Seeding complete system automations...");
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
