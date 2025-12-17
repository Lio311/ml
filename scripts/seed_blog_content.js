const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const BASE_IMAGES = [
    '/images/blog_assets/luxury-bottle.png',
    '/images/blog_assets/decant-process.png',
    '/images/blog_assets/ingredients.png',
    '/images/blog_assets/store-shelf.png',
    '/images/blog_assets/woman-smelling.png',
    '/images/blog_assets/vanilla-macro.png',
    '/images/blog_assets/lifestyle-tray.png',
    '/images/blog_assets/abstract-waves.png',
    '/images/blog_assets/perfumer-lab.png'
];

// Content Libraries for generating rich, long-form articles
const CONTENT_LIBRARIES = {
    history: [
        "ההיסטוריה של הבישום מתחילה לפני אלפי שנים במצרים העתיקה, שם השתמשו בשרפים ובשמנים ארומטיים לטקסים דתיים ולחניטה. הפרעונים האמינו שהריח הוא הגשר לעולם האלים. מאוחר יותר, הרומאים והיוונים שכללו את אמנות הזיקוק והפכו את הבושם לסמל סטטוס.",
        "במאה ה-17 באירופה, הבישום הפך לכלי הישרדותי כמעט, כאשר אנשי האצולה השתמשו בו כדי לטשטש את ריחות הרחוב והגוף. העיר גראס (Grasse) בצרפת הפכה לבירת הבישום העולמית בזכות האקלים המושלם לגידול יסמין וורדים.",
        "המהפכה התעשייתית במאה ה-19 הביאה איתה את הסינתזה הכימית, שאפשרה לראשונה ליצור ריחות שלא קיימים בטבע (כמו אלדהידים) ולהוזיל משמעותית את מחירי הבשמים, מה שהפך אותם לנגישים לקהל הרחב ולא רק למלוכה."
    ],
    science: [
        "מבחינה מולקולרית, בושם הוא תמיסה של שמנים אתריים בתוך אלכוהול ומים. המולקולות הקטנות ביותר מתנדפות ראשונות (תווי ראש), בעוד מולקולות כבדות יותר נשארות על העור לאורך זמן (תווי בסיס). זהו מחול כימי עדין שמתרחש על העור של כל אחד מאיתנו בצורה שונה.",
        "החוש שלנו לריח מקושר ישירות למערכת הלימבית במוח, האחראית על רגשות וזיכרונות. לכן, ריח מסוים יכול לזרוק אותנו ברגע אחד לזיכרון ילדות רחוק או לעורר בנו רגש עז של געגוע או שמחה, עוד לפני שהמוח הרציונלי הספיק לעבד את המידע.",
        "פיזיולוגיית העור משחקת תפקיד קריטי: רמת החומציות (pH), הלחות הטבעית ואפילו התזונה שלנו משפיעים על איך הבושם יריח. עור שומני נוטה להחזיק בושם זמן רב יותר מעור יבש, כיוון שהשמנים לוכדים את המולקולות הארומטיות."
    ],
    tips: [
        "טיפ זהב: לעולם אל תשפשפו את פרקי כפות הידיים לאחר התזת הבושם. הפעולה הזו מחממת את העור ושוברת את המולקולות העדינות של תווי הראש, מה שגורם לבושם להשתנות ולהתנדף מהר יותר.",
        "לקבלת עמידות מקסימלית, התיזו את הבושם מיד לאחר המקלחת, כשהנקבוביות פתוחות והעור נקי. מריחת קרם גוף נטול ריח לפני כן תיצור בסיס שומני שיחזיק את הבושם שעות רבות נוספות.",
        "אחסון נכון הוא קריטי: אור שמש ישיר, חום ולחות (כמו בחדר האמבטיה) הם האויבים הגדולים ביותר של הבושם. כדי לשמור על הניחוח המקורי למשך שנים, יש לאחסן את הבקבוקים במקום קריר, יבש וחשוך, עדיף בתוך האריזה המקורית."
    ],
    trends: [
        "בשנים האחרונות אנו רואים מעבר חד לעבר בשמי נישה ובוטיק. הצרכן המודרני מחפש ייחודיות וביטוי עצמי, ופחות רוצה להריח כמו 'כולם'. זה מוביל לפריחה של מותגים קטנים נועזים המשתמשים בחומרי גלם נדירים.",
        "מגמת הקיימות (Sustainability) חודרת גם לעולם הבישום: מותגים רבים עוברים לאריזות מתכלות, בקבוקים הניתנים למילוי חוזר, ושימוש באלכוהול ממקור צמחי אורגני. השקיפות לגבי מקור הרכיבים הופכת לסטנדרט חדש.",
        "טרנד ה'יוניסקס' הולך ומתחזק. החלוקה המסורתית ל'אישה' ו'גבר' נתפסת כמיושנת. ורד יכול להיות גברי מאוד, ועור (Leather) יכול להיות נשי ומפתה. הכל עניין של הרכב וכימיה אישית."
    ],
    faq: [
        { q: "מה ההבדל בין EDP ל-EDT?", a: "ההבדל העיקרי הוא בריכוז תמציות הריח. או דה פרפיום (EDP) מכיל בדרך כלל 15-20% תמצית, מה שמעניק לו עמידות ונוכחות חזקה יותר. או דה טואלט (EDT) מכיל כ-5-15% והוא לרוב קליל ורענן יותר, מתאים לשימוש יומיומי." },
        { q: "האם בושם מתקלקל?", a: "כן, בושם יכול להתקלקל. החשיפה לחמצן, אור וחום גורמת לחמצון המרכיבים. בושם ממוצע מחזיק כ-3 עד 5 שנים אם הוא מאוחסן כראוי. אם הנוזל שינה צבע או שהריח הפך לחמוץ, כנראה שהגיע זמנו." },
        { q: "למה אני מפסיק להריח את הבושם על עצמי?", a: "זו תופעה שנקראת 'עייפות ריח' (Olfactory Fatigue). המוח שלנו מסנן גירויים קבועים כדי לא להיות מוצף. גם אם אתם לא מריחים את עצמכם אחרי כמה דקות, הסביבה כנראה עדיין מריחה אתכם היטב." },
        { q: "איך לבחור בושם מתנה?", a: "זו משימה מאתגרת. השיטה הטובה ביותר היא לדעת באילו בשמים האדם כבר משתמש ולחפש משהו מאותה משפחת ריח (פרחוני, עצי, אוריינטלי). אפשרות בטוחה יותר היא לרכוש סט דוגמיות (Discvery Set) שמאפשר להתנסות מבלי להתחייב." }
    ]
};

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

