"use client";

import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSwitcher({ variant = "header", light = false }) {
    const { locale, toggleLanguage } = useLanguage();

    const handleSwitch = (targetLang) => {
        if (targetLang !== locale) {
            toggleLanguage();
        }
    };

    return (
        <div className="flex items-center gap-2" dir="ltr">
            <button
                onClick={() => handleSwitch('en')}
                className={`transition-all duration-300 cursor-pointer overflow-hidden rounded-sm hover:scale-110 hover:shadow-md ${locale === 'en' ? 'opacity-100 scale-110' : 'opacity-50 grayscale-[50%]'}`}
                aria-label="English"
                title="English"
            >
                <span className="text-xl block">🇺🇸</span>
            </button>
            <button
                onClick={() => handleSwitch('he')}
                className={`transition-all duration-300 cursor-pointer overflow-hidden rounded-sm hover:scale-110 hover:shadow-md ${locale === 'he' ? 'opacity-100 scale-110' : 'opacity-50 grayscale-[50%]'}`}
                aria-label="עברית"
                title="עברית"
            >
                <span className="text-xl block">🇮🇱</span>
            </button>
        </div>
    );
}
