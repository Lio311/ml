const fs = require('fs');
const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const commonTranslations = {
    "נשים": "Women",
    "גברים": "Men",
    "יוניסקס": "Unisex",
    "אין בארץ": "Rare / Not in Israel",
    "נדיר": "Rare",
    "לא מיוצר יותר": "Discontinued",
    "דיזיינר": "Designer",
    "ביסטמוד": "Beast Mode",
    "חורף": "Winter",
    "קיץ": "Summer",
    "סתיו": "Autumn",
    "אביב": "Spring",
    "ערב": "Evening",
    "דובאי": "Dubai",
    "ברגמוט": "Bergamot",
    "הדרים": "Citrus",
    "תווים ירוקים": "Green Notes",
    "אדמונית (פיאוני)": "Peony",
    "ורד": "Rose",
    "יסמין": "Jasmine",
    "מאסק לבן": "White Musk",
    "סנדלווד": "Sandalwood",
    "עלה הסיגלית": "Violet Leaf",
    "כוסברה": "Coriander",
    "פלפל שחור": "Black Pepper",
    "שושנת העמקים": "Lily of the Valley",
    "פצ'ולי": "Patchouli",
    "אמברגריס": "Ambergris",
    "וניל בורבון": "Bourbon Vanilla",
    "וניל": "Vanilla",
    "מי קוקוס": "Coconut Water",
    "אננס": "Pineapple",
    "פרח טיארה": "Tiare Flower",
    "פראנגיפני": "Frangipani",
    "מנטה": "Mint",
    "נרולי": "Neroli",
    "וטיבר": "Vetiver",
    "תפוז איטלקי": "Italian Orange",
    "תפוז": "Orange",
    "איריס": "Iris",
    "עור": "Leather",
    "אמברט": "Ambrette",
    "אוד": "Oud",
    "ארז": "Cedar",
    "לימון": "Lemon",
    "מרווה": "Sage",
    "הל": "Cardamom",
    "מונוי": "Monoi",
    "ילאנג-ילאנג": "Ylang-Ylang",
    "פרחים לבנים": "White Flowers",
    "פריחת תפוז": "Orange Blossom",
    "מאסק": "Musk",
    "אניס": "Anise",
    "אלמי": "Elemi",
    "תה": "Tea",
    "קקאו": "Cocoa",
    "דומדמניות שחורות": "Black Currant",
    "אלדהידים": "Aldehydes",
    "ליצ'י": "Lychee",
    "הליוטרופ": "Heliotrope",
    "עזרר": "Hawthorn",
    "מנגו": "Mango",
    "לוטוס": "Lotus",
    "סוכר ורוד": "Pink Sugar",
    "ג'ינג'ר": "Ginger",
    "פלפל ורוד": "Pink Pepper",
    "תפוח": "Apple",
    "לבנדר": "Lavender",
    "אזוב": "Moss",
    "אצות ים": "Seaweed",
    "סלסלת פירות טרופיים": "Tropical Fruit Basket",
    "פרחים אקזוטיים": "Exotic Flowers",
    "אפרסק": "Peach",
    "עלי דומדמניות": "Currant Leaves",
    "ריבס": "Rhubarb",
    "טונקה": "Tonka",
    "זעפרן": "Saffron",
    "מושק": "Musk",
    "תבלינים": "Spices",
    "פרח חינה": "Henna Flower",
    "ורד הודי": "Indian Rose",
    "מאסק טבעי": "Natural Musk",
    "ענבר": "Amber",
    "קליפות תפוז": "Orange Peel",
    "קינמון": "Cinnamon",
    "עוגיות חמאה": "Butter Cookies",
    "שוקולד": "Chocolate",
    "אגוזים": "Nuts",
    "פלפל": "Pepper",
    "עץ יבש": "Dry Wood",
    "חול": "Sand",
    "לאבדנום": "Labdanum",
    "קוקוס": "Coconut",
    "תווים ימיים": "Marine Notes",
    "ציפורן": "Clove",
    "תווים עציים": "Woody Notes",
    "ערער": "Juniper",
    "עלי עגבניה": "Tomato Leaves",
    "מגנוליה": "Magnolia",
    "גרניום": "Geranium",
    "בנזואין": "Benzoin",
    "רוזמרין": "Rosemary",
    "תפוח אפוי": "Baked Apple",
    "משמש": "Apricot",
    "בצק עלים": "Puff Pastry",
    "אגוז מלך": "Walnut",
    "שזיף": "Plum",
    "קרמל": "Caramel",
    "שקדים": "Almonds",
    "נקטרינה": "Nectarine",
    "אשכולית": "Grapefruit",
    "תווים תוססים": "Sparkling Notes",
    "פרוסקו": "Prosecco",
    "פריחת הדרים": "Citrus Blossom",
    "מאסק נקי": "Clean Musk",
    "סוכר עדין": "Subtle Sugar",
    "גלבנום": "Galbanum",
    "עשב": "Grass",
    "עלים ירוקים": "Green Leaves",
    "שרפים": "Resins",
    "מנדרינה": "Mandarin",
    "סגלית": "Violet",
    "עץ גואיק": "Guaiac Wood",
    "עלי טבק": "Tobacco Leaves",
    "עשן": "Smoke",
    "ענבר לבן": "White Amber",
    "קטורת": "Incense",
    "שורשים": "Roots",
    "עשבי תיבול": "Herbs",
    "תפוז דם": "Blood Orange",
    "אורז": "Rice",
    "ארז אטלס": "Atlas Cedar",
    "קוניאק": "Cognac",
    "טימין": "Thyme",
    "מור": "Myrrh",
    "אגוז מוסקט": "Nutmeg",
    "אמברוקסן": "Ambroxan",
    "קשמיר": "Cashmere",
    "עץ גואיאק": "Guaiac Wood",
    "סיפריול": "Cypriol",
    "ליים": "Lime",
    "לענה": "Artemisia",
    "ורד דה מאי": "Rose de Mai",
    "קמומיל": "Chamomile",
    "פטל": "Raspberry",
    "בננה": "Banana",
    "אשוח בלזם": "Balsam Fir",
    "צמר גפן מתוק": "Cotton Candy",
    "רום": "Rum",
    "פירות יער": "Berries",
    "פירות יבשים": "Dried Fruits",
    "יין אדום": "Red Wine",
    "סוכר חום": "Brown Sugar",
    "ליקר": "Liqueur",
    "ורד טורקי": "Turkish Rose",
    "ורד בולגרי": "Bulgarian Rose",
    "אזוב אלון": "Oakmoss",
    "אלגום": "Sandalwood",
    "פטל שחור": "Blackberry",
    "איסו אי סופר": "Iso E Super",
    "ערמון": "Chestnut",
    "בלזם פרו": "Peru Balsam",
    "קשמירן": "Cashmeran",
    "אפרסק לבן": "White Peach",
    "גזר": "Carrot",
    "דומדמניות": "Currants",
    "פירות יער אדומים": "Red Berries",
    "פפירוס": "Papyrus",
    "טבק": "Tobacco",
    "קפה": "Coffee",
    "תמרים": "Dates",
    "חלב חם": "Hot Milk",
};

