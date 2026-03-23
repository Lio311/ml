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
/**
 * Capitalizes the first letter of a string.
 */
function capitalize(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Translates a comma-separated list of terms (notes, categories, seasons) using the predefined dictionary.
 * Falls back to Google Translate API for unknown terms.
 * Ensures each term is capitalized.
 */
export async function translateList(listStr) {
    if (!listStr) return "";
    const items = listStr.split(",");
    const translatedItems = await Promise.all(items.map(async (s) => {
        let trimmed = s.trim();
        let result = commonTranslations[trimmed];
        
        if (!result) {
            // Fallback to API translation for unknown terms
            result = await translateText(trimmed);
        }
        
        return capitalize(result);
    }));
    return translatedItems.join(", ");
}

/**
 * Automatically translates free-form text from Hebrew to English using Google Translate free-tier API.
 */
export async function translateText(text) {
    if (!text || text.trim() === '') return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error('Translation API responded with out ok', res.status);
            return text; // Fallback to original
        }
        const data = await res.json();
        // data[0] is array of translated sentences
        const translated = data[0].map(x => x[0]).join('');
        return translated;
    } catch (e) {
        console.error("Translation API error:", e);
        return text; // Fallback to original on error
    }
}