let imageDeck = [];
function getUniqueImageFromDeck() {
    if (imageDeck.length === 0) imageDeck = [...BASE_IMAGES].sort(() => 0.5 - Math.random());
    return imageDeck.pop();
}

const layouts = {
    standard: (img, alt) => `<img src="${img}" alt="${alt}" class="w-full md:w-2/3 mx-auto rounded-xl shadow-md my-8 object-cover h-64 md:h-96 block">`,
    floatRight: (img, alt, text) => `<div class="clearfix my-6"><img src="${img}" alt="${alt}" class="w-full md:w-1/2 float-right ml-6 mb-4 rounded-xl shadow-md object-cover h-64"><p>${text}</p></div>`,
    floatLeft: (img, alt, text) => `<div class="clearfix my-6"><img src="${img}" alt="${alt}" class="w-full md:w-1/2 float-left mr-6 mb-4 rounded-xl shadow-md object-cover h-64"><p>${text}</p></div>`,
    twoCol: (img1, img2, alt) => `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8"><img src="${img1}" alt="${alt} 1" class="w-full rounded-xl shadow-md object-cover h-48"><img src="${img2}" alt="${alt} 2" class="w-full rounded-xl shadow-md object-cover h-48"></div>`
};

function generateLongFormHTML(title, excerpt, specificContent, articleImages) {
    // Deck logic for images
    const coverDetails = getUniqueImageFromDeck();
    const secondaryDetails = getUniqueImageFromDeck();

    // Product images for context
    const pImg1 = articleImages[0] || coverDetails;
    const pImg2 = articleImages[1] || secondaryDetails;

    let html = `
        <div class="article-content text-lg leading-relaxed text-gray-800">
            <p class="lead text-2xl text-gray-600 font-serif mb-8 font-light italic border-r-4 border-black pr-4">${excerpt}</p>
            
            ${layouts.standard(pImg1, title)}

            <h2 class="text-3xl font-bold mt-12 mb-6">מבוא: למה ${title} הוא נושא חם?</h2>
            <p class="mb-6">העולם של היום מוצף בגירויים, ודווקא בתוך הרעש הזה, חוש הריח מצליח לתפוס מקום של כבוד. ${title} אינו רק עניין טכני, אלא מסע רגשי. במאמר זה נצלול לעומק הדברים, נבין את המורכבות, ונצא עם תובנות פרקטיות.</p>
            <p class="mb-6">${getRandomItem(CONTENT_LIBRARIES.trends)}</p>

            ${layouts.floatLeft(secondaryDetails, "תמונה להמחשה", getRandomItem(CONTENT_LIBRARIES.history))}
            
            <h2 class="text-3xl font-bold mt-12 mb-6">המדע והאמנות שמאחורי הקלעים</h2>
            <p class="mb-6">${specificContent}</p>
            <p class="mb-6">${getRandomItem(CONTENT_LIBRARIES.science)}</p>
            
            ${layouts.twoCol(pImg2, coverDetails, "גלריה")}

            <h2 class="text-3xl font-bold mt-12 mb-6">5 עובדות שלא ידעתם</h2>
            <ul class="list-disc list-inside space-y-3 mb-8 bg-gray-50 p-6 rounded-xl">
                 <li>${getRandomItem(CONTENT_LIBRARIES.history).substring(0, 100)}...</li>
                 <li>${getRandomItem(CONTENT_LIBRARIES.science).substring(0, 100)}...</li>
                 <li>${getRandomItem(CONTENT_LIBRARIES.trends).substring(0, 100)}...</li>
                 <li>האף האנושי יכול להבחין בין טריליון ריחות שונים (תיאורטית).</li>
                 <li>בשמים מתפתחים אחרת על כל אדם בגלל ההורמונים והתזונה.</li>
            </ul>

            <h2 class="text-3xl font-bold mt-12 mb-6">מדריך פרקטי: איך ליישם?</h2>
            <p class="mb-6">אחרי שהבנו את התיאוריה, בואו נדבר תכלס. הנה כמה דברים שחשוב לזכור:</p>
            ${layouts.floatRight(getUniqueImageFromDeck(), "טיפים", getRandomItem(CONTENT_LIBRARIES.tips))}
            <p class="mb-6">${getRandomItem(CONTENT_LIBRARIES.tips)}</p>

            <h2 class="text-3xl font-bold mt-12 mb-6">שאלות נפוצות (FAQ)</h2>
            <div class="space-y-6 mb-12">
                ${CONTENT_LIBRARIES.faq.slice(0, 3).map(f => `
                    <div class="border-b border-gray-200 pb-4">
                        <h4 class="font-bold text-xl mb-2 text-black">${f.q}</h4>
                        <p class="text-gray-700">${f.a}</p>
                    </div>
                `).join('')}
            </div>

            <div class="bg-black text-white p-8 rounded-2xl text-center my-12 shadow-2xl">
                <h3 class="text-2xl font-bold mb-4">מוכנים למצוא את הריח שלכם?</h3>
                <p class="mb-6 text-gray-300">אנחנו ב-ml_tlv מאמינים שכל אחד ראוי לבושם שמספר את הסיפור שלו. אל תתפשרו על פחות ממושלם.</p>
                <a href="/catalog" class="inline-block bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition duration-300">לצפייה בקטלוג הדוגמיות</a>
            </div>
        </div>
    `;
    return html;
}

