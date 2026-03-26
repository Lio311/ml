"use client";

import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSwitcher({ variant = "header", light = false }) {
    const { locale, toggleLanguage } = useLanguage();

    const handleSwitch = (targetLang) => {
        if (targetLang !== locale) {
            toggleLanguage();
        }
    };

    const textColor = light ? 'text-white' : 'text-black';
    const inactiveColor = light ? 'text-white/40 hover:text-white/70' : 'text-black/30 hover:text-black/60';
    const borderColor = light ? 'border-white' : 'border-black';
    const dividerColor = light ? 'bg-white/20' : 'bg-black/10';

    return (
        <div className="flex items-center gap-3 font-serif text-[11px] tracking-[0.15em] uppercase" dir="ltr">
            <button
                onClick={() => handleSwitch('en')}
                className={`transition-all duration-500 cursor-pointer ${locale === 'en' ? `${textColor} font-black border-b-[1.5px] ${borderColor} pb-0.5` : `${inactiveColor}`}`}
            >
                English
            </button>
            <div className={`w-[1px] h-3 ${dividerColor}`}></div>
            <button
                onClick={() => handleSwitch('he')}
                className={`transition-all duration-500 cursor-pointer ${locale === 'he' ? `${textColor} font-black border-b-[1.5px] ${borderColor} pb-0.5` : `${inactiveColor}`}`}
            >
                עברית
            </button>
        </div>
    );
}
