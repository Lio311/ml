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
                className={`transition-all duration-300 cursor-pointer overflow-hidden rounded-sm hover:scale-110 hover:shadow-md ${locale === 'en' ? 'opacity-100 ring-1 ring-offset-2 ring-black scale-110' : 'opacity-50 grayscale-[50%]'}`}
                aria-label="English"
                title="English"
            >
                <img src="https://flagcdn.com/w40/us.png" width="22" alt="US Flag" className="block" />
            </button>
            <button
                onClick={() => handleSwitch('he')}
                className={`transition-all duration-300 cursor-pointer overflow-hidden rounded-sm hover:scale-110 hover:shadow-md ${locale === 'he' ? 'opacity-100 ring-1 ring-offset-2 ring-black scale-110' : 'opacity-50 grayscale-[50%]'}`}
                aria-label="עברית"
                title="עברית"
            >
                <img src="https://flagcdn.com/w40/il.png" width="22" alt="Israel Flag" className="block" />
            </button>
        </div>
    );
}
