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

const FILLER_TEXT = [
    "חשוב להבין שחווית הריח היא סובייקטיבית לחלוטין. מה שעשוי להריח כמו גן עדן לאדם אחד, עלול להיות כבד ומחניק עבור אדם אחר.",
    "בעולם הנישה, הגבולות מטשטשים בין מגדרים. בושם טוב הוא בושם שטוב לכם.",
    "העמידות תלויה בריכוז האלכוהול והשמנים, אך גם בלחות העור ובמזג האוויר.",
    "הבושם הוא האביזר הבלתי נראה החשוב ביותר. הוא משלים את ההופעה ומשאיר רושם גם אחרי שיצאתם מהחדר.",
    "כשקונים דוגמית (Decant), מקבלים את הנוזל המקורי בבקבוק קטן יותר. זה מאפשר להחזיק אוסף מגוון של ריחות יוקרה."
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// "Deck of Cards" Logic: Create a copy, shuffle, and deal. Refill when empty.
let imageDeck = [];

function getUniqueImageFromDeck() {
    if (imageDeck.length === 0) {
        // Refill and shuffle
        imageDeck = [...BASE_IMAGES].sort(() => 0.5 - Math.random());
    }
    return imageDeck.pop();
}

// Layout Generators
const layouts = {
    standard: (img, alt) => `
        <img src="${img}" alt="${alt}" class="w-full md:w-2/3 mx-auto rounded-xl shadow-md my-8 object-cover h-64 md:h-96 block">
    `,
    floatRight: (img, alt) => `
        <div class="clearfix my-6">
            <img src="${img}" alt="${alt}" class="w-full md:w-1/2 float-right ml-6 mb-4 rounded-xl shadow-md object-cover h-64">
            <p>${getRandomItem(FILLER_TEXT)}</p>
        </div>
    `,
    floatLeft: (img, alt) => `
         <div class="clearfix my-6">
            <img src="${img}" alt="${alt}" class="w-full md:w-1/2 float-left mr-6 mb-4 rounded-xl shadow-md object-cover h-64">
            <p>${getRandomItem(FILLER_TEXT)}</p>
        </div>
    `,
    twoCol: (img1, img2, alt) => `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            <img src="${img1}" alt="${alt} 1" class="w-full rounded-xl shadow-md object-cover h-48">
            <img src="${img2}" alt="${alt} 2" class="w-full rounded-xl shadow-md object-cover h-48">
        </div>
    `
};

function generateArticleHTML(title, excerpt, specificContent, articleImages) {
    // Priority: Specific Product Images -> Deck Images
    const img1 = articleImages[0] || getUniqueImageFromDeck();
    const img2 = articleImages[1] || getUniqueImageFromDeck();

    // Ensure we don't accidentally use the same image twice in one article if deck refilled
    let safeImg2 = img2;
    if (safeImg2 === img1) {
        safeImg2 = getUniqueImageFromDeck();
    }

    // Randomize Layouts
    const layoutType = Math.random() > 0.6 ? 'standard' : (Math.random() > 0.5 ? 'floatRight' : 'floatLeft');

    return `
        <p class="lead text-xl text-gray-600 font-serif mb-6">${excerpt}</p>
        
        ${layouts[layoutType](img1, title)}
        
        <div class="clear-both"></div>
        
        <p>בעולם הבישום, לכל ניחוח יש סיפור. הבחירה בבושם היא אישית מאוד ומשקפת את מי שאנחנו.</p>
        
        <h2>למה הנושא הזה חשוב?</h2>
        <p>${getRandomItem(FILLER_TEXT)}</p>
        
        ${specificContent}
        
        <div class="bg-gray-50 p-6 rounded-xl border-r-4 border-black my-8 clear-both">
            <h3 class="font-bold text-lg mb-2">טיפ מקצועי:</h3>
            <p>נסו את הבושם על העור והמתינו 15 דקות. זה הזמן שנדרש לתווי הלב לצאת החוצה.</p>
        </div>

        ${layouts.twoCol(safeImg2, getUniqueImageFromDeck(), title)}

        <h2>מסקנות והמלצות</h2>
        <p>${getRandomItem(FILLER_TEXT)}</p>
        <p>אצלנו ב-ml_tlv תמצאו את המגוון הגדול ביותר של דוגמיות בשמים בישראל.</p>
    `;
}

const BRAND_MAP = {
    'xerjoff': 'Xerjoff',
    'creed': 'Creed',
    'roja': 'Roja',
    'mfk': 'Maison Francis Kurkdjian',
    'initio': 'Initio',
    'marly': 'Parfums de Marly',
    'montale': 'Montale',
    'mancera': 'Mancera',
    'le labo': 'Le Labo'
};

async function seedBlog() {
    const client = await pool.connect();
    try {
        console.log(`Fetching products for smart imagery...`);
        const productRes = await client.query('SELECT name, brand, image_url FROM products WHERE active = true');
        const products = productRes.rows;

        const topics = [
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
            { t: "בשמי גורמן (Gourmand) - להריח כמו קינוח", s: "what-are-gourmand-perfumes", kw: "gourmand" },
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

        for (const topic of topics) {
            let relevantImages = [];

            const brandMatch = Object.entries(BRAND_MAP).find(([k, v]) => topic.kw.includes(k));
            if (brandMatch) {
                const brandName = brandMatch[1];
                const brandProducts = products.filter(p => p.brand && p.brand.toLowerCase().includes(brandName.toLowerCase()));
                relevantImages = brandProducts.map(p => p.image_url).slice(0, 3);
            }

            if (relevantImages.length === 0 && products.length > 0) {
                const shuffled = products.sort(() => 0.5 - Math.random());
                relevantImages = shuffled.slice(0, 2).map(p => p.image_url);
            }

            const body = `
                <h2>הרחבה על ${topic.t}</h2>
                <p>כאשר מדברים על ${topic.t}, ישנם רבדים רבים שיש לקחת בחשבון.</p>
                <h3>נקודות מפתח</h3>
                <ul>
                    <li>איכות חומרי הגלם וריכוז השמנים.</li>
                    <li>התאמה אישית לאופי ולסגנון החיים.</li>
                </ul>
            `;

            const excerpt = topic.desc || `מדריך מקיף ומידע חשוב על ${topic.t}. כל מה שרציתם לדעת.`;
            const finalContent = generateArticleHTML(topic.t, excerpt, body, relevantImages);
            const coverImage = relevantImages[0] || getUniqueImageFromDeck(); // Fallback to deck if no branding

            await client.query(`
                INSERT INTO blog_posts (title, slug, excerpt, content, image_url, tags)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (slug) DO UPDATE 
                SET title = EXCLUDED.title, 
                    content = EXCLUDED.content, 
                    image_url = EXCLUDED.image_url;
            `, [topic.t, topic.s, excerpt, finalContent, coverImage, ["בישום", "מדריכים"]]);

            process.stdout.write('.');
        }
        console.log('\n✅ Smart Seed Complete (Deck Logic + New Images)!');

    } catch (err) {
        console.error('Error seeding blog:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seedBlog();
