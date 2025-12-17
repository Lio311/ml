// Mapping of Hebrew search terms to English Brand/Product names
export const HEBREW_MAPPING = {
    // Brands
    'שאנל': 'Chanel',
    'דיור': 'Dior',
    'קריד': 'Creed',
    'טום פורד': 'Tom Ford',
    'אמוואג': 'Amouage',
    'אמוואז': 'Amouage',
    'אמואג': 'Amouage',
    'פרפום דה מארלי': 'Parfums de Marly',
    'מארלי': 'Marly',
    'מרלי': 'Marly',
    'רוזה': 'Roja',
    'רוז׳ה': 'Roja',
    'רוג׳ה': 'Roja',
    'זייר': 'Xerjoff',
    'קסרג׳וף': 'Xerjoff',
    'קסרגוף': 'Xerjoff',
    'זרגוף': 'Xerjoff',
    'זרג׳וף': 'Xerjoff',
    'נרסיסו': 'Narciso',
    'נרסיסו רודריגז': 'Narciso Rodriguez',
    'גוצי': 'Gucci',
    'גוצ׳י': 'Gucci',
    'איב סאן לורן': 'Yves Saint Laurent',
    'ysl': 'Yves Saint Laurent',
    'הרמס': 'Hermes',
    'ארמני': 'Armani',
    'ורסאצ׳ה': 'Versace',
    'ורסאצה': 'Versace',
    'מונט דייל': 'Montale',
    'מונטל': 'Montale',
    'מייזון': 'Maison',
    'פרנסיס': 'Francis',
    'קורקדג׳יאן': 'Kurkdjian',
    'קורקדיאן': 'Kurkdjian',
    'בקרט': 'Baccarat',
    'רוז': 'Rouge',
    'אוונטוס': 'Aventus',
    'סאווג': 'Sauvage',
    'סוואג': 'Sauvage',
    'בלו': 'Bleu',
    'שאנל בלו': 'Bleu de Chanel',
    'אלי': 'Elysium',
    'אליסיום': 'Elysium',
    'הרוד': 'Herod',
    'לייטון': 'Layton',
    'דלינה': 'Delina',
    'פגסוס': 'Pegasus',
    'קיליין': 'Kilian',
    'קיליאן': 'Kilian',
    'אינישיו': 'Initio',
    'נישנה': 'Nishane',
    'נישאנה': 'Nishane',
    'ממו': 'Memo',
    'בי י די קיי': 'BDK',
    'בי די קיי': 'BDK',
    'בידיקיי': 'BDK',
    'גולדפילד': 'Goldfield',
    'בנקס': 'Banks',

    // General Terms
    'בושם': 'Perfume',
    'דוגמית': 'Sample',
    'יוניסקס': 'Unisex',
    'גבר': 'Men',
    'אישה': 'Women',
    'נשים': 'Women',
    'גברים': 'Men'
};

/**
 * Maps a potentially Hebrew query to an English search term.
 * Looks for exact matches or partial matches in the mapping.
 * @param {string} query 
 * @returns {string} The original query or the mapped English term.
 */
export function mapHebrewQuery(query) {
    if (!query) return query;
    const lowerQuery = query.toLowerCase().trim();

    // 1. Direct Match
    if (HEBREW_MAPPING[lowerQuery]) {
        return HEBREW_MAPPING[lowerQuery];
    }

    // 2. Partial Scan (Simple) - if query contains a key
    // This allows "שאנל בלו" to map to "Chanel" or similar if we wanted complex logic.
    // For now, let's stick to direct word replacement?
    // Let's iterate keys and see if any key is IN the query
    for (const [hebrew, english] of Object.entries(HEBREW_MAPPING)) {
        if (lowerQuery.includes(hebrew)) {
            // Replace the Hebrew part with English
            // e.g. "בושם שאנל" -> "בושם Chanel" -> search likely handles mixed? 
            // Better to return just the English term if it's the main intent?
            // Or return the mapped term.
            // Let's replace:
            return lowerQuery.replace(hebrew, english);
        }
    }

    return query;
}
