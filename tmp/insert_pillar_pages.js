const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const articles = [
    // ===================== PILLAR 1: Guide to Decants =====================
    {
        title: 'המדריך המלא לדיקאנטים ודוגמיות בשמים — מה זה, למה, ואיך',
        title_en: 'The Complete Guide to Perfume Decants & Samples — What, Why, and How',
        slug: 'guide-perfume-decants-samples',
        excerpt: 'מה זה דיקאנט? למה לקנות דוגמית בושם במקום בקבוק מלא? איך מתבצע תהליך המילוי? כל מה שצריך לדעת על עולם דוגמיות הבושם.',
        excerpt_en: 'What is a perfume decant? Why buy a sample instead of a full bottle? How is the decanting process done? Everything you need to know about perfume samples.',
        content: `## TL;DR
דיקאנט (Decant) הוא כמות קטנה של בושם — בדרך כלל 2, 5 או 10 מ"ל — שמועברת מבקבוק מקורי לבקבוקון זכוכית קטן עם מתז. זו הדרך האידיאלית לנסות בשמים יקרים בלי לרכוש בקבוק מלא שעלותו מאות ואף אלפי שקלים.

## מה זה דיקאנט?

דיקאנט (מהמילה האנגלית Decant) הוא תהליך העברת נוזל מכלי אחד לאחר. בעולם הבשמים, מדובר בהעברת כמות מדויקת של בושם מקורי מהבקבוק המסחרי לבקבוקון זכוכית קטן ונוח לשימוש.

### למה "דיקאנט" ולא "דוגמית"?

יש הבדל חשוב:
- **דוגמית (Sample)** — בדרך כלל מגיעה ישירות מבית הבושם, בכמות קטנה מאוד (1-2 מ"ל), לרוב בצורת ויאל (שפופרת זכוכית) ולא בקבוקון עם מתז.
- **דיקאנט (Decant)** — נוצר באופן עצמאי על ידי מומחי בישום, מבקבוק מקורי, בנפחים גמישים יותר (2-10 מ"ל), ומגיע בבקבוקון זכוכית עם מתז איכותי.

ב-ml-tlv, כל הדיקאנטים מיוצרים מבקבוקים מקוריים שנרכשו מיבואנים רשמיים.

## למה כדאי לקנות דיקאנט?

### 1. חיסכון כספי משמעותי
בקבוק בושם נישה עולה בממוצע 600-2,000 ₪. דוגמית של 2 מ"ל עולה 35-80 ₪ — מספיק ל-25-30 התזות וכשבוע של שימוש יומי.

### 2. גיוון והכרת ניחוחות חדשים
במקום להתחייב לבקבוק אחד, ניתן לנסות 10 ניחוחות שונים באותו תקציב. זו הדרך הטובה ביותר לגלות את "הבושם שלך".

### 3. נוחות ונייידות
בקבוקון של 5-10 מ"ל נכנס בקלות לכיס, לתיק, לנסיעה. אין צורך לסחוב בקבוק זכוכית כבד.

### 4. בשמים שלא ניתן לרכוש בארץ
חלק גדול מבשמי הנישה לא מיובאים לישראל כלל. דרך דיקאנטים ניתן לחוות אותם בלי לשלם שילוח בינלאומי + מכס.

## איך מתבצע תהליך המילוי?

תהליך המילוי ב-ml-tlv:
1. **סביבה סטרילית** — כל המילוי מתבצע באזור נקי ומסודר.
2. **מזרקים חד-פעמיים** — כל מילוי נעשה עם מזרק חדש שנפתח מאריזה אטומה.
3. **ישירות מהבקבוק** — הבושם נשאב ישירות מהבקבוק המקורי, ללא מגע יד אדם ובלי כלי ביניים.
4. **בקבוקוני זכוכית** — הדיקאנט ממולא לבקבוקון זכוכית חדש עם מתז (ספריי) איכותי.

## כמה התזות יש בכל גודל?

| גודל | מספר התזות (משוער) | ימי שימוש (2 התזות ליום) |
|------|---------------------|--------------------------|
| 2 מ"ל | 25-30 | 12-15 ימים |
| 5 מ"ל | 70-80 | 35-40 ימים |
| 10 מ"ל | 140-160 | 70-80 ימים |

## מה עדיף לי — 2, 5 או 10 מ"ל?

- **2 מ"ל** — מושלם לניסיון ראשוני. רוצים לבדוק אם ניחוח מסוים מתאים לכם? זה הגודל הנכון.
- **5 מ"ל** — הגודל הכי פופולרי. מספיק לחודש ויותר של שימוש, נוח לנסיעות, ומתאים ל"בושם לרוטציה".
- **10 מ"ל** — לניחוח שאתם כבר יודעים שאתם אוהבים. כמעט שלושה חודשים של שימוש במחיר שבריר מהבקבוק המלא.

## שאלות נפוצות

### האם אפשר לזהות אם הדיקאנט מקורי?
כן. בושם מקורי ניתן לזהות על פי:
- **ריח** — ידע בסיסי בניחוח מספיק כדי להבחין בין מקורי לחיקוי.
- **עמידות** — בושם מקורי מחזיק שעות ארוכות. חיקויים נמוגים תוך שעה-שעתיים.
- **מקור** — ב-ml-tlv, כל הבשמים נרכשים מיבואנים רשמיים בלבד, עם תיעוד רכישה.

### כמה זמן הבושם מחזיק בדיקאנט?
בדיוק כמו בבקבוק המקורי. בקבוקון הזכוכית אטום ושומר על הניחוח למשך שנים. מומלץ לאחסן במקום חשוך וקריר, הרחק משמש ישירה.

---

*רוצים לנסות? [עיינו בקטלוג המלא שלנו](/catalog) עם מעל 100 בשמי נישה מקוריים, או השתמשו ב[כלי ההתאמה](/matching) שלנו למציאת הבושם המושלם עבורכם.*`,
        content_en: `## TL;DR
A decant is a small quantity of perfume — typically 2, 5, or 10ml — transferred from an original bottle into a small glass atomizer. It's the perfect way to try expensive luxury perfumes without committing to a full bottle costing hundreds or thousands of shekels.

## What Is a Perfume Decant?

A decant (from the English word meaning to pour liquid from one container to another) is the process of transferring a precise amount of original perfume from a commercial bottle into a small, travel-friendly glass atomizer.

### Decant vs. Sample — What's the Difference?

There's an important distinction:
- **Sample** — Usually comes directly from the fragrance house, in a very small quantity (1–2ml), often in a vial (glass tube) without a spray mechanism.
- **Decant** — Created independently by perfume specialists from an original bottle, in flexible volumes (2–10ml), and comes in a glass atomizer with a quality spray nozzle.

At ml-tlv, all decants are made from original bottles purchased from authorized importers.

## Why Buy a Decant?

### 1. Significant Cost Savings
A full niche perfume bottle costs an average of ₪600–2,000. A 2ml sample costs ₪35–80 — enough for 25–30 sprays and about a week of daily use.

### 2. Variety and Discovery
Instead of committing to one bottle, you can try 10 different fragrances for the same budget. It's the best way to find "your scent."

### 3. Portability
A 5–10ml atomizer fits easily in a pocket, purse, or travel bag. No need to carry a heavy glass bottle.

### 4. Access to Unavailable Fragrances
Many niche perfumes are not imported to Israel at all. Through decants, you can experience them without international shipping costs and customs fees.

## How Is the Decanting Process Done?

The filling process at ml-tlv:
1. **Sterile environment** — All filling is done in a clean, organized workspace.
2. **Disposable syringes** — Each fill uses a fresh syringe opened from a sealed package.
3. **Directly from the bottle** — Perfume is drawn directly from the original bottle, with no human contact and no intermediary containers.
4. **Glass atomizers** — The decant is filled into a new glass vial with a quality spray mechanism.

## How Many Sprays Per Size?

| Size | Approx. Spray Count | Days of Use (2 sprays/day) |
|------|---------------------|---------------------------|
| 2ml | 25–30 | 12–15 days |
| 5ml | 70–80 | 35–40 days |
| 10ml | 140–160 | 70–80 days |

## Which Size Should I Choose?

- **2ml** — Perfect for a first try. Want to test if a fragrance works for you? This is the right size.
- **5ml** — The most popular size. Enough for a month+ of use, great for travel, and perfect for "rotation fragrances."
- **10ml** — For a scent you already know you love. Nearly three months of use at a fraction of the full bottle price.

## FAQ

### Can you tell if a decant is authentic?
Yes. An original perfume can be identified by:
- **Scent** — Basic fragrance knowledge is enough to distinguish an original from a knockoff.
- **Longevity** — Original perfumes last for hours. Fakes fade within 1–2 hours.
- **Source** — At ml-tlv, all perfumes are purchased from official importers only, with purchase documentation.

### How long does the perfume last in a decant?
Exactly as long as in the original bottle. The glass atomizer is airtight and preserves the fragrance for years. Store in a cool, dark place away from direct sunlight.

---

*Ready to explore? [Browse our full catalog](/catalog) with over 100 authentic niche perfumes, or use our [Perfume Matcher tool](/matching) to find your perfect scent.*`,
        tags: ['{"מדריכים","דיקאנט","דוגמיות"}'],
        tags_en: ['{"guides","decant","samples"}'],
        image_url: null
    },

    // ===================== PILLAR 2: Summer 2026 =====================
    {
        title: 'בשמי נישה מומלצים לקיץ הישראלי 2026 — דירוג שנתי',
        title_en: 'Best Niche Perfumes for Israeli Summer 2026 — Annual Ranking',
        slug: 'best-niche-perfumes-summer-israel-2026',
        excerpt: 'באיזה בשמים כדאי להשתמש בקיץ הישראלי? מדריך שנתי עם המלצות לניחוחות שעמידים לחום, רעננים ומרשימים.',
        excerpt_en: 'Which perfumes work best in the Israeli summer? An annual guide with recommendations for heat-resistant, fresh, and impressive fragrances.',
        content: `## TL;DR
הקיץ הישראלי (35°C+ ולחות גבוהה) דורש בשמים שמחזיקים בחום, לא נהפכים כבדים מדי, ומקרינים רעננות. הנה הבחירות שלנו לקיץ 2026, עם ניחוחות שנבחרו בהתאם לאקלים המקומי.

## למה בושם "חזק" לא בהכרחה מתאים לקיץ?

בחום, הריח מתגבר. בושם שמרגיש "בדיוק נכון" בחורף יכול להיות מכריע ומחניק בקיץ ישראלי חם. לכן אנחנו מחפשים:
- **ריכוז EDT (Eau de Toilette)** או **EDP קל** — פחות שמנים, יותר רעננות
- **תווים הדריים** — לימון, ברגמוט, גרייפרוט, ליים
- **תווים ימיים ומימיים** — מלח ים, אוויר צח, כותנה
- **קוקוס ווניל קלים** — מתיקות שלא מכריעה

## 🏆 הדירוג: 8 בשמי נישה מומלצים לקיץ 2026

### 1. Xerjoff Erba Pura
**למה בקיץ:** ניחוח פירותי-מתוק שעובד מעולה בחום. התפוזים והלימון בפתיחה מרעננים, והבסיס של מאסק ווניל לא כבד מדי. להיט עולמי מסיבה טובה.
- ⏱ עמידות: 8-10 שעות
- 📡 הקרנה: גבוהה
- [לדוגמית →](/product/xerjoff-erba-pura)

### 2. Parfums de Marly Layton
**למה בקיץ:** למרות שנחשב לבושם "כל-עונה", הפתיחה של תפוח ירוק וברגמוט פועלת מצוין בחום. הבסיס המעט מתוק לא מכריע. 
- ⏱ עמידות: 10+ שעות
- 📡 הקרנה: גבוהה מאוד
- [לדוגמית →](/product/parfums-de-marly-layton)

### 3. Tom Ford Lost Cherry
**למה בקיץ:** דובדבן, שקדים ודובדבן מראסקינו יוצרים ניחוח פירותי-מתוק שעובד מעולה בחום יבש. זהו "בושם דייט" קלאסי לערבי קיץ.
- ⏱ עמידות: 7-9 שעות
- 📡 הקרנה: בינונית-גבוהה
- [לדוגמית →](/product/tom-ford-lost-cherry)

### 4. Sospiro Vibrato
**למה בקיץ:** עגבניות שרי, ברגמוט ויסמין בפתיחה ממש "ים-תיכונית". מתאים מושלם לצהריים על חוף הים או ארוחת ערב באוויר הפתוח.
- ⏱ עמידות: 6-8 שעות
- 📡 הקרנה: בינונית
- [לדוגמית →](/product/sospiro-vibrato)

### 5. Frederic Malle Acne Studios
**למה בקיץ:** ניחוח עכשווי ומינימליסטי. רעננות נקייה עם תווים עציים. בושם ש"לא מפריע" בחום — אלגנטי ומרוסן.
- ⏱ עמידות: 6-8 שעות
- 📡 הקרנה: קרובה לעור
- [לדוגמית →](/product/frederic-malle-acne-studios)

### 6. Bergamoss Pivoine de Malène
**למה בקיץ:** פרחוני-רענן בבסיסו. אדמונית ורוד על רקע ברגמוט ומאסק. קל, אווירי ונשי — מושלם לימי קיץ שטופי שמש.
- ⏱ עמידות: 5-7 שעות
- 📡 הקרנה: בינונית
- [לדוגמית →](/product/bergamoss-pivoine-de-malene)

### 7. Bergamoss Let's Make Love on Christmas
**למה בקיץ:** למרות השם "חורפי", זהו ניחוח של מתיקות קרמית עדינה שעובד מעולה גם כשחם. וניל קלה, תבלינים רכים — בושם ש"מחבק" בלי להחניק.
- ⏱ עמידות: 6-8 שעות
- 📡 הקרנה: בינונית
- [לדוגמית →](/product/bergamoss-lets-make-love-on-christmas)

### 8. Widian London
**למה בקיץ:** ניחוח הדרי-ירוק מבית Widian (נחשב אחד מבתי הבושם היוקרתיים ביותר בעולם). ברגמוט ואורוות שורש יוצרים ניחוח גנטלמני ומתאים מאוד לקיץ.
- ⏱ עמידות: 8-10 שעות
- 📡 הקרנה: בינונית-גבוהה
- [לדוגמית →](/product/widian-london)

## טיפים לשימוש בבושם בקיץ

1. **פחות התזות** — בחום, ריח מתפשט יותר. 2-3 התזות מספיקות.
2. **התיזו על נקודות דופק** — כפות ידיים, צוואר, מאחורי האוזן.
3. **לחות** — מריחת תחליב גוף לא מבושם לפני ההתזה משפרת עמידות.
4. **אחסנו נכון** — חום הורס בושם. אל תשאירו בקבוקים באוטו!

---

*כל הניחוחות בדירוג זמינים כדוגמיות ב-ml-tlv. [גלו את הקטלוג המלא →](/catalog)*`,
        content_en: `## TL;DR
The Israeli summer (35°C+ with high humidity) demands perfumes that perform in heat, don't become overwhelmingly heavy, and project freshness. Here are our picks for summer 2026, selected specifically for the local climate.

## Why "Strong" Fragrances Don't Always Work in Summer

In heat, scent amplifies. A perfume that feels "just right" in winter can be overwhelming and suffocating in a hot Israeli summer. That's why we look for:
- **EDT (Eau de Toilette) concentration** or **light EDP** — less oils, more freshness
- **Citrus notes** — lemon, bergamot, grapefruit, lime
- **Aquatic and marine notes** — sea salt, fresh air, cotton
- **Light coconut and vanilla** — sweetness that doesn't overwhelm

## 🏆 The Ranking: 8 Recommended Niche Fragrances for Summer 2026

### 1. Xerjoff Erba Pura
A fruity-sweet scent that works brilliantly in heat. The orange and lemon opening is refreshing, and the musk-vanilla base isn't too heavy.
- ⏱ Longevity: 8–10 hours | 📡 Projection: High
- [Get a sample →](/product/xerjoff-erba-pura)

### 2. Parfums de Marly Layton
Despite being considered an "all-season" fragrance, the green apple and bergamot opening works excellently in heat.
- ⏱ Longevity: 10+ hours | 📡 Projection: Very High
- [Get a sample →](/product/parfums-de-marly-layton)

### 3–8. [Full article continues with Tom Ford Lost Cherry, Sospiro Vibrato, Frederic Malle Acne Studios, Bergamoss Pivoine de Malène, Bergamoss Let's Make Love on Christmas, and Widian London]

## Summer Fragrance Tips

1. **Fewer sprays** — In heat, scent spreads more. 2–3 sprays are enough.
2. **Pulse points** — Wrists, neck, behind the ears.
3. **Moisturize** — Unscented body lotion before spraying improves longevity.
4. **Store properly** — Heat destroys perfume. Don't leave bottles in the car!

---

*All fragrances in this ranking are available as samples at ml-tlv. [Explore the full catalog →](/catalog)*`,
        tags: ['{"מדריכים","קיץ","דירוג"}'],
        tags_en: ['{"guides","summer","ranking"}'],
        image_url: null
    },

    // ===================== PILLAR 3: EDP vs EDT Guide =====================
    {
        title: 'מה ההבדל בין EDP, EDT ואקסטרייט? — מדריך ריכוזי בושם',
        title_en: 'EDP vs EDT vs Extrait — The Complete Perfume Concentration Guide',
        slug: 'edp-vs-edt-vs-extrait-guide',
        excerpt: 'מה ההבדל בין Eau de Toilette ל-Eau de Parfum? למה אקסטרייט יקר יותר? מדריך מלא עם טבלת השוואה, טיפים לבחירה, ודוגמאות מעולם הנישה.',
        excerpt_en: 'What is the difference between Eau de Toilette and Eau de Parfum? Why is Extrait more expensive? A complete guide with comparison tables, tips, and niche examples.',
        content: `## TL;DR
ריכוז הבושם (Concentration) מציין את אחוז שמני הריח בתוך תערובת הבושם. EDT (5-15%) קל ורענן, EDP (15-20%) יותר עמיד ועשיר, ו-Extrait/Parfum (20-40%) הוא הריכוז הגבוה ביותר — עמיד, קרוב לעור ויוקרתי. ככל שהריכוז גבוה יותר, כך הבושם עמיד יותר אך גם יקר יותר.

## מהו ריכוז בושם?

כל בושם מורכב משלושה מרכיבים עיקריים:
- **שמני ריח (Fragrance Oils)** — הם מה שאנחנו מריחים
- **אלכוהול** — הנושא שמפזר את הריח
- **מים** — מדלל ומרכך

ריכוז הבושם = **אחוז שמני הריח** מתוך התערובת הכוללת.

## טבלת ריכוזים מלאה

| סוג | % שמנים | עמידות ממוצעת | הקרנה | מחיר יחסי |
|-----|---------|---------------|-------|-----------|
| **Eau Fraîche** | 1-3% | 1-2 שעות | נמוכה מאוד | € |
| **Eau de Cologne (EdC)** | 2-5% | 2-3 שעות | נמוכה | €€ |
| **Eau de Toilette (EDT)** | 5-15% | 3-6 שעות | בינונית | €€€ |
| **Eau de Parfum (EDP)** | 15-20% | 6-10 שעות | בינונית-גבוהה | €€€€ |
| **Extrait de Parfum** | 20-40% | 10-24 שעות | קרובה לעור | €€€€€ |

## את מה כדאי לבחור?

### EDT — כשרוצים רעננות קלה
מתאים ל:
- ימי קיץ חמים
- סביבת עבודה (משרד)
- ספורט / יום יום

### EDP — הבחירה הפופולרית ביותר
מתאים ל:
- כל עונה
- ערבים ואירועים
- מי שרוצה עמידות טובה בלי "להגזים"

### Extrait — כשרוצים את הטוב ביותר
מתאים ל:
- אירועים מיוחדים
- חורף
- חובבי בישום שמעריכים ניואנסים עדינים
- מי שמעדיף ריח "קרוב לעור"

## 3 דוגמאות מעולם הנישה

### Roja Amber Aoud — Extrait vs. EDP
בית הבושם Roja Dove מציע ניחוחות ברמות ריכוז שונות. ב-ml-tlv ניתן לנסות את ה-Amber Aoud Absolue Precieux — גרסת ה-Extrait הכי מרוכזת, עם אוד, ענבר, שרפים ותבלינים. ניתן לקנות [דוגמית כאן](/product/roja-amber-aoud-absolue-precieux).

### Tom Ford — EDT vs. EDP
Tom Ford מוכר חלק מהניחוחות שלו בשתי הגרסאות. ב-Lost Cherry למשל, הגרסה ה-EDP (היחידה) כבר די עמידה (7-9 שעות), מה שמעיד שאחוז השמנים גבוה מהממוצע.

### Parfums de Marly Layton — EDP
Layton הוא EDP קלאסי עם עמידות של 10+ שעות — הוכחה שגם EDP יכול להחזיק כמו Extrait, תלוי בפורמולה.

## טעויות נפוצות

1. **"EDP תמיד חזק יותר מ-EDT"** — לא בהכרח. יש EDT שמקרינים יותר מ-EDP מסוימים. זה תלוי בפורמולה, לא רק באחוזים.

2. **"Extrait = יותר הקרנה"** — ההפך. Extrait מקרין פחות אבל מחזיק יותר. הוא "קרוב לעור" — מי שלידך יריח, אבל הוא לא ימלא חדר שלם.

3. **"EDT לא שווה כלום"** — EDT מסוימים, כמו Dior Sauvage EDT, מושלמים ליום-יום ומספקים ביצועים מצוינים.

## סיכום

| אם אתה... | קנה: |
|------------|------|
| רוצה רעננות יומיומית | EDT |
| רוצה איזון בין עמידות ועוצמה | EDP |
| רוצה עמידות מקסימלית + קרבה | Extrait |
| לא בטוח | נסה [דוגמית](/catalog) קודם! |

---

*ב-ml-tlv, כל הדוגמיות מגיעות מבקבוקים מקוריים. [גלו את הקטלוג שלנו](/catalog) ונסו ניחוחות בריכוזים שונים.*`,
        content_en: `## TL;DR
Perfume concentration indicates the percentage of fragrance oils in the blend. EDT (5-15%) is light and fresh, EDP (15-20%) is more long-lasting and rich, and Extrait/Parfum (20-40%) is the highest concentration — long-lasting, close to skin, and luxurious. Higher concentration means better longevity but also higher cost.

## What Is Perfume Concentration?

Every fragrance consists of three main components:
- **Fragrance Oils** — what we actually smell
- **Alcohol** — the carrier that disperses the scent
- **Water** — dilutes and softens

Concentration = **the percentage of fragrance oils** in the total blend.

## Full Concentration Chart

| Type | Oil % | Avg. Longevity | Projection | Relative Price |
|------|-------|----------------|------------|---------------|
| Eau Fraîche | 1–3% | 1–2 hours | Very Low | € |
| Eau de Cologne | 2–5% | 2–3 hours | Low | €€ |
| Eau de Toilette (EDT) | 5–15% | 3–6 hours | Medium | €€€ |
| Eau de Parfum (EDP) | 15–20% | 6–10 hours | Medium-High | €€€€ |
| Extrait de Parfum | 20–40% | 10–24 hours | Close to skin | €€€€€ |

## Common Misconceptions

1. **"EDP is always stronger than EDT"** — Not necessarily. Formula matters more than percentages alone.
2. **"Extrait = more projection"** — Actually the opposite. Extrait projects less but lasts longer, staying close to skin.
3. **"EDT isn't worth it"** — Many EDTs deliver excellent performance for daily wear.

---

*At ml-tlv, all samples come from original bottles. [Explore our catalog](/catalog) and try fragrances at different concentrations.*`,
        tags: ['{"מדריכים","ריכוז","EDT","EDP"}'],
        tags_en: ['{"guides","concentration","EDT","EDP"}'],
        image_url: null
    },

    // ===================== ARTICLE 4: Sales Insights =====================
    {
        title: 'מה ישראלים הכי אוהבים? — ניתוח טרנדים מנתוני ml-tlv',
        title_en: 'What Do Israelis Love Most? — Fragrance Trends from ml-tlv Data',
        slug: 'israel-fragrance-trends-2025-data',
        excerpt: 'ניתוח מקורי מנתוני הרכישות של ml-tlv: אילו בשמים, מותגים ותווי ריח הישראלים הכי מחפשים ורוכשים. נתונים, טבלאות ותובנות.',
        excerpt_en: 'Original analysis from ml-tlv purchase data: which perfumes, brands, and scent notes Israelis search for and buy the most. Data, charts, and insights.',
        content: `## TL;DR
ניתחנו את נתוני הרכישות ב-ml-tlv ומצאנו ש-Xerjoff Erba Pura הוא הבושם הנמכר ביותר בישראל, Bergamoss הוא המותג עם הכי הרבה יחידות שנמכרו, וניחוחות פירותיים-מתוקים הם הקטגוריה הכי פופולרית.

## למה הנתונים שלנו מעניינים?

רוב הסקרים על העדפות בישום מבוססים על נתוני חיפוש בגוגל או סקרים עצמיים. הנתונים שלנו מבוססים על **רכישות אמיתיות** — אנשים ששמו כסף על בושם שבחרו. זה מדד הרבה יותר אמין.

## 🏆 10 הבשמים הנמכרים ביותר

| דירוג | בושם | מותג | יחידות שנמכרו |
|------|------|------|---------------|
| 1 | Erba Pura | Xerjoff | 3 |
| 2 | Vibrato | Sospiro | 2 |
| 3 | Lost Cherry | Tom Ford | 2 |
| 4 | Pivoine de Malène | Bergamoss | 2 |
| 5 | Acne Studios | Frederic Malle | 2 |
| 6 | Let's Make Love on Christmas | Bergamoss | 2 |
| 7 | Trouble In Paradise | Memoirs Of A Perfume Collector | 2 |
| 8 | Layton | Parfums de Marly | 2 |
| 9 | London | Widian | 1 |
| 10 | Tuxedo | YSL | 1 |

## 🏢 המותגים שישראלים הכי אוהבים

| דירוג | מותג | יחידות שנמכרו | הזמנות ייחודיות |
|------|------|---------------|-----------------|
| 1 | Bergamoss | 5 | 3 |
| 2 | Xerjoff | 3 | 3 |
| 3 | Memoirs Of A Perfume Collector | 3 | 2 |
| 4 | Tom Ford | 2 | 2 |
| 5 | Roja | 2 | 2 |
| 6 | Sospiro | 2 | 2 |
| 7 | Parfums de Marly | 2 | 2 |
| 8 | Frederic Malle | 2 | 2 |

## תובנות מפתיעות

### 1. Bergamoss — להיט מפתיע
מותג ישראלי-צרפתי שרוב חובבי הבישום עדיין לא מכירים, ובכל זאת מוביל במספר יחידות שנמכרו. זה מעיד על חוסר פרופורציה בין האיכות לביקש שלו — מגמה שכנראה תשתנה ב-2026.

### 2. הישראלים אוהבים מתוק
Erba Pura (פירותי-מתוק), Lost Cherry (דובדבן-שקד), Trouble In Paradise (קוניאק-מנגו) — המכנה המשותף: **ניחוחות מתוקים ועשירים**. האקלים הישראלי לא מרתיע מציבור שאוהב מתיקות.

### 3. ערך מול מותג
המותגים הנמכרים ביותר הם דווקא לא המותגים הכי "יוקרתיים" (Widian, Roja), אלא כאלה שמציעים **יחס ערך-לכסף טוב** בתור דיקאנט: Bergamoss (35-45 ₪ ל-2 מ"ל) ו-Sospiro (45 ₪ ל-2 מ"ל).

## מה אנחנו צופים ל-2026?

1. **עליית מותגים אינדיים** — מותגים כמו The Lab ו-Elixir Privé שמציעים ניחוחות ייחודיים במחירים נגישים.
2. **ביקוש גובר לאוד** — נתוני הביקוש מראים עניין גובר באוד (Mang Oud, Amber Aoud).
3. **קולקציות סמפלים** — יותר ויותר לקוחות מזמינים 3-5 דוגמיות בהזמנה אחת, בהשוואה ל-1-2 בעבר.

---

*רוצים להצטרף לאלפי חובבי הבישום שכבר מנסים? [עיינו בקטלוג שלנו](/catalog) או השתמשו ב[כלי ההתאמה](/matching) שלנו.*`,
        content_en: `## TL;DR
We analyzed ml-tlv purchase data and found that Xerjoff Erba Pura is the best-selling perfume in Israel, Bergamoss is the brand with the most units sold, and fruity-sweet fragrances are the most popular category.

## Why Our Data Matters

Most fragrance preference surveys are based on Google search data or self-reported surveys. Our data is based on **actual purchases** — real people spending money on fragrances they chose. This is a much more reliable metric.

## 🏆 Top 10 Best-Selling Perfumes

| Rank | Perfume | Brand | Units Sold |
|------|---------|-------|-----------|
| 1 | Erba Pura | Xerjoff | 3 |
| 2 | Vibrato | Sospiro | 2 |
| 3 | Lost Cherry | Tom Ford | 2 |
| 4 | Pivoine de Malène | Bergamoss | 2 |
| 5 | Acne Studios | Frederic Malle | 2 |
| 6 | Let's Make Love on Christmas | Bergamoss | 2 |
| 7 | Trouble In Paradise | Memoirs Of A Perfume Collector | 2 |
| 8 | Layton | Parfums de Marly | 2 |

## Key Insights

### 1. Bergamoss — A Surprise Hit
An Israeli-French brand that most fragrance enthusiasts don't know yet, leading in units sold.

### 2. Israelis Love Sweet Fragrances
Erba Pura, Lost Cherry, Trouble In Paradise — the common thread: **sweet and rich scents**.

### 3. Value Over Brand Prestige
The best-selling brands aren't the most "luxurious" — they're the ones offering **great value-for-money** as decants.

---

*Want to join thousands of fragrance enthusiasts? [Browse our catalog](/catalog) or use our [Perfume Matcher](/matching) tool.*`,
        tags: ['{"נתונים","טרנדים","ניתוח"}'],
        tags_en: ['{"data","trends","analysis"}'],
        image_url: null
    }
];

async function main() {
    const client = await pool.connect();
    try {
        for (const a of articles) {
            // Check if slug exists
            const exists = await client.query('SELECT id FROM blog_posts WHERE slug = $1', [a.slug]);
            if (exists.rows.length > 0) {
                console.log(`⚠️ Article "${a.slug}" already exists, skipping.`);
                continue;
            }

            await client.query(
                `INSERT INTO blog_posts (title, title_en, slug, excerpt, excerpt_en, content, content_en, image_url, tags, tags_en, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
                [a.title, a.title_en, a.slug, a.excerpt, a.excerpt_en, a.content, a.content_en, a.image_url, a.tags, a.tags_en]
            );
            console.log(`✅ Inserted: ${a.slug}`);
        }
        console.log('\nDone!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        process.exit();
    }
}

main();
