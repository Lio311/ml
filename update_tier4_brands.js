const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 

const tier4Updates = [
  {
    name: 'ASMR Fragrances',
    title: 'חוויה חושית עמוקה: ASMR Fragrances',
    description: 'ASMR Fragrances הוא מותג צרפתי חדשני המשלב בין עולם ה-ASMR (תגובת חושית עמוקה) לבין אמנות הבישום. כל ניחוח נועד לעורר תחושת רוגע, נחת וסיפוק חושי המעורר את כל החושים. הניחוחות של המותג ב-ml_tlv הם מסע של שלווה פנימית ודיגיטלית.',
    perfumer: 'מאסטר פרפיומרים צרפתיים',
    highlights: 'קונספט חושי ייחודי (ASMR), ניחוחות מרגיעים וממכרים, וחדשנות פריזאית.',
    title_en: 'Deep Sensory Experience: ASMR Fragrances',
    description_en: 'ASMR Fragrances is an innovative French brand combining the world of ASMR (Autonomous Sensory Meridian Response) with the art of perfumery. Each fragrance is designed to evoke a sense of calm, bliss, and deep sensory satisfaction. ASMR Fragrances at ml_tlv are a journey of inner and digital peace.',
    perfumer_en: 'French Master Perfumers',
    highlights_en: 'Unique sensory concept (ASMR), soothing and addictive fragrances, and Parisian innovation.',
    logo_url: 'https://asmrfragrances.com/cdn/shop/files/Logo_ASMR_noir_120x.png?v=1700662244'
  },
  {
    name: 'Bohoboco',
    title: 'ניגודים משלימים: BOHOBOCO',
    description: 'מותג הבוטיק הפולני BOHOBOCO, שנוסד על ידי מיכאל גילברט, מייצג חזון אמנותי שבו ניגודים נפגשים. הבשמים של המותג הם יצירות מתוחכמות המשלבות רכיבים באיכות עילאית לכדי הרמוניה בלתי צפויה. גלו את עולם הניגודים המרתק של BOHOBOCO ב-ml_tlv.',
    perfumer: 'מיכאל גילברט ופרפיומרים נבחרים',
    highlights: 'שילוב רכיבים מנוגדים (כמו מלח וסוכר), איכות יוקרה פולנית, ועיצוב מודרני.',
    title_en: 'Complementary Contrasts: BOHOBOCO',
    description_en: 'The Polish boutique brand BOHOBOCO, founded by Michal Gilbert, represents an artistic vision where contrasts meet. The brand\'s perfumes are sophisticated creations that combine supreme quality ingredients into an unexpected harmony. Discover BOHOBOCO\'s fascinating world of contrasts at ml_tlv.',
    perfumer_en: 'Michal Gilbert and selected perfumers',
    highlights_en: 'Combination of contrasting ingredients (like salt and sugar), Polish luxury quality, and modern design.',
    logo_url: 'https://bohobocofragrances.com/cdn/shop/files/BOHOBOCOPERFUME_LOGO_180x.png?v=1613715364'
  },
  {
    name: 'Thameen',
    title: 'תכשיטים בבקבוק: THAMEEN LONDON',
    description: 'Thameen הוא מותג נישה בריטי יוקרתי השואב השראה מאבני חן נדירות ומתכשיטים היסטוריים מפורסמים. כל בושם הוא יצירה עשירה, עמוקה ומלכותית המייצגת את הזוהר של לונדון המודרנית. ב-ml_tlv אנו מציעים דוגמיות מהקולקציות המרהיבות ביותר של המותג.',
    perfumer: 'פרפיומרים מהטופ הבריטי והצרפתי',
    highlights: 'השראה מאבני חן יקרות, עמידות ונוכחות יוצאות דופן, וסטייל בריטי אצילי.',
    title_en: 'Gemstones in a Bottle: THAMEEN LONDON',
    description_en: 'Thameen is a luxury British niche brand drawing inspiration from rare gemstones and famous historical jewels. Each perfume is a rich, deep, and regal creation representing the glamour of modern London. At ml_tlv, we offer samples from the brand\'s most magnificent collections.',
    perfumer_en: 'Top British and French perfumers',
    highlights_en: 'Inspiration from precious gemstones, exceptional longevity and projection, and noble British style.',
    logo_url: 'https://www.thameenfragrance.com/cdn/shop/files/THAMEEN_LOGO_BLACK_180x.png?v=1613715364'
  },
  {
    name: 'The Harmonist',
    title: 'איזון והרמוניה: THE HARMONIST',
    description: 'The Harmonist הוא מותג המבוסס על חמשת האלמנטים של הפילוסופיה האסייתית העתיקה: אש, מים, אדמה, עץ ומתכת. הניחוחות נועדו להעניק איזון פנימי והרמוניה ללובש אותם, תוך שהם משתמשים ברכיבים המשובחים והטהורים ביותר שיש לטבע להציע. חוו את האיזון המדויק ב-ml_tlv.',
    perfumer: 'גיום פלוויני (Guillaume Flavigny)',
    highlights: 'פילוסופיית חמשת האלמנטים, רכיבים טבעיים נדירים, ועיצוב סינרגטי.',
    title_en: 'Balance and Harmony: THE HARMONIST',
    description_en: 'The Harmonist is a brand based on the five elements of ancient Asian philosophy: Fire, Water, Earth, Wood, and Metal. The fragrances are designed to provide inner balance and harmony to the wearer, using the finest and purest ingredients nature has to offer. Experience the precise balance at ml_tlv.',
    perfumer_en: 'Guillaume Flavigny',
    highlights_en: 'Five elements philosophy, rare natural ingredients, and synergistic design.',
    logo_url: 'https://theharmonist.com/cdn/shop/files/The-Harmonist-Logo_180x.png?v=1613715364'
  }
];

async function update() {
  await client.connect();
  for (const b of tier4Updates) {
    console.log(`Updating ${b.name} in DB...`);
    await client.query(
      `UPDATE brands 
       SET title = $1, description = $2, perfumer = $3, highlights = $4,
           title_en = $5, description_en = $6, perfumer_en = $7, highlights_en = $8,
           logo_url = $9
       WHERE name = $10`,
      [
          b.title, b.description, b.perfumer, b.highlights,
          b.title_en, b.description_en, b.perfumer_en, b.highlights_en,
          b.logo_url, b.name
      ]
    );
  }
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
