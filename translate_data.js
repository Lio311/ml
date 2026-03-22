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
    const blogTranslations = {
        1: { title: "Why Buy Perfume Decants? The Complete Consumer Guide for 2025", excerpt: "Learn how to build a luxury perfume wardrobe without breaking the bank. Everything you need to know about decants and how they change your shopping experience." },
        2: { title: "Brand Review: Xerjoff - Peak Italian Luxury, Art and Scent", excerpt: "Discover the history behind the most prestigious perfume house, its status symbol status, and the secret ingredients that make it irresistible." },
        3: { title: "How to Choose a Signature Scent? The Full Psychological and Practical Guide", excerpt: "Find the fragrance that tells your story to the world without speaking a word. A complete guide to finding your perfect perfume." },
        4: { title: "Roja Parfums Review: The Undisputed King of Luxury Perfumery", excerpt: "Discover the world's most expensive ingredients and what makes Roja Dove's creations so addictive and special." },
        5: { title: "EDT vs EDP vs Parfum: The Ultimate Guide to Concentration Science", excerpt: "Everything you need to know about longevity, presence, and concentration. What's the real difference and how does it effect your choice?" },
        6: { title: "5 Perfect Perfumes for a First Date: How to Smell Like a Million Dollars", excerpt: "The fragrances that leave an unforgettable first impression – how to smell amazing and which scents are the most loved." },
        7: { title: "Niche vs Designer: What is the Real Difference?", excerpt: "A deep dive into artistic perfumery vs commercial fashion. raw materials, production, and why you should switch to niche." },
        8: { title: "Creed Aventus Review 2025: Why is it Still the King?", excerpt: "Why is this perfume still the undisputed king of men's fragrances? An in-depth look at the most copied and loved perfume in history." },
        9: { title: "How to Store Perfumes Correctly? 10 Critical Mistakes That Ruin Your Expensive Scent", excerpt: "Keep your perfumes fresh and powerful for years. Learn the worst places to store perfume and why original packaging matters." },
        10: { title: "Brand Review: Montale & Mancera - Breaking the Rules of Niche Perfumery", excerpt: "Review of the brands that broke the rules with extreme longevity and unmissable presence. What's the secret of the metallic bottles?" },
        11: { title: "Unisex Perfumes: The Trend Changing the Industry", excerpt: "Is there really a gender for scent? Discover the best gender-neutral perfumes and why this trend is growing stronger." },
        12: { title: "MFK Baccarat Rouge 540 Review: The Most Talked-About Perfume of the Decade", excerpt: "What's the secret of the scent everyone is trying to copy? Discover why Baccarat Rouge is the symbol of modern luxury." },
        13: { title: "Top Perfumes for the Israeli Summer: How to Smell Fresh in 80% Humidity", excerpt: "Discover 5 luxury fragrances that survive the Israeli heat and humidity, keeping you fresh even in 35 degrees." },
        14: { title: "Perfumes for Special Events and Weddings: Choosing the Scent That Completes Your Look", excerpt: "Special event or wedding? Your perfume is the most important final touch. Discover the most prestigious evening fragrances." },
        15: { title: "Introducing Initio Parfums Prives: The Brand That Activates Instincts", excerpt: "Discover the secrets of Initio - the brand that brought 'pheromones' back to the perfume world. A deep dive into the French brand's most intriguing scents." },
        16: { title: "Why Try Le Labo Santal 33? The Secret Behind the Urban Cult Scent", excerpt: "How did one small NYC perfume conquer the world? Discover the story of Santal 33, why it smells so good (and weird) and who it's really for." },
        17: { title: "Gourmand Perfumes: Smelling Like a Luxury Dessert", excerpt: "Vanilla, caramel, and chocolate - the world of Gourmand perfumes is the most sought-after. Discover the most delicious scents and how to wear them." },
        18: { title: "What are Perfume Notes? The Scent Pyramid - Top, Heart, and Base explained like a pro", excerpt: "Why does perfume change after 30 minutes? Discover the secret of the pyramid structure - Top, Heart, and Base notes explained." },
        19: { title: "Office-Friendly Perfumes: Smelling Professional and Luxurious", excerpt: "Work environments demand a cleaner, more professional scent. Discover the best fragrances for long working days and business meetings." },
        20: { title: "Creed Green Irish Tweed In-Depth Review: The Elite Classic", excerpt: "Why has this perfume been a favorite of kings and Hollywood stars for decades? Discover the magic of GIT - the scent of the green countryside after rain." },
        21: { title: "Fascinating History of Perfume: From Ancient Egypt to Modern Niche", excerpt: "A journey through time from Ancient Egypt to the 20th-century perfume revolution. Everything you wanted to know about the history of scent." },
        22: { title: "What is Oud? Secrets of the Black Gold", excerpt: "Discover the most expensive ingredient in perfumery. What is the mysterious resin from infected wood, and how do you spot high-quality Oud?" },
        23: { title: "The Psychology of Scent: Matching Perfume to Your Mood", excerpt: "Your perfume can change how you feel. Discover which scents reduce stress, boost confidence, or spark creativity." },
        24: { title: "10 Common Perfume Mistakes: Why aren't you getting the most from your scent?", excerpt: "Spray on hair? Rubbing your wrists? Using heavy scents in the sun? Discover the common mistakes that are making you smell less than your best." },
        25: { title: "Parfums de Marly Delina Review: The Feminine Icon", excerpt: "Why did Delina become a feminine icon so fast? Discover the magic of Turkish rose, rhubarb, and vanilla magic." },
        26: { title: "The Chemical Riddle: Why common scents smell unique on different skins", excerpt: "Smelled great on a friend but like pickles on you? Learn what affects scent evolution - from skin pH to diet and lifestyle." },
        27: { title: "Hot Perfume Trends for 2025: What Will We Wear This Year?", excerpt: "The world is moving to green, molecular and natural scents. Discover the trends leading the shelves in 2025 and stay ahead of the game." },
        28: { title: "How to pack perfumes for a flight? Complete guide for the traveller", excerpt: "Traveling soon and want to smell great safely? Discover all the packing tips and why decants are your best friends on a flight." },
        29: { title: "Buying Perfume as a Gift: How to hit others' taste without the risk", excerpt: "Buying a perfume as a gift is a gamble that can pay off. Learn expert tricks for finding the scent that will surprise and excite your loved ones." },
        30: { title: "ml_tlv Boutique Collection: Why we choose only the best", excerpt: "What goes into selecting the perfumes on our site? Discover our standards, our rigorous testing, and our commitment to excellence." },
        331: { title: "Jo Malone London: The art of layering and British style", excerpt: "The Israeli heat is the enemy of perfume. Discover 5 luxury scents that survive the day and the secrets to making them last longer." },
        332: { title: "Xerjoff Erba Pura Review: The tropical explosion that changed the game", excerpt: "Tired of smelling like everyone else? Complete guide to scent layering. Learn how to combine perfumes to create a signature that is uniquely yours." },
        333: { title: "Chanel No. 5: Secrets behind the icon", excerpt: "Discover the story behind Chanel No. 5, the world's most iconic perfume. From Coco Chanel's vision to the aldehyde revolution." }
    };

    for (const b of data.blog_posts) {
        const trans = blogTranslations[b.id];
        let titleEn = b.title;
        let excerptEn = b.excerpt;
        let contentEn = b.content;

        if (trans) {
            titleEn = trans.title;
            excerptEn = trans.excerpt;
        }

        // Provide full content for top articles
        if (b.id === 8) { // Creed Aventus
            contentEn = `If there is one name that has defined masculine perfumery in the 21st century, it is **Aventus**. Since its launch in 2010 by the House of **Creed**, this perfume has become more than just a scent – it's a global obsession, a status symbol, and the most discussed fragrance in the history of the internet. At **ml_tlv**, Aventus remains our undisputed top seller. In this review, we'll dive into what makes this "pineapple king" so special.\n\n---\n\n## The Legend: Napoleon, Power, and Pineapple\nInspired by the Emperor Napoleon Bonaparte, Aventus was designed to represent power, success, and vision. It was a revolutionary composition that combined sharp fruitiness with smokiness and mossy depth – a DNA that is now known as "the Aventus DNA."\n* **Top Notes:** Pineapple, Bergamot, Blackcurrant, and Apple. The pineapple note is legendary; it's what gives Aventus its signature "sparkling" opening.\n* **Heart Notes:** Birch, Patchouli, Moroccan Jasmine, and Rose. The birch is what provides that slight smokiness that contrasts perfectly with the fruits.\n* **Base Notes:** Musk, Oakmoss, Ambergris, and Vanille. The Creed-exclusive Ambergris base gives it the salty, oceanic, and prestigious dry down.\n\n---\n\n## Why is it so addictive?\nAventus is often called "the compliment monster." It has a psychological effect on people – it smells professional yet approachable, powerful yet clean. It works in the office, at a wedding, or on a casual day out. It is the ultimate "white shirt" fragrance.\n\n---\n\n## Batch Variations: The Ultimate Collector's Game\nIf you dive into online forums, you'll hear talk of "batches." Some bottles are fruitier, some are smokier. This is due to the high use of natural ingredients by Creed. At **ml_tlv**, we ensure all our decants come from high-quality, authentic batches that represent the true essence of Aventus.\n\n**Experience the king of perfumes. Order a decant of Aventus now at ml_tlv.**`;
        } else if (b.id === 12) { // Baccarat Rouge 540
            contentEn = `It is the scent of the era. If you've been to a high-end mall, a luxury hotel, or a prestigious event in the last 5 years, you have smelled **Baccarat Rouge 540** by **Maison Francis Kurkdjian**. What started as a limited edition for the 250th anniversary of Baccarat crystal has become the most iconic perfume of the decade. But what exactly is the secret of this mysterious, airy, and "saffron-sugar" scent?\n\n---\n\n## The Alchemy of Air: What does it smell like?\nFrancis Kurkdjian, the master perfumer, aimed to create a scent that feels like "melted crystal." It doesn't smell like flowers or food; it smells conceptual.\n* **Top Notes:** Saffron and Jasmine. The saffron gives it that "expensive" and slightly medicinal opening.\n* **Heart Notes:** Amberwood and Ambergris. This is where the magic happens – the "burnt sugar" or "cotton candy" airiness that floats around you.\n* **Base Notes:** Fir Resin and Cedar. These provide the structure and the incredible longevity.\n\n---\n\n## The \"Scent Cloud\" Phenomenon\nBaccarat Rouge 540 is famous for its **sillage** (the trail you leave behind). You might not smell it on yourself after an hour, but everyone else in the room will. It creates a "cloud" of luxury that lasts for days on clothes.\n\n**Join the legend. Experience Baccarat Rouge 540 decants at ml_tlv.**`;
        } else if (b.id === 20) { // Creed GIT
            contentEn = `**Green Irish Tweed** (GIT) by the House of **Creed** is history in a bottle. Launched in 1985, it is a favorite of Hollywood stars and British aristocracy. It smells like the green Irish countryside after rain.\n\n---\n\n## The Experience: A Spring Walk in Ireland\nImagine a spring morning in a green village, the grass still wet with dew, and the air clean and cool.\n* **Top Notes:** Sicily Lemon and Verbena. A vibrant, sharp green opening.\n* **Heart Notes:** Violet Leaves and Florentine Iris. Prestigious, powdery elegance.\n* **Base Notes:** Natural Ambergris and Sandalwood. Creed's signature base providing incredible longevity and depth.\n\n**Connect with the legacy. Order a decant of GIT now at ml_tlv.**`;
        } else if (b.id === 332) { // Erba Pura
            contentEn = `**Erba Pura** by **Xerjoff** is a tropical explosion. Known as one of the strongest and most compliment-getting perfumes ever created.\n\n---\n\n## The Alchemy of Fruits\nIt feels like a giant, vibrant fruit basket on a sunny day in Sicily.\n* **Top Notes:** Sicily Orange, Lemon, and Bergamot.\n* **Heart Notes:** Secret tropical fruit basket.\n* **Base Notes:** White Musk, Amber, and Madagascar Vanilla.\n\n**Experience the explosion. Order a decant at ml_tlv.**`;
        } else if (b.id === 331) { // Jo Malone
            contentEn = `**Jo Malone London** is the symbol of understated elegance. The secret is the "Scent Pairing" philosophy, allowing you to create your own signature.\n\n---\n\n## Scent Layering\nDesigned to be worn alone or combined, giving you absolute freedom to create.\n* **Rule:** Heavy/warm first, then light/fresh over it.\n\n**Discover the art of layering with Jo Malone decants at ml_tlv.**`;
        } else if (b.id === 333) { // Chanel No 5
            contentEn = `**Chanel No. 5** is not just a perfume; it's a revolutionary icon. Gabrielle "Coco" Chanel wanted a scent that "smells like a woman, not a flower" - abstract and powerful.\n\n---\n\n## The Aldehyde Revolution\nLaunched in 1921, it used aldehydes to give the scent a "sparkling" quality, like champagne. It changed perfumery forever.\n\n**Experience magic. Order a Chanel No. 5 decant at ml_tlv.**`;
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
