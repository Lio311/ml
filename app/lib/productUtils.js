export const BRAND_MAP = {
    'Roja': ['רוג\'ה', 'רוגה', 'Roja'],
    'Elixir Privé': ['אליקסיר פריבה', 'Elixir Privé', 'Elixir Prive'],
    'Frederic Malle': ['פרדריק מאל', 'Frederic Malle'],
    'Xerjoff': ['קסרז\'וף', 'Xerjoff'],
    'Creed': ['קריד', 'Creed'],
    'Kilian': ['קיליאן', 'Kilian'],
    'Sospiro': ['סוספירו', 'Sospiro'],
    'Amouage': ['אמואז\'', 'Amouage'],
    'Initio': ['אינישיו', 'Initio'],
    'Mancera': ['מנסרה', 'Mancera'],
    'Montale': ['מונטל', 'Montale'],
    'Byredo': ['ביירדו', 'Byredo'],
    'Diptyque': ['דיפטיק', 'Diptyque'],
    'Memo Paris': ['ממו פאריס', 'ממו', 'Memo Paris', 'Memo'],
};

export function cleanProductName(name, brand) {
    if (!brand || !name) return name || '';
    
    let cleaned = name;
    const searchBrands = BRAND_MAP[brand] || [brand];
    
    for (const b of searchBrands) {
        const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
        const regex = new RegExp(`^${escaped}\\s*`, 'i');
        if (regex.test(cleaned)) {
            cleaned = cleaned.replace(regex, '');
            break;
        }
    }
    
    return cleaned.trim() || name;
}

/**
 * Sanitizes an object from the database for serialization.
 * Recursively converts Dates to strings and ensures numbers are numbers.
 * React 19 / Next 15 serialization requirement.
 */
export function sanitizeProduct(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Create a new object to avoid mutating the original
    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Date) {
            sanitized[key] = value.toISOString();
        } else if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
            sanitized[key] = sanitizeProduct(value);
        } else if (typeof value === 'bigint') {
            sanitized[key] = Number(value);
        } else if (['price_2ml', 'price_5ml', 'price_10ml', 'stock', 'average_rating', 'review_count', 'count'].includes(key)) {
            sanitized[key] = value === null ? 0 : Number(value) || 0;
        } else if (value === null) {
            sanitized[key] = '';
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

export function sanitizeProductArray(products) {
    if (!Array.isArray(products)) return [];
    return products.map(p => sanitizeProduct(p)).filter(Boolean);
}
