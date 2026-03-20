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
