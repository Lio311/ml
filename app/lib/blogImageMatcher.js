/**
 * Intelligent Blog Image Matcher
 * Maps perfume blog post topics, content and tags to ultra-premium, high-resolution local assets
 * or beautifully matching curated Unsplash photography to ensure a flawless editorial aesthetic.
 */
export function getPremiumBlogImage(title = '', content = '', tags = []) {
    const titleText = (title || '').toLowerCase();
    const contentText = (content || '').toLowerCase();
    const tagsText = (tags || []).join(' ').toLowerCase();
    const text = `${titleText} ${contentText} ${tagsText}`;

    // 1. Specific Brands / Perfume Spotlights
    if (text.includes('אבנטוס') || text.includes('קריד') || text.includes('creed') || text.includes('aventus')) {
        return '/images/blog_assets/blog_creed_aventus.png';
    }
    if (text.includes('בקארה') || text.includes('רוז\'') || text.includes('רוז') || text.includes('baccarat') || text.includes('540') || text.includes('קורקדיג') || text.includes('mfk')) {
        return '/images/blog_assets/blog_mfk_baccarat.png';
    }
    if (text.includes('מונטל') || text.includes('מונטאל') || text.includes('מנסרה') || text.includes('montale') || text.includes('mancera')) {
        return '/images/blog_assets/blog_montale_mancera.png';
    }
    if (text.includes('רוז\'ה') || text.includes('רוזה') || text.includes('roja') || text.includes('dove')) {
        return '/images/blog_assets/blog_roja_dove.png';
    }
    if (text.includes('קסרג') || text.includes('קסרז') || text.includes('xerjoff') || text.includes('אלכסנדריה') || text.includes('נאקסוס')) {
        return '/images/blog_assets/blog_xerjoff_luxury.png';
    }

    // 2. Specific Education Topics / Guides
    if (text.includes('ריכוז') || text.includes('ריכוזים') || text.includes('edp') || text.includes('edt') || text.includes('קולון') || text.includes('פרפיום') || text.includes('concentration')) {
        return '/images/blog_assets/blog_edp_vs_edt.png';
    }
    if (text.includes('דקאנט') || text.includes('דקנט') || text.includes('דוגמיות') || text.includes('דוגמית') || text.includes('מילוי') || text.includes('decant') || text.includes('sample') || text.includes('בקבוקונים')) {
        return '/images/blog_assets/blog_decants_main.png';
    }
    if (text.includes('אחסון') || text.includes('לשמור') || text.includes('שמירה') || text.includes('storage') || text.includes('פקק')) {
        return '/images/blog_assets/blog_perfume_storage.png';
    }
    if (text.includes('קיץ') || text.includes('חם') || text.includes('שמש') || text.includes('summer')) {
        return '/images/blog_assets/blog_summer_israel.png';
    }
    if (text.includes('טרנד') || text.includes('טרנדים') || text.includes('trends') || text.includes('2025') || text.includes('2026')) {
        return '/images/blog_assets/blog_trends_2025.png';
    }
    if (text.includes('יוניסקס') || text.includes('unisex') || text.includes('לשניהם') || text.includes('גברים ונשים')) {
        return '/images/blog_assets/blog_unisex_scents.png';
    }
    if (text.includes('נישה') || text.includes('מעצבים') || text.includes('designer') || text.includes('niche')) {
        return '/images/blog_assets/blog_niche_vs_designer.png';
    }
    if (text.includes('דייט') || text.includes('רומנטי') || text.includes('ערב') || text.includes('date night') || text.includes('night') || text.includes('חושני')) {
        return '/images/blog_assets/blog_date_night.png';
    }
    if (text.includes('חתימה') || text.includes('בושם חתימה') || text.includes('signature')) {
        return '/images/blog_assets/blog_signature_scent.png';
    }

    // 3. Fragrance Families / Specific Ingredient Notes
    if (text.includes('וניל') || text.includes('vanilla') || text.includes('מתוק') || text.includes('גורמנד') || text.includes('gourmand')) {
        return '/images/blog_assets/vanilla-macro.png';
    }
    if (text.includes('טבק') || text.includes('tobacco') || text.includes('מעשן') || text.includes('סיגר') || text.includes('עשן')) {
        return '/images/blog_assets/lifestyle-tray.png';
    }
    if (text.includes('זעפרן') || text.includes('saffron')) {
        return '/images/blog_assets/saffron.png';
    }
    if (text.includes('תבלין') || text.includes('תבלינים') || text.includes('spicy') || text.includes('מתובל')) {
        return '/images/blog_assets/ingredients.png';
    }
    if (text.includes('איריס') || text.includes('iris') || text.includes('פודרה') || text.includes('מאסק') || text.includes('musk') || text.includes('מוסק') || text.includes('פרחוני') || text.includes('פרח')) {
        return '/images/blog_assets/woman-smelling.png';
    }
    if (text.includes('הדרים') || text.includes('citrus') || text.includes('לימון') || text.includes('תפוז') || text.includes('ברגמוט') || text.includes('רענן')) {
        return '/images/blog_assets/lifestyle-tray.png';
    }
    if (text.includes('רכיבים') || text.includes('מרכיבים') || text.includes('ingredients') || text.includes('טבעי') || text.includes('קיימות') || text.includes('אקולוגי')) {
        return '/images/blog_assets/ingredients.png';
    }
    if (text.includes('מעבדה') || text.includes('רוקח') || text.includes('רקחה') || text.includes('perfumer') || text.includes('lab')) {
        return '/images/blog_assets/perfumer-lab.png';
    }

    // 4. Default Curated Premium Local Library
    const fallbackLibrary = [
        '/images/blog_assets/luxury-bottle.png',
        '/images/blog_assets/lifestyle-tray.png',
        '/images/blog_assets/store-shelf.png',
        '/images/blog_assets/woman-smelling.png',
        '/images/blog_assets/abstract-waves.png',
        '/images/blog_assets/perfumer-lab.png',
        '/images/blog_assets/ingredients.png',
        '/images/blog_assets/vanilla-macro.png'
    ];

    // Use a hash of the title to consistently choose the same fallback image for a given post
    let hash = 0;
    for (let i = 0; i < titleText.length; i++) {
        hash = titleText.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % fallbackLibrary.length;
    return fallbackLibrary[index];
}
