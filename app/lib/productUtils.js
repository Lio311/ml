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
            } else if (typeof value === 'bigint') {
                sanitized[key] = Number(value);
            } else if (value !== null && typeof value === 'object') {
                sanitized[key] = sanitizeProduct(value);
            } else {
                // Next.js 15 serialization can be picky about nulls in certain contexts
                // but generally supports them. To be 100% safe, we keep them as is 
                // unless we know they cause issues.
                sanitized[key] = value ?? '';
            }
        }

    return sanitized;
}

export function sanitizeProductArray(products) {
    if (!Array.isArray(products)) return [];
    return products.map(p => sanitizeProduct(p)).filter(Boolean);
}
