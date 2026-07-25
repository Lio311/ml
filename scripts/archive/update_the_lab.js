require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const theLabTitle = "אמנות הרוקחות המודרנית: The Lab";
const theLabDesc = "המותג The Lab (דה לאב) מביא אל קדמת הבמה את הקסם של המעבדה המודרנית. מתוך חזון לחשוף את תהליכי היצירה ולהתמקד באיכות בלתי מתפשרת של חומרי הגלם, המותג מציע יצירות ריחניות מוקפדות ומינימליסטיות. כל בושם נרקח בקפידה תוך שילוב של מדע ואמנות, ומזמין את העונדים אותו לחוויה אינטימית ומרתקת של גילוי. עם גישה נקייה, עכשווית ומדויקת, The Lab הוא הבחירה המושלמת לאוהבי נישה שמחפשים תחכום לא מתאמץ.";
const theLabPerfumer = "רוקחים מומחים מבית The Lab";
const theLabHighlights = "גישה מעבדתית ומינימליסטית, התמקדות בחומרי גלם טהורים, קומפוזיציות נקיות, מודרניות ומתוחכמות.";

pool.query(
    'UPDATE brands SET title = $1, description = $2, perfumer = $3, highlights = $4 WHERE name = $5',
    [theLabTitle, theLabDesc, theLabPerfumer, theLabHighlights, 'The Lab']
).then(() => {
    console.log("Updated The Lab brand description in DB.");
    process.exit(0);
}).catch(console.error);