function translateList(listStr) {
    if (!listStr) return "";
    return listStr.split(",").map(s => {
        let trimmed = s.trim();
        return commonTranslations[trimmed] || trimmed;
    }).join(", ");
}

async function main() {
    const data = JSON.parse(fs.readFileSync('data_to_translate.json', 'utf8'));
    
    console.log("Translating Products...");
    for (const p of data.products) {
        let categoryEn = translateList(p.category);
        let topEn = translateList(p.top_notes);
        let middleEn = translateList(p.middle_notes);
        let baseEn = translateList(p.base_notes);
        let seasonsEn = translateList(p.seasons);
        let descEn = p.description;
        if (p.id === 195) descEn = "A tribute to explosive feminine beauty...";
        else if (p.id === 160) descEn = "A black tuxedo suit. Patchouli, spices, vanilla, and amber...";
        
        await pool.query(`UPDATE products SET 
            category_en = $1, top_notes_en = $2, middle_notes_en = $3, 
            base_notes_en = $4, seasons_en = $5, description_en = $6
            WHERE id = $7`, 
            [categoryEn, topEn, middleEn, baseEn, seasonsEn, descEn, p.id]);
    }
    
    console.log("Translating Brands...");
    for (const b of data.brands) {
        let titleEn = b.title;
        let descEn = b.description;
        let highlightsEn = b.highlights;
        let perfEn = b.perfumer;
        
        if (b.name === "Bergamoss") {
            titleEn = "A Vision of Nature and Art: The World of Bergamoss";
            descEn = "Bergamoss is a breakthrough boutique perfume brand combining Italian citrus freshness with the mysterious depth of thick forests...";
        } else if (b.name === "Xerjoff") {
            titleEn = "Italian Magic and Uncompromising Luxury: The World of Xerjoff";
            descEn = "Founded in 2003 by Sergio Momo, Italian perfume house Xerjoff represents the pinnacle of modern perfumery art...";
        }

        await pool.query(`UPDATE brands SET 
            title_en = $1, description_en = $2, highlights_en = $3, perfumer_en = $4 
            WHERE name = $5`, 
            [titleEn, descEn, highlightsEn, perfEn, b.name]);
    }

    console.log("Translating Blog Posts...");
    const blogTitleTranslations = {
        "למה כדאי לקנות דוגמיות בושם (Decants)? המדריך הצרכני המלא והמעודכן ל-2025": "Why You Should Buy Perfume Decants? The Complete Consumer Guide for 2025",
        "סקירת מותג: קסרז'וף (Xerjoff) - שיא היוקרה האיטלקית, האומנות והריח": "Brand Review: Xerjoff - Peak Italian Luxury, Art and Scent",
        "איך לבחור בושם חתימה (Signature Scent)? המדריך הפסיכולוגי והמעשי המלא": "How to Choose a Signature Scent? The Full Psychological and Practical Guide",
        "רוז'ה דאב (Roja Dove): המלך הבלתי מעורער של עולם הבישום והיוקרה": "Roja Parfums Review: The Undisputed King of Luxury Perfumery",
        "ההבדל בין או דה טואלט, או דה פרפיום ופרפיום: המדריך הסופי למדע הריכוזים (Concentrations)": "EDT vs EDP vs Parfum: The Ultimate Guide to Concentration Science",
        "5 הבשמים המושלמים לדייט ראשון: איך להריח כמו מיליון דולר (ובלי להפחיד)": "5 Perfect Perfumes for a First Date: How to Smell Like a Million Dollars",
        "בשמי נישה מול בשמי מעצבים (Designer): מה ההבדל האמיתי ומה כדאי לכם לבחור?": "Niche vs Designer: What's the Real Difference and What Should You Choose?",
        "סקירה מעמיקה: קריד אוונטוס (Creed Aventus) - למה הוא עדיין המלך של בשמי הגברים?": "Creed Aventus In-Depth Review: Why is it Still the King of Men's Perfumes?",
        "איך לאחסן בשמים בצורה נכונה? 10 טעויות קריטיות שהורסות לכם את הריח היקר": "How to Store Perfumes Correctly? 10 Critical Mistakes That Ruin Your Expensive Scent",
        "סקירת מותגים: מונטל (Montale) ומנסרה (Mancera) - שבירת חוקי המשחק בבישום הנישה": "Brand Review: Montale & Mancera - Breaking the Rules of Niche Perfumery",
        "בושם יוניסקס: המגמה שמשנה את פני עולם הבישום - האם באמת יש מגדר לריח?": "Unisex Perfumes: The Trend Changing Perfumery - Is Scent Really Gendered?",
        "סקירה מעמיקה: MFK Baccarat Rouge 540 - הבושם הכי מדובר בעשור האחרון": "MFK Baccarat Rouge 540 Review: The Most Talked-About Perfume of the Decade",
        "המגזין המלא: בשמים מומלצים לקיץ הישראלי - איך להריח רענן בלחות של 80%?": "Top Perfumes for the Israeli Summer: How to Smell Fresh in 80% Humidity?",
        "בושם לאירועים מיוחדים וחתונות: איך לבחור את הריח שישלים את ההופעה שלכם": "Perfumes for Special Events and Weddings: Choosing the Scent That Completes Your Look",
        "הכירו את Initio Parfums Prives: המותג שמפעיל את מערכת הרגשות והמשיכה": "Introducing Initio Parfums Prives: The Brand That Activates Emotions and Attraction",
        "למה כדאי לנסות את Le Labo Santal 33? הסוד מאחורי הבושם שהפך לדת אורבנית": "Why You Should Try Le Labo Santal 33: The Secret Behind the Urban Cult Scent",
        "בשמי גורמנד (Gourmand): למה אנחנו כל כך אוהבים להריח כמו קינוח יוקרתי?": "Gourmand Perfumes: Why We Love Smelling Like a Luxury Dessert?",
        "מה זה תווי בושם? המבנה של הריח - ראש, לב ובסיס (Pyramid Structure)": "What are Perfume Notes? Scent Structure - Top, Heart and Base",
        "בשמים מומלצים למשרד ולעבודה: איך להריח מקצועי ויוקרתי בלי להפריע לסביבה": "Office-Friendly Perfumes: How to Smell Professional and Luxurious",
        "סקירה מעמיקה: Creed Green Irish Tweed - הקלאסיקה של האצולה הבריטית": "Creed Green Irish Tweed In-Depth Review: The British Aristocracy Classic",
        "ההיסטוריה המרתקת של הבושם: מקטורת לאלים ועד לבישום הנישה המודרני": "The Fascinating History of Perfume: From Incense for Gods to Modern Niche",
        "מה זה Oud (אוד)? הסודות של הזהב השחור של המזרח התיכון": "What is Oud? Secrets of the Middle East's Black Gold",
        "הפסיכולוגיה של הריח: איך להתאים את הבושם למצב הרוח ולשפר את היום שלך": "The Psychology of Scent: Matching Perfume to Your Mood",
        "10 טעויות נפוצות בשימוש בבושם: למה אתם לא מפיקים את המקסימום מהריח שלכם?": "10 Common Perfume Mistakes: Why Aren't You Getting the Most From Your Scent?",
        "סקירה מורחבת: Parfums de Marly Delina - בבושם הוורדים המבוקש ביותר בעולם": "Parfums de Marly Delina Review: The World's Most Requested Rose Scent",
        "החידה הכימית: למה אותו בושם מריח שונה על אנשים שונים? המדריך המדעי המלא": "The Chemical Riddle: Why Does the Same Perfume Smell Different on Different People?",
        "הטרנדים החמים בעולם הבישום ל-2025: מה נלבש בשנה הקרובה? המדריך המלא": "Hot Perfume Trends for 2025: What Will We Wear This Year?",
        "איך אורזים בשמים לטיסה? המדריך המלא לנוסע המתוחכם (Carry-on Ready)": "How to pack perfumes for a flight? The complete guide for the savvy traveler (Carry-on Ready)",
        "המדריך המקיף לקניית בבושם כמתנה: איך לקלוע לטעם של אחרים (בלי להסתכן)": "The Comprehensive Guide to Buying Perfume as a Gift: How to hit others' taste (without the risk)",
        "קולקציית הבוטיק של ml_tlv: למה אנחנו בוחרים רק את הטוב ביותר עבורכם?": "ml_tlv Boutique Collection: Why we choose only the best for you?",
        "שאנל 5 (Chanel No. 5): הסודות מאחורי הבושם האיקוני ששינה את פני עולם הבישום": "Chanel No. 5: The Secrets Behind the Iconic Perfume That Changed the Scent World",
        "סקירה: Xerjoff Erba Pura - הפיצוץ הטרופי ששינה את כללי המשחק": "Review: Xerjoff Erba Pura - The Tropical Explosion That Changed the Game",
        "Jo Malone London: אמנות ה-Scent Layering (שילוב בשמים) ומיצוי הסטייל הבריטי": "Jo Malone London: The Art of Scent Layering and Mastering British Style"
    };

    for (const b of data.blog_posts) {
        let titleEn = blogTitleTranslations[b.title] || b.title;
        let excerptEn = b.excerpt;
        let contentEn = b.content;

        if (b.id === 332) {
            titleEn = "Review: Xerjoff Erba Pura - The Tropical Explosion That Changed the Game";
            excerptEn = "Tired of smelling like everyone else? The complete guide to the art of layering in the field of perfumery...";
            contentEn = `If you're looking for a perfume that "chokes" the room...`;
        } else if (b.id === 331) {
            titleEn = "Jo Malone London: The Art of Scent Layering and Mastering British Style";
            excerptEn = "The heat and humidity of Israel are the biggest enemies...";
            contentEn = `There are brands that are not just perfumes...`;
        } else if (b.id === 333) {
            titleEn = "Chanel No. 5: The Secrets Behind the Iconic Perfume";
            excerptEn = "Discover the fascinating story behind Chanel No. 5...";
            contentEn = `If there is one name that resonates worldwide...`;
        } else if (b.id === 30) {
            titleEn = "ml_tlv Boutique Collection: Why we choose only the best for you?";
            excerptEn = "What stands behind the selection process of the perfumes on the site? Discover our standards, the tests we perform, and the commitment to excellence and luxury.";
        } else if (b.id === 29) {
            titleEn = "The Comprehensive Guide to Buying Perfume as a Gift: How to hit others' taste (without the risk)";
            excerptEn = "Buying a perfume as a gift is a gamble, but the right gamble can pay off big time. Get the tips from the experts to find the scent that will surprise and excite the people you love.";
        } else if (b.id === 28) {
            titleEn = "How to pack perfumes for a flight? The complete guide for the savvy traveler (Carry-on Ready)";
            excerptEn = "You're flying on vacation and want to smell great, but afraid the expensive bottle will break or be taken at security? Discover all the tips for proper packing and why decants are your best friends on a flight.";
        }

        await pool.query(`UPDATE blog_posts SET 
            title_en = $1, excerpt_en = $2, content_en = $3
            WHERE id = $4`, 
            [titleEn, excerptEn, contentEn, b.id]);
    }
    
    console.log("Done.");
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
