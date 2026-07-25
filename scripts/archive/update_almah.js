const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const almahData = {
  title: "מורשת בוטנית ורוקחות ספרדית: אמנות הבישום של Almah Parfums 1948",
  description: "בית הבישום Almah Parfums 1948, אשר צמח מתוך עסק משפחתי לשמנים אתריים שנוסד בברצלונה ב-1948, מייצג חיבור נדיר בין מסורת רוקחות עתיקה לבישום מודרני מרהיב. תחת שרביטו של הבשם ג'ורדי מגראנס (Jordi Magrans), דור רביעי למשפחת רוקחים ומזקקים, המותג יוצר ניחוחות יוצאי דופן תוך שימוש בלעדי בתמציות טבעיות המופקות במפעל המשפחתי. הקולקציות של אלמה שואבות השראה ממסעותיו של ג'ורדי בעולם ומזיכרונות ילדותו במעבדות הבישום. ב-ml_tlv בחרנו להביא לכם את הפנינה הספרדית הזו, המציעה חוויה ריחנית אורגנית, עמוקה ומרגשת. כל ניחוח מספר סיפור אקזוטי ייחודי, החל מחופים שטופי שמש ועד יערות ירוקים, עם חתימה אישית המבטיחה נוכחות אלגנטית ומתוחכמת.",
  highlights: "שימוש בתמציות ושמנים אתריים מהמפעל המשפחתי בברצלונה, ייצור ארטיזנלי בכמויות קטנות, ורכיבים בוטניים נדירים מרחבי העולם.",
  perfumer: "ג'ורדי מגראנס (Jordi Magrans)"
};

async function updateAlmah() {
  await pool.query(
    'UPDATE brands SET title = $1, description = $2, highlights = $3, perfumer = $4 WHERE name ILIKE $5',
    [almahData.title, almahData.description, almahData.highlights, almahData.perfumer, '%Almah%']
  );
  console.log('Almah updated!');
  process.exit(0);
}

updateAlmah();
