"use client";

import { Instagram } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useBrand } from '../context/BrandContext';

export default function AuthorBox() {
    const { dir } = useLanguage();
    const { dot, hyphen, short } = useBrand();
    const isRTL = dir === 'rtl';

    return (
        <div className="mt-16 p-8 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col md:flex-row items-center gap-8 shadow-sm" dir={dir}>
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-black flex items-center justify-center text-white text-3xl font-serif font-black tracking-tighter">
                {dot.toLowerCase()}
            </div>
            <div className={`flex-1 text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                <div className={`flex flex-col md:flex-row md:items-baseline gap-3 mb-2 justify-center ${isRTL ? 'md:justify-start' : 'md:justify-start'}`}>
                    <h3 className="text-xl font-serif font-bold text-gray-900">Lio</h3>
                    <span className="text-xs lowercase tracking-widest text-gray-400 font-bold">{isRTL ? `מייסד ${hyphen.toLowerCase()}` : `Founder of ${hyphen.toLowerCase()}`}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-xl">
                    {isRTL 
                        ? `חובב בשמי נישה מאז 2019. עם למעלה מ-300 ניחוחות שנבדקו אישית, Lio הקים את ${hyphen.toLowerCase()} כדי להנגיש את עולם הבישום היוקרתי לקהל הישראלי באמצעות דוגמיות ודיקאנטים מקוריים.`
                        : `Niche perfume enthusiast since 2019. With over 300 personally tested scents, Lio founded ${hyphen.toLowerCase()} to make the world of luxury perfumery accessible to the Israeli audience through authentic samples and decants.`
                    }
                </p>
                <div className={`flex items-center justify-center ${isRTL ? 'md:justify-start' : 'md:justify-start'} gap-4`}>
                    <a 
                        href="https://instagram.com/ml_tlv" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors"
                    >
                        <Instagram size={14} />
                        <span>{isRTL ? 'עקבו אחרי באינסטגרם' : 'Follow me on Instagram'}</span>
                    </a>
                </div>
            </div>
            
            {/* Person Schema for E-E-A-T */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": "Lio",
                        "jobTitle": "Founder & Fragrance Expert",
                        "description": `Founder of ${hyphen}, perfume enthusiast and expert in niche and luxury fragrances.`,
                        "sameAs": ["https://instagram.com/ml_tlv"],
                        "worksFor": {
                            "@type": "Organization",
                            "name": hyphen,
                            "url": "https://www.ml-tlv.com"
                        }
                    })
                }}
            />
        </div>
    );
}
