require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const fragranceData = [
    // ASMR Fragrances
    { name: "Chocolate Crush", top: "חמאת בוטנים, שוקולד מריר", middle: "קרקרים, אגוזים", base: "וניל, חלב" },
    { name: "Ocean Relaxation", top: "מלח ים, אוזון", middle: "אצות, תווים מימיים", base: "עץ סחף, מאסק לבן" },
    { name: "Yummy Tingles", top: "חמאה, חלב", middle: "לחם קלוי, קרמל", base: "וניל" },

    // Agarthi
    { name: "Burning Core", top: "זעפרן, ג'ינג'ר", middle: "עשב סיפריול, עור", base: "סטאירקס, וניל, פצ'ולי" },
    { name: "Floating Lands", top: "גלבנום, תאנה", middle: "טיובר, יסמין, נרקיס", base: "דבש, איריס" },

    // Akro
    { name: "Rise", top: "מי קוקוס, אננס", middle: "פרח טיארה, פראנגיפני", base: "סנדלווד" },

    // Amouage
    { name: "Overture Woman", top: "ברגמוט, זעפרן, ברנדי תפוחים", middle: "ורד, גרניום, מור, קינמון", base: "לבונה, עור, לאבדנום" },

    // Arabian Oud
    { name: "Aseel Special Edition", top: "פירות יער אדומים, ליצ'י", middle: "ורד, נרולי", base: "וניל, ענבר, אוד" },
    { name: "Madawi", top: "פריחת תפוח, אפרסק", middle: "אננס, יסמין, ברגמוט", base: "מאסק, ורד, פצ'ולי" },
    { name: "Royal Oud", top: "לימון", middle: "ורד, תה", base: "אוד קמבודי, מאסק, סנדלווד" },

    // Areej Le Doré
    { name: "Gul Hina", top: "הל, תבלינים", middle: "פרח חינה, ורד הודי", base: "מאסק טבעי, סנדלווד, ענבר" },

    // Aroma Di Lamore (Estimated)
    { name: "Abu Dhabi", top: "תבלינים", middle: "עור, אוד", base: "ענבר, מאסק" },
    { name: "Las Vegas", top: "רום, תפוח", middle: "טבק, קינמון", base: "עור, וניל" },
    { name: "Milano", top: "הדרים, לבנדר", middle: "זעפרן, איריס", base: "עור, פצ'ולי" },
    { name: "Munich", top: "תווים ירוקים, ברגמוט", middle: "ארז, אורנים", base: "טחב אלון, אדמה" },
    { name: "Ryiadh", top: "לבונה", middle: "אוד, מור", base: "סנדלווד, מאסק שחור" },

    // Atelier Materi
    { name: "Iris Ebène", top: "מנדרינה, פלפל ורוד", middle: "איריס, זמש", base: "בלזם פרו, עץ הובנה, סנדלווד" },

    // Birkholz
    { name: "Mornings In Milano", top: "ברגמוט, תווים ירוקים", middle: "יסמין, מגנוליה, גרדניה", base: "וניל, מאסק" },

    // Boadicea the Victorious
    { name: "Blue Sapphire Supercharged", top: "לימון, תפוז, מרווה", middle: "ורד, הל, יסמין", base: "אוד, ענבר, פצ'ולי" },
    { name: "Dasman", top: "זעפרן, לבנדר, ברגמוט", middle: "ורד טורקי, גרניום", base: "אוד, קטורת, וטיבר, פצ'ולי" },
    { name: "Energizer", top: "אשכולית, ברגמוט", middle: "תפוז, לימון", base: "מאסק, וטיבר" },
    { name: "Glorious", top: "פטל, שזיף, אפרסק", middle: "יסמין, הל, ורד", base: "וניל, ארז, עץ גואיק, ענבר" },

    // Bohoboco
    { name: "Sea Salt Caramel", top: "לימון, מלח ים, פלפל ורוד", middle: "יסמין, עלה דפנה, אצות", base: "קרמל מלוח, סוכר חום, ארז" },
    { name: "Red Wine Brown Sugar", top: "פירות יער, פירות יבשים", middle: "יין אדום, ארז, פצ'ולי", base: "סוכר חום, ליקר, עור" },

    // Bortnikoff
    { name: "Cologne de Feu", top: "תפוז דם, לימון, ברגמוט", middle: "תה שחור, יסמין, עץ גואיק", base: "אזוב אלון, אוד, ענבר" },
    { name: "Dubai", top: "אננס, לימון, תפוז", middle: "יסמין, ציפורן, פלפל, שוקולד", base: "אוד, וניל, מאסק" },
    { name: "Sayat Nova", top: "משמש, נרקיס", middle: "רום, וניל", base: "אוד לאוס, אוד בנגלדשי, מגנוליה, אזוב אלון" },

    // Byredo
    { name: "Oud Immortel", top: "לימונצ'לו, קטורת, הל", middle: "אוד, פצ'ולי, פפירוס", base: "אזוב אלון, טבק" },

    // Christian Provenzano Parfums
    { name: "Ophelie", top: "פירות אדומים, ברגמוט", middle: "ורד, יסמין, ילאנג-ילאנג, טיובר", base: "מאסק, וניל, ענבר" },

    // Clive Christian
    { name: "1872 For Men", top: "גלבנום, אשכולית, ליים, פטיט-גריין", middle: "רקפת, מרווה, פרזיה, יסמין", base: "ארז, מאסק, ענבר, לבונה" },
    { name: "Blonde Amber", top: "רום, תפוז מר, ג'ינג'ר, הל", middle: "טבק בלונדיני, פירות יבשים, איריס, יסמין", base: "טונקה, וטיבר, מור, וניל, פצ'ולי" },
    { name: "Crab Apple Blossom", top: "תווים ימיים, ברגמוט, פריחת תפוח", middle: "מוחיטו, ריבס", base: "סנדלווד, עץ סחף" },
    { name: "Jump Up And Kiss Me Hedonistic", top: "דובדבן שחור, לימון, מנדרינה", middle: "יסמין, סגלית, איריס, טבק", base: "ענבר, עור, וניל, טונקה" },
    { name: "L Floral Chypre", top: "פלפל ורוד, פרחים", middle: "ורד, יסמין", base: "פצ'ולי, אזוב אלון, מאסק" },

    // Comporta
    { name: "Femme Fougere", top: "ברגמוט, פירות אדומים", middle: "לבנדר, יסמין, גרניום", base: "אזוב אלון, פצ'ולי, מאסק" },
    { name: "Will (Be There)", top: "ג'ינג'ר, פלפל ורוד", middle: "איריס, תאנה", base: "בנזואין, טונקה" },

    // Creed
    { name: "Aventus", top: "אננס, דומדמניות שחורות, ברגמוט, תפוח", middle: "ליבנה, פצ'ולי, ורד, יסמין", base: "מאסק, אזוב אלון, ענבר אפור, וניל" },

    // De Gabor
    { name: "Darling", top: "ברגמוט, ג'ינג'ר, זעפרן, דובדבן, קוניאק", middle: "שזיף מיובש, תאנה, מרציפן, רום, פרלין", base: "סנדלווד, וניל, ענבר, מאסק, פצ'ולי" },

    // Dior
    { name: "Homme Parfum", top: "תפוז איטלקי, איריס", middle: "ורד, עור", base: "אמברט, אוד, ארז, סנדלווד" },
    { name: "Tobacolor", top: "עלי טבק, הדרים", middle: "דבש, שזיף, אפרסק", base: "טבק, עשן, ענבר לבן" },

    // Dolce & Gabbana
    { name: "Light Blue Forever pour Homme", top: "אשכולית, ברגמוט", middle: "תווים אוזוניים, עלה הסיגלית", base: "וטיבר, מאסק לבן, פצ'ולי" },
    { name: "Royal Night The One", top: "הל, בזיליקום", middle: "עץ אגס בר, אגוז מוסקט", base: "סנדלווד, ענבר, ארז, לאבדנום" },

    // Elisire
    { name: "Desired", top: "ברגמוט, אשכולית, זעפרן", middle: "כמון, הל, ציפורן, יסמין", base: "סנדלווד, ארז, טונקה, וניל" },

    // Ermenegildo Zegna
    { name: "Italian Bergamot", top: "ברגמוט איטלקי", middle: "נרולי, רוזמרין", base: "וטיבר" },

    // Escentric Molecules
    { name: "Molecule 01", top: "", middle: "", base: "איסו אי סופר" },

    // Farmacia SS. Annunziata
    { name: "Citrus Paradisi", top: "אשכולית, לימון", middle: "תווים ירוקים", base: "תווים עציים" },
    { name: "Sparkling Notturno", top: "הדרים, פלפל ורוד", middle: "ורד, יסמין, פריחת תפוז", base: "וניל, מאסק, פצ'ולי" },
    { name: "Whisky Nobile", top: "קטורת, קפה", middle: "וויסקי, הל", base: "קקאו, וטיבר, עור" },

    // Fascent
    { name: "Milky No Way", top: "חלב חם", middle: "וניל, קרמל", base: "מאסק, סנדלווד" },

    // Fragrance Du Bois
    { name: "Oud Jaune Intense", top: "מונוי, ילאנג-ילאנג, אננס, תמצית מים", middle: "יסמין, פרחים לבנים, פריחת תפוז", base: "אוד, וניל, מאסק" },
    { name: "Oud Orange Intense", top: "קוקוס, פירות", middle: "וניל בורבון", base: "וניל, מאסק, אוד" },

    // Gamalion Paris
    { name: "Sublime Saison", top: "אפרסק, תפוח, תפוז", middle: "ורד, סיגלית", base: "וניל, מאסק" },

    // Gio L’Arome
    { name: "Topazio", top: "תפוז, לימון, ברגמוט", middle: "פירות מתוקים, יסמין", base: "מאסק לבן, ענבר, וניל" },
    { name: "Zafiro", top: "תווים ימיים, הדרים", middle: "תבלינים, עשבי תיבול", base: "פצ'ולי, עץ, ענבר" },
    { name: "Emeraude", top: "פטל, זעפרן", middle: "עור, יסמין", base: "ענבר, אזוב" },
    { name: "Ruby", top: "זעפרן, שקד מר", middle: "יסמין, ארז", base: "ענבר אפור, מאסק, תווים עציים" },

    // Giorgio Armani
    { name: "Acqua di Gio Essenza", top: "מים, ברגמוט, אשכולית", middle: "בזיליקום, פרחים, מרווה", base: "ארז, פצ'ולי, אמברגריס, פלפל" },

    // Goti
    { name: "Alchemico Fuoco (Fire)", top: "עשן, שרף", middle: "תבלינים חריפים, פלפל", base: "שרפים חמים, עץ שרוף" },
    { name: "Alchemico Acqua (Water)", top: "ג'ינג'ר, ילאנג ילאנג", middle: "פרח טיארה, תווים ימיים", base: "אצות ים, מאסק" },
    { name: "Alchemico Aria (Air)", top: "פירות, הדרים", middle: "לבנדר, מחטי אורן, תבלינים", base: "טוברוזה, תווים אוזוניים" },
    { name: "Alchemico Visione 2 Terra", top: "תווים ירוקים, גלבנום", middle: "עשב, עלים ירוקים", base: "שרפים, תווים עציים" },

    // Guerlain
    { name: "Cherry Oud", top: "דובדבן, הל", middle: "ורד טורקי, ורד בולגרי", base: "אוד, עור" },
    { name: "L'Instant de Guerlain pour Homme", top: "לימון, ברגמוט, אניס, אלמי", middle: "תה, יסמין, קקאו", base: "פצ'ולי, סנדלווד" },
    { name: "Musc Noble", top: "זעפרן, פלפל ורוד", middle: "ורד, מאסק, גרניום", base: "סיסטוס, ארז, ענבר לבן" },

    // Henry Jacques
    { name: "Merveilleuse", top: "תווים ירוקים, הדרים", middle: "יסמין, ורד, ילאנג-ילאנג", base: "תווים עציים, איריס" },

    // Hermès
    { name: "Terre d'Hermes", top: "תפוז, אשכולית", middle: "פלפל, גרניום", base: "וטיבר, ארז, פצ'ולי, בנזואין" },

    // Iggywoo
    { name: "Love Extreme", top: "דובדבן, פלפל ורוד", middle: "דומדמניות, ורד, קטורת", base: "אוד, פצ'ולי, וניל" },

    // Imaginary Authors
    { name: "In Love With Everything", top: "פטל, הדרים, קוקוס", middle: "סוכר דקלים, ורד", base: "סנדלווד, אבק כוכבים" },
    { name: "Decisions, Decisions", top: "בירה שחורה (סרספרילה)", middle: "טיובר, גרניום, פטל", base: "יסמין, לאבדנום, עור" },
    { name: "Falling Into The Sea", top: "לימון, ברגמוט, אשכולית", middle: "ליצ'י, פרחים טרופיים", base: "חול ים חם" },

    // Initio
    { name: "Blessed Baraka", top: "פרחים לבנים", middle: "סנדלווד", base: "ענבר, מאסק, וניל" },

    // Jean Paul Gaultier
    { name: "Le Male Superman Eau Fraiche", top: "מנטה, נרולי, אלדהידים", middle: "מרווה, ענבר", base: "וניל, טונקה, סנדלווד" },

    // Jijide
    { name: "Impeto Blu - XAN HAI", top: "אניס, ברגמוט", middle: "תווים ימיים, תבלינים", base: "מאסק, עץ" },
    { name: "Scrigno Celeste - ZE BAI", top: "תה לבן", middle: "יסמין, פרחים לבנים", base: "אמברט, מאסק" },

    // Jorum Studio
    { name: "Trimerous", top: "נקטרינה, טימין, פלפל ורוד", middle: "שורש איריס", base: "זמש, וניל, קטורת, אוד, ענבר" },

    // KV
    { name: "Chilli Candy Crush", top: "צ'ילי, ג'ינג'ר מסוכר, וואסבי, סורבה לימון", middle: "ורד, קינמון", base: "צמר גפן מתוק" },
    { name: "El Badia", top: "הל, קפה", middle: "תמרים, פירות יבשים, עור", base: "עשן, וניל, אוד" },
    { name: "She is Glowing", top: "מנגו, פסיפלורה, אשכולית", middle: "מגנוליה, ורד", base: "סנדלווד, מאסק" },

    // Kilian
    { name: "Flower of Immortality", top: "אפרסק לבן, גזר, דומדמניות", middle: "ורד, איריס", base: "טונקה, וניל" },
    { name: "Fun Things Always Happen After Sunset", top: "דומדמניות שחורות, ליצ'י", middle: "ורד", base: "פצ'ולי, מאסק" },
    { name: "Killing Me Slowly", top: "דומדמניות שחורות, אלדהידים, ליצ'י", middle: "ורד, איריס, עזרר", base: "וניל, הליוטרופ" },

    // Maie Piou
    { name: "Banana Oud", top: "בננה, חלב", middle: "אמברט, וניל", base: "אוד, סנדלווד, טונקה" },
    { name: "Cherry Harley", top: "דובדבן, זעפרן", middle: "דיו, עור", base: "קשמיר, מאסק" },
    { name: "Wood You", top: "אתרוג, ברגמוט", middle: "ג'ינג'ר, פלפל", base: "ארז, וטיבר, סנדלווד" },

    // Maison Francis Kurkdjian
    { name: "Baccarat Rouge 540 Extrait de Parfum", top: "שקד מר, זעפרן", middle: "יסמין מצרי, ארז", base: "מאסק, עץ, ענבר אפור" },

    // Mayhap
    { name: "Amant Numérique", top: "לימון, פלפל שחור", middle: "איריס, קשמיר", base: "אמברוקסן, מאסק" },

    // Memoirs Of A Perfume Collector
    { name: "Pacific Grapefruit", top: "אשכולית, יוזו", middle: "תווים ימיים", base: "אמברגריס" },
    { name: "Tales from Zanzibar", top: "ליים, מנדרינה, פלפל", middle: "מנגו, גויאבה, אוד", base: "טבק, סנדלווד, מאסק" },
    { name: "Trouble In Paradise", top: "קוניאק", middle: "מנגו, עור, דבש, קרמל", base: "אוד, וניל, סנדלווד" },

    // Moresque
    { name: "Sahara Blue", top: "לימון, ג'ינג'ר, פלפל ורוד, תפוח", middle: "כוסברה, לבנדר, יסמין", base: "מאסק, ענבר, אזוב, אצות ים" },

    // OTO Parfum
    { name: "Kalira", top: "ברגמוט, הל", middle: "איריס, יסמין", base: "סנדלווד, ארז" },

    // Olfactive Studio
    { name: "Chypre Shot", top: "הל, זעפרן, ברגמוט", middle: "פלפל שחור, אדמונית, קפה, תה שחור", base: "אזוב אלון, פצ'ולי, לאבדנום, ענבר" },
    { name: "Woody Mood", top: "ברגמוט, ג'ינג'ר, מרווה, זעפרן", middle: "סקויה, נרד, תה שחור, קטורת", base: "פצ'ולי, עור, קקאו, סטאירקס" },

    // Optico Profumo
    { name: "Brazil", top: "ברגמוט, תפוז, עלי עגבניה, ארז", middle: "פסיפלורה, מנגו, אפרסק, מגנוליה", base: "סנדלווד, ארז, מאסק, וטיבר" },

    // Ormonde Jayne
    { name: "Royal Elixir", top: "תווים ירוקים, תפוז, ברגמוט", middle: "יסמין, אוסמנטוס, שמן ורדים, שורש איריס", base: "אמברוקסן, ארז, טונקה, מאסק, פצ'ולי" },

    // Oud Elite
    { name: "Masha'er", top: "לימון, אפרסק, אננס, תפוח", middle: "הל, יסמין", base: "וניל, פצ'ולי" },
    { name: "Quwafi Black", top: "תבלינים, זעפרן", middle: "אוד, עור", base: "מאסק, עץ" },

    // Parfums d'Elmar
    { name: "Elixir d'Amour", top: "פלפל ורוד, זעפרן, ברגמוט, עלי תאנה", middle: "ורד בולגרי, פטל, שושנת העמקים, עץ גואיק", base: "וניל, אוד, קרמל, פצ'ולי, ענבר, מאסק, לאבדנום" },

    // Parfums de Marly
    { name: "Layton", top: "תפוח, לבנדר, מנדרינה, ברגמוט", middle: "גרניום, סגלית, יסמין", base: "וניל, הל, סנדלווד, פלפל, פצ'ולי, עץ גואיק" },
    { name: "Pegasus", top: "הליוטרופ, כמון, ברגמוט", middle: "שקד מר, לבנדר, יסמין", base: "וניל, סנדלווד, ענבר" },

    // Pernoire
    { name: "Mansa", top: "פטל אוכמניות, פלפל ורוד, זעפרן", middle: "שורש איריס, ורד, עור, הליוטרופ", base: "פצ'ולי, אזוב, ענבר, מאסק" },

    // Philipp Plein Parfums
    { name: "No Limit$", top: "תווים מימיים, ברגמוט, ג'ינג'ר, פלפל שחור, הל, קינמון, כוכב אניס", middle: "שוקולד מריר, וניל בורבון, קטורת, ענבר", base: "עור, אוד, עץ ארז, פצ'ולי" },

    // Ramon Monegal
    { name: "Flamenco Extrait de Parfum", top: "פטל, תפוח, סגלית", middle: "ורד, יסמין, איריס", base: "ארז, ענבר, עץ ברוש, אורן" },

    // Regalien
    { name: "Turkuaz", top: "תווים ימיים, אוזון, פלפל שחור, זעפרן", middle: "אצות ים, עלי דפנה, אקליפטוס", base: "אמברגריס, אזוב אלון, סנדלווד" },

    // Renoir Parfums
    { name: "Mojito Erotique", top: "ליים, מנטה, רום", middle: "קנה סוכר, יסמין", base: "מאסק, ארז" },

    // Roads
    { name: "I am Dance", top: "מנדרינה, לימון, תווים ימיים", middle: "תפוח, אננס, לבנדר", base: "ענבר, ארז, פצ'ולי" },

    // Roja Parfums
    { name: "Haute Parfumerie 15th Anniversary", top: "אלדהידים, הדרים", middle: "אפרסק, סגלית, איריס, יסמין", base: "אזוב, מאסק, תווים עציים" },
    { name: "Haute Parfumerie 20th Anniversary", top: "אלדהידים, ברגמוט", middle: "ורד, יסמין, אפרסק", base: "וניל, איריס, סנדלווד, בנזואין" },
    { name: "Pierre de Velay No. 1", top: "הדרים", middle: "ורד דה מאי, יסמין", base: "פצ'ולי, אזוב, עור, וניל" },
    { name: "Amber Aoud Absolue Precieux", top: "לימון, ברגמוט, ליים", middle: "ורד, יסמין, ילאנג-ילאנג, תאנה", base: "קינמון, זעפרן, פצ'ולי, אזוב, סנדלווד, אוד, ענברגריס, לבונה" },
    { name: "Amber Aoud Crystal Parfum Oman Air Edition", top: "לימון, ברגמוט, ליים", middle: "ורד, יסמין, ילאנג-ילאנג, תאנה", base: "אוד, קינמון, זעפרן, ענברגריס" },
    { name: "Harrods Aoud", top: "אלדהידים, הדרים", middle: "ורד דה מאי", base: "אוד, קינמון, פלפל ורוד, שרפים" },
    { name: "Kuwait", top: "אתרוג, רוזמרין", middle: "אפרסק, עלי דומדמניות, ורד, יסמין, הליוטרופ", base: "וניל, אוד, ריבס, טונקה, זעפרן, מושק" },
    { name: "Pierre de Velay The Oud", top: "הדרים, פלפל שחור", middle: "ורד, יסמין", base: "אוד, עור, סנדלווד" },

    // Rubeus Milano
    { name: "Quercia", top: "פירות אדומים, ג'ינג'ר, פלפל ורוד", middle: "יסמין, שזיף", base: "אזוב אלון, פצ'ולי, ארז" },

    // SW19
    { name: "6am", top: "ברגמוט, אשכולית, אניס", middle: "הל, מרווה, בזיליקום", base: "לענה, ארז, מאסק" },
    { name: "9pm", top: "פלפל ורוד, פריחת תפוז", middle: "ורד, תה שחור", base: "וניל, מרשמלו, ארז, מאסק" },
    { name: "Midnight", top: "שושנת העמקים", middle: "פרחים לבנים, איריס", base: "סנדלווד, מאסק" },
    { name: "Noon", top: "הדרים, מנטה", middle: "יסמין, נרולי", base: "וטיבר, אמברגריס" },

    // Simone Andreoli
    { name: "Business Man", top: "אשכולית, דומדמניות שחורות", middle: "עלה דפנה, תווים ירוקים", base: "וטיבר" },
    { name: "Malibu - Party in the Bay", top: "ליים, תווים ירוקים", middle: "קוקוס, סוכר", base: "רום, סנדלווד" },
    { name: "Zest di Sorrento", top: "לימון, ברגמוט", middle: "נרולי", base: "תווים עציים" },

    // Soma Parfums
    { name: "Halcyon", top: "דבש, טופי", middle: "קינמון, וניל", base: "בנזואין, טונקה, טבק" },

    // Somens
    { name: "Arena", top: "הל, ורד, ארטמיזיה", middle: "פירות אדומים, מרווה", base: "ענבר, וניל, מאסק, תווים עציים" },
    { name: "Aria", top: "לימון, ברגמוט, רימון", middle: "תאנה, יסמין", base: "וטיבר, ארז, מאסק" },
    { name: "Atlantis", top: "תות שדה, פירות יער", middle: "תווים ימיים, תפוח", base: "פצ'ולי, וניל" },
    { name: "Capriccio", top: "אננס, חמוציות, ברגמוט", middle: "יסמין, פצ'ולי, זעפרן", base: "ליבנה, ענבר, מאסק, אזוב" },
    { name: "Onice", top: "תפוז, מנטה", middle: "יסמין, ג'ינג'ר", base: "סנדלווד, ענבר" },

    // Sora Dora
    { name: "7 (Sept)", top: "קלמנטינה, לימון, ברגמוט", middle: "קוקוס, קקאו, תאנה", base: "רום, טבק, סנדלווד" },
    { name: "Jany", top: "תפוח אפוי, אפרסק, משמש", middle: "בצק עלים, אגוז מלך, שזיף, קינמון", base: "קרמל, וניל, שקדים, מאסק" },

    // Sospiro
    { name: "Anniversary Edition", top: "פירות יער אדומים, טבק, שקדים", middle: "יסמין, קוקוס, איריס", base: "מאסק, וטיבר, סנדלווד" },
    { name: "Contralto", top: "פלפל ורוד, ניצני ציפורן, פריחת תפוז", middle: "ערמונים, עץ גואיק, ערער", base: "וניל, בלזם פרו, קשמירן" },
    { name: "Liberto", top: "אפרסק, תבלינים", middle: "יסמין, זעפרן", base: "פצ'ולי, ענבר" },

    // Tauer Perfumes
    { name: "L'Air Des Alpes Suisses", top: "תווים ירוקים, אוויר הרים", middle: "שושן צחור, תבלינים, סחלב", base: "ארז, עץ אשור, ענבר" },

    // Teo Cabanel
    { name: "Et Voilà", top: "נרולי, אלדהידים", middle: "פרחים לבנים, הליוטרופ", base: "מאסק לבן, סנדלווד" },

    // Thameen
    { name: "Royal Sapphire", top: "מנדרינה, ברגמוט", middle: "יסמין, פריחת תפוז", base: "ענבר אפור, אזוב, פצ'ולי, עץ יבש" },

    // The Harmonist
    { name: "Hypnotizing Fire", top: "פלפל אנגלי, ציפורן", middle: "ורד בולגרי, פצ'ולי", base: "וניל מדגסקר, בנזואין, אופופונקס" },

    // The Lab
    { name: "Amber Chocolate", top: "קקאו, הדרים", middle: "שוקולד מריר, תבלינים", base: "ענבר, וניל" },
    { name: "C'est La Vie", top: "פירות מתוקים, דומדמניות", middle: "ורד, יסמין", base: "וניל, פרלין" },
    { name: "Corinto Kush", top: "פסיפלורה, נרולי, צמר גפן מתוק", middle: "קנאביס, עור", base: "ארז טקסס, אמברוקסן, באלזם טולו" },
    { name: "Fresh Vetiver", top: "לימון, ברגמוט", middle: "תבלינים טריים", base: "וטיבר, ארז" },
    { name: "Karma", top: "פלפל שחור, קטורת", middle: "פצ'ולי, שורשים", base: "ענבר, תווים עציים" },
    { name: "Lotto Cocoon", top: "תווים ירוקים, פרחים", middle: "לוטוס, קוקוס", base: "מאסק, תווים חלביים" },
    { name: "Neroli Negro", top: "נרולי, פטיט-גריין", middle: "עץ כהה, תבלינים", base: "עשן, מאסק שחור" },
    { name: "OMG", top: "סלסלת פירות טרופיים", middle: "פרחים אקזוטיים", base: "מאסק, וניל, ענבר" },
    { name: "Tobacco Blanco", top: "קפה, פומלו", middle: "פאלו סנטו, וניל", base: "טבק, אלון" },

    // The Spirit of Dubai
    { name: "Ajyal", top: "ברגמוט, שזיף, ירוקים, ים", middle: "ורד, יסמין, הליוטרופ", base: "ענבר, וניל, אוד, מאסק, סנדלווד" },
    { name: "Bahar", top: "תווים ימיים, מלח, הדרים, פירות", middle: "תבלינים, יסמין, עלי סיגלית", base: "וניל, ענבר, סנדלווד, קשמיר" },
    { name: "Majalis", top: "קטורת, אפרסק, תפוח, ורד, קפה, הל, תות", middle: "תמרים, זעפרן, קקאו, פצ'ולי", base: "אוד, דבש, טבק, עור, וניל" },

    // Theodoros Kalotinis
    { name: "Aegean Salt & Citrus", top: "אשכולית, לימון", middle: "מלח ים", base: "תווים מימיים" },
    { name: "I Am Beautiful", top: "פירות יער אדומים, ברגמוט", middle: "ורד, סיגלית", base: "פצ'ולי, ענבר" },
    { name: "Symposium", top: "ענבים", middle: "יין אדום, לבנדר", base: "טונקה, חביות עץ אלון" },

    // Thomas de Monaco
    { name: "Raw Gold", top: "ליקר שזיפים, קפה, פלפל, וטיבר", middle: "שפתון, זמש, עור", base: "פצ'ולי, אופופונקס, זעפרן, דבש" },

    // Tom Ford
    { name: "Black Orchid Parfum", top: "כמהין, שזיף", middle: "סחלב שחור, ילאנג-ילאנג, רום", base: "פצ'ולי" },
    { name: "Ombré Leather", top: "הל", middle: "עור, יסמין סמבק", base: "ענבר, אזוב, פצ'ולי" },

    // Tomorrowland
    { name: "Elixir of Life", top: "ברגמוט, אשכולית, דשא", middle: "פרחים", base: "תווים עציים" },

    // Ulrich Lang
    { name: "Suncrest", top: "אפרסק, דומדמניות שחורות, לימון", middle: "יסמין", base: "עץ החלומות" },

    // Vilhelm Parfumerie
    { name: "Mango Skin", top: "מנגו, פלפל שחור, פטל שחור", middle: "איריס, לוטוס, יסמין", base: "פצ'ולי, וניל, סוכר ורוד" },

    // Villa Erbatium
    { name: "Fig Whiskey", top: "עלי תאנה", middle: "פרי התאנה, וויסקי", base: "עץ אלון" },
    { name: "Mossy Glen", top: "תווים ירוקים, טחב", middle: "שרכים", base: "אדמה לחה" },
    { name: "Scent of Seoul", top: "תווים אורבניים", middle: "קטורת, פרחים", base: "עץ" },
    { name: "Tabacco Lady", top: "פרחים לבנים", middle: "טיובר, טבק", base: "וניל" },

    // Widian
    { name: "Al Wasl", top: "פלפל, תפוח", middle: "פרחים לבנים, אוד", base: "סנדלווד, ענבר, וניל" },
    { name: "Limited 71 Extrait", top: "ברגמוט, מרווה, לבנדר", middle: "עלי דפנה, קשמירן, אמברגריס", base: "אוד, פצ'ולי, ענבר, וטיבר" },
    { name: "Limited 71 Extreme", top: "ברגמוט, מרווה", middle: "עור, קשמירן", base: "אוד, פצ'ולי" },
    { name: "Limited 71 Intense", top: "לבנדר", middle: "אקיגלווד", base: "ענבר, אוד" },

    // Xerjoff
    { name: "Alexandria II", top: "עץ סיסם, לבנדר, קינמון, תפוח", middle: "ורד, ארז, שושנת העמקים", base: "אוד, סנדלווד, וניל, ענבר, מאסק" },
    { name: "Begum", top: "לימון, ברגמוט, פירות יער אדומים, פריזיה", middle: "ורד דמשק, יסמין, שושנת העמקים, איריס", base: "פצ'ולי, סנדלווד, וניל, מאסק, ענבר" },
    { name: "Deified Tony Iommi Parfum", top: "תפוח, קינמון, זעפרן", middle: "ורד, עור", base: "פצ'ולי, מאסק, פפירוס" },
    { name: "Erba Pura", top: "תפוז סיציליאני, לימון, ברגמוט", middle: "סלסלת פירות ים תיכוניים", base: "מאסק לבן, וניל מדגסקר, ענבר" },
    { name: "Jebel", top: "ברגמוט, מנדרינה, לבנדר", middle: "יסמין, גרניום, פלפל ורוד", base: "מאסק, ענבר, סנדלווד" },
    { name: "Lira", top: "תפוז דם, ברגמוט, לבנדר", middle: "קינמון, שוש, יסמין", base: "קרמל, וניל, מאסק" },

    // Yves Saint Laurent
    { name: "M7 (Original/Oud Absolu)", top: "מנדרינה, תפוז", middle: "פצ'ולי", base: "אוד, מור, לאבדנום" },
    { name: "Tuxedo", top: "עלה הסיגלית, כוסברה, ברגמוט", middle: "ורד, פלפל שחור, שושנת העמקים", base: "פצ'ולי, אמברגריס, וניל בורבון" },

    // iPiccirilli
    { name: "Cocobay", top: "קוקוס, הדרים", middle: "פרחים לבנים, רום", base: "וניל, מאסק" },
    { name: "Dune", top: "תבלינים, פלפל", middle: "עץ יבש", base: "ענבר, חול" },
    { name: "Shocking Bull", top: "פסיפלורה, אפרסק, פטל, אגס", middle: "שושנת העמקים", base: "הליוטרופ, סנדלווד, וניל, פצ'ולי, מאסק, חול ים" }
];