const BRAND_MAP = {
    'xerjoff': 'Xerjoff', 'creed': 'Creed', 'roja': 'Roja', 'mfk': 'Maison Francis Kurkdjian',
    'initio': 'Initio', 'marly': 'Parfums de Marly', 'montale': 'Montale', 'mancera': 'Mancera', 'le labo': 'Le Labo'
};

/* ... Same topics list as before ... */
const TOPICS = [
    { t: "למה כדאי לקנות דוגמיות בושם (Decants)?", s: "why-buy-perfume-decants", kw: "decant" },
    { t: "סקירת מותג: קסרז'וף (Xerjoff) - יוקרה איטלקית", s: "xerjoff-brand-review", kw: "xerjoff" },
    { t: "איך לבחור בושם חתימה (Signature Scent)?", s: "how-to-choose-signature-scent", kw: "general" },
    { t: "רוז'ה דאב (Roja Dove): המלך של הבישום", s: "roja-parfums-review", kw: "roja" },
    { t: "ההבדל בין או דה טואלט לפרפיום", s: "edt-vs-edp-vs-parfum", kw: "general" },
    { t: "5 בשמים מושלמים לדייט ראשון", s: "5-best-date-night-perfumes", kw: "date" },
    { t: "נישה או מעצבים? מה ההבדל הגדול?", s: "niche-vs-designer-perfumes", kw: "niche" },
    { t: "סקירה: קריד אוונטוס (Creed Aventus)", s: "creed-aventus-review-2025", kw: "creed" },
    { t: "איך לאחסן בשמים בצורה נכונה?", s: "how-to-store-perfume", kw: "storage" },
    { t: "מונטל (Montale) ומנסרה - עוצמה של חיות", s: "montale-mancera-powerhouses", kw: "montale" },
    { t: "בושם יוניסקס - האם יש דבר כזה?", s: "what-is-unisex-perfume", kw: "unisex" },
    { t: "סקירה: MFK Baccarat Rouge 540", s: "mfk-baccarat-rouge-540-review", kw: "mfk" },
    { t: "בשמים מומלצים לקיץ הישראלי", s: "best-summer-perfumes-israel", kw: "summer" },
    { t: "בשמים לאירועים מיוחדים וחתונות", s: "wedding-perfumes", kw: "wedding" },
    { t: "הכירו את Initio Parfums Prives", s: "initio-brand-intro", kw: "initio" },
    { t: "למה כדאי לנסות את Le Labo Santal 33?", s: "le-labo-santal-33-review", kw: "le labo" },
    { t: "בשמי גורמנד (Gourmand) - להריח כמו קינוח", s: "what-are-gourmand-perfumes", kw: "gourmand" },
    { t: "מה זה תווי בושם? ראש, לב ובסיס", s: "perfume-notes-explained", kw: "notes" },
    { t: "בשמים מומלצים למשרד ולעבודה", s: "office-friendly-perfumes", kw: "office" },
    { t: "Creed Green Irish Tweed - הקלאסיקה", s: "creed-git-review", kw: "creed" },
    { t: "ההיסטוריה של הבושם", s: "history-of-perfume", kw: "history" },
    { t: "מה זה Oud (אוד)?", s: "what-is-oud", kw: "oud" },
    { t: "איך להתאים בושם למצב הרוח?", s: "perfume-mood-matching", kw: "mood" },
    { t: "טעויות נפוצות בשימוש בבושם", s: "perfume-mistakes-to-avoid", kw: "mistakes" },
    { t: "סקירה: Parfums de Marly Delina", s: "pdm-delina-review", kw: "marly" },
    { t: "למה בשמים מריחים שונה על אנשים שונים?", s: "skin-chemistry-explained", kw: "skin" },
    { t: "הטרנדים החמים בעולם הבישום ל-2025", s: "perfume-trends-2025", kw: "trends" },
    { t: "איך אורזים בשמים לטיסה?", s: "packing-perfume-for-travel", kw: "travel" },
    { t: "מתנה מושלמת: איך לקנות בושם לאחר?", s: "buying-perfume-as-gift", kw: "gift" },
    { t: "קולקציית הבוטיק של ml_tlv", s: "ml-tlv-boutique-collection", kw: "boutique" }
];

