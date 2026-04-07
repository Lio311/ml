"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Hebrew → English lookup for common fragrance notes
// Covers the most common notes that appear in the DB in Hebrew
const HE_TO_EN_NOTES = {
    // Florals
    'ורד': 'Rose', 'ורד דמשק': 'Damascus Rose', 'רוז דה מאי': 'Rose de Mai',
    'סיגליות': 'Violet', 'סיגלית': 'Violet', 'עלי סיגלית': 'Violet Leaves', 'יסמין': 'Jasmine', 'לבנדר': 'Lavender',
    'טובארוז': 'Tuberose', 'אורכידיה': 'Orchid', 'פרחי תפוח': 'Apple Blossom',
    'אירוס': 'Iris', 'שורש אירים': 'Iris Root', 'ג\'ורג\'יה': 'Gardenia',
    'ברוסליה': 'Freesia', 'מגנוליה': 'Magnolia', 'סחלב': 'Orchid',
    'פרחי תפוז': 'Orange Blossom', 'נרגיס': 'Narcissus', 'ילנג ילנג': 'Ylang Ylang',
    'ג\'אסמין': 'Jasmine', 'כלניות': 'Carnation', 'פרזיה': 'Freesia',
    // Citrus
    'ליים': 'Lime', 'לימון': 'Lemon', 'תפוז': 'Orange', 'אשכולית': 'Grapefruit',
    'ברגמוט': 'Bergamot', 'מנדרינה': 'Mandarin', 'לימון מאייר': 'Meyer Lemon',
    'ציטרוס': 'Citrus', 'סיטרקס': 'Citrus', 'תפוז דם': 'Blood Orange',
    // Woods & Resins
    'עץ ארז': 'Cedarwood', 'ארז': 'Cedar', 'ארז אטלס': 'Atlas Cedar', 'לבנה': 'Labdanum', 'לבונה': 'Frankincense',
    'קונה': 'Guaiac Wood', 'עץ סנדל': 'Sandalwood', 'סנדלווד': 'Sandalwood',
    'עץ קשמיר': 'Cashmeran', 'עץ ורד': 'Rosewood', 'אגר עוד': 'Oud',
    'עוד': 'Oud', 'אמברגריס': 'Ambergris', 'פאטשולי': 'Patchouli',
    'ענבר': 'Amber', 'בנזואין': 'Benzoin', 'בנסואין': 'Benzoin',
    'ראדיקס': 'Radix', 'וטיבר': 'Vetiver', 'וטיוור': 'Vetiver',
    // Spices
    'פלפל': 'Pepper', 'פלפל שחור': 'Black Pepper', 'קינמון': 'Cinnamon',
    'קרדמום': 'Cardamom', 'זעפרן': 'Saffron', 'גינגר': 'Ginger',
    'לעשוש': 'Nutmeg', 'אגוז מוסקט': 'Nutmeg', 'ציפורן': 'Clove',
    // Musks & Gourmands
    'מוסק': 'Musk', 'מאסק': 'Musk', 'ונילה': 'Vanilla', 'וניל': 'Vanilla', 'קרמל': 'Caramel', 'שולק': 'Caramel',
    'קפה': 'Coffee', 'שוקולד': 'Chocolate', 'טולו': 'Tolu Balsam',
    'בנסם פרו': 'Peru Balsam', 'גומי': 'Gummy',
    // Fruits
    'תפוח': 'Apple', 'אגס': 'Pear', 'אפרסק': 'Peach', 'ליצ\'י': 'Lychee',
    'פרחי דובדבן': 'Cherry Blossom', 'פטל': 'Raspberry', 'תות': 'Strawberry', 'תות שדה': 'Strawberry',
    'מנגו': 'Mango', 'פפאיה': 'Papaya', 'גויאבה': 'Guava',
    'אננס': 'Pineapple', 'בלק קארנט': 'Blackcurrant', 'דומדמנית שחורה': 'Blackcurrant',
    // Animals & Aquatics
    'אמבר': 'Amber', 'בְּיוֹר': "Birch", 'ביר\'': 'Birch',
    'לביח': 'Labdanum', 'ציוות': 'Civet',
    // Seasons (Added for consistency)
    'אביב': 'Spring', 'קיץ': 'Summer', 'סתיו': 'Autumn', 'חורף': 'Winter',
    // Other
    'פרנגיפני': 'Frangipani', 'תה': 'Tea', 'תה ירוק': 'Green Tea',
    'מאסם': 'Mace', 'אנג\'ל': 'Angelica', 'אנס': 'Anise',
    'סיפרס': 'Cypress', 'ברוש': 'Cypress', 'אורז': 'Rice', 'קוקוס': 'Coconut',
    'קנה': 'Gaiac Wood', 'פְּטִיגְר\'ן': 'Petitgrain',
    'אורן': 'Pine', 'אלדרווד': 'Eldarwood',
    'גחלת': 'Charcoal', 'כחול': 'Blue', 'ים': 'Sea Salt',
};

function translateNote(note, locale) {
    if (locale !== 'en') return note;
    const trimmed = note.trim();
    // Direct match (case insensitive)
    const key = Object.keys(HE_TO_EN_NOTES).find(
        k => k === trimmed || k.toLowerCase() === trimmed.toLowerCase()
    );
    return key ? HE_TO_EN_NOTES[key] : trimmed;
}

export default function FragrancePyramid({ top, middle, base }) {
    const [isOpen, setIsOpen] = useState(false);
    const { t, dir, locale } = useLanguage();

    if (!top && !middle && !base) return null;

    const parseNotes = (notesStr) => {
        if (!notesStr) return [];
        return notesStr.split(',').map(n => translateNote(n.trim(), locale)).filter(Boolean);
    };

    const topNotes = parseNotes(top);
    const middleNotes = parseNotes(middle);
    const baseNotes = parseNotes(base);

    return (
        <div className="w-full mt-6 border-t pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between group py-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                dir={dir}
            >
                <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    {t('common.perfume_pyramid')}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="py-4 flex flex-col items-center gap-4 relative">

                    {/* Background Triangle Shape */}
                    <div className="absolute inset-0 z-0 flex justify-center opacity-5 pointer-events-none">
                        <div className="w-0 h-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-b-[200px] border-b-black"></div>
                    </div>

                    {/* Top Notes */}
                    {topNotes.length > 0 && (
                        <div className="z-10 flex flex-col items-center animate-fadeIn">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('common.top_notes')}</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {topNotes.map((note, idx) => (
                                    <span key={idx} className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Middle Notes */}
                    {middleNotes.length > 0 && (
                        <div className="z-10 flex flex-col items-center mt-2 animate-fadeIn delay-100">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('common.heart_notes')}</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {middleNotes.map((note, idx) => (
                                    <span key={idx} className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Base Notes */}
                    {baseNotes.length > 0 && (
                        <div className="z-10 flex flex-col items-center mt-2 animate-fadeIn delay-200">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('common.base_notes')}</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {baseNotes.map((note, idx) => (
                                    <span key={idx} className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