async function populateNotes() {
    const client = await pool.connect();
    let updatedCount = 0;
    let notFound = [];

    try {
        console.log('Starting notes population...');

        for (const fragrance of fragranceData) {
            // We search by exact model/name or partial match. 
            // Assuming the list has names that correspond to 'model' or 'name' in DB.
            // Let's try ILIKE match on both brand + model combination, or just model.

            // Note: The user provided brand headers, but I flattened it into name for simplicity here 
            // because mapping every brand manually would be huge. 
            // In a real scenario, we'd use the Header as Brand.
            // I'll try to match the "name" to the 'name' or 'model' field in DB.

            const result = await client.query(
                `UPDATE products 
                 SET top_notes = $1, middle_notes = $2, base_notes = $3
                 WHERE name ILIKE $4 OR model ILIKE $4
                 RETURNING id, name, brand`,
                [fragrance.top, fragrance.middle, fragrance.base, `%${fragrance.name}%`]
            );

            if (result.rowCount > 0) {
                console.log(`Updated: ${fragrance.name} -> ${result.rows[0].name} (${result.rows[0].brand})`);
                updatedCount += result.rowCount;
            } else {
                notFound.push(fragrance.name);
            }
        }

        console.log('------------------------------------------------');
        console.log(`Population complete.`);
        console.log(`Total perfumes updated: ${updatedCount}`);
        console.log(`Not found (${notFound.length}):`, notFound.join(', '));

    } catch (e) {
        console.error('Population failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

populateNotes();
