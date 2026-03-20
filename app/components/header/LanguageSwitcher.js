"use client";

import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSwitcher({ variant = "header" }) {
    const { locale, toggleLanguage } = useLanguage();

    const handleSwitch = (targetLang) => {
        if (targetLang !== locale) {
            toggleLanguage();
        }
    };

    const activeClass = "bg-black text-white px-3 py-1 text-[10px] font-bold border border-black";
    const inactiveClass = "bg-white text-black px-3 py-1 text-[10px] font-bold border border-black hover:bg-gray-50 transition-colors";

    return (
        <div className={`flex items-center gap-0 ${variant === 'mobile' ? 'flex-row' : ''}`}>
            <button
                onClick={() => handleSwitch('he')}
                className={`${locale === 'he' ? activeClass : inactiveClass} rounded-s-sm`}
            >
                עברית
            </button>
            <button
                onClick={() => handleSwitch('en')}
                className={`${locale === 'en' ? activeClass : inactiveClass} rounded-e-sm`}
            >
                English
            </button>
        </div>
    );
}