async function seedBlog() {
    const client = await pool.connect();
    try {
        console.log('Fetching products...');
        const productRes = await client.query('SELECT name, brand, image_url FROM products WHERE active = true');
        const products = productRes.rows;

        for (const topic of TOPICS) {
            let relevantImages = [];

            // Smart Image Finding
            const brandMatch = Object.entries(BRAND_MAP).find(([k, v]) => topic.kw.includes(k));
            if (brandMatch) {
                relevantImages = products.filter(p => p.brand && p.brand.toLowerCase().includes(brandMatch[1].toLowerCase())).map(p => p.image_url).slice(0, 3);
            }
            if (relevantImages.length === 0 && products.length > 0) {
                relevantImages = products.sort(() => 0.5 - Math.random()).slice(0, 2).map(p => p.image_url);
            }

            // Generate Deep content base
            const deepContent = `
                בבואנו העסוק בנושא ${topic.t}, אי אפשר להתעלם מהמורכבות שלו. המומחים שלנו ב-ml_tlv נתקלים בשאלות לגבי זה מדי יום.
                החשיבות של הבנה מעמיקה ב${topic.kw} היא קריטית לכל מי שרוצה לבנות אוסף בשמים רציני.
                כפי שראינו לאורך ההיסטוריה, המגמות משתנות, אך העקרונות נשארים זהים.
                ${getRandomItem(CONTENT_LIBRARIES.history)}
                לכן, ההמלצה שלנו היא תמיד להתחיל בקטן, לנסות, ולהרגיש. אין תחליף לחוויה האישית.
            `;

            const excerpt = topic.desc || `המדריך המקיף ביותר ל${topic.t} לשנת 2025. כל מה שרציתם לדעת, טיפים מקצועיים והמלצות חמות מהצוות שלנו.`;

            // Generate Full HTML
            const finalContent = generateLongFormHTML(topic.t, excerpt, deepContent, relevantImages);
            const coverImage = getUniqueImageFromDeck();

            await client.query(`
                INSERT INTO blog_posts (title, slug, excerpt, content, image_url, tags)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (slug) DO UPDATE 
                SET title = EXCLUDED.title, 
                    content = EXCLUDED.content, 
                    image_url = EXCLUDED.image_url;
            `, [topic.t, topic.s, excerpt, finalContent, coverImage, ["בישום", "מדריך", "SEO"]]);

            process.stdout.write('+');
        }
        console.log('\n✅ Long-Form SEO Content Seeded!');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

seedBlog();
