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
        <div className="flex items-center gap-3 font-serif text-[11px] tracking-[0.15em] uppercase" dir="ltr">
            <button
                onClick={() => handleSwitch('en')}
                className={`transition-all duration-500 cursor-pointer ${locale === 'en' ? 'text-black font-black border-b-[1.5px] border-black pb-0.5' : 'text-black/30 hover:text-black/60'}`}
            >
                English
            </button>
            <div className="w-[1px] h-3 bg-black/10"></div>
            <button
                onClick={() => handleSwitch('he')}
                className={`transition-all duration-500 cursor-pointer ${locale === 'he' ? 'text-black font-black border-b-[1.5px] border-black pb-0.5' : 'text-black/30 hover:text-black/60'}`}
            >
                עברית
            </button>
        </div>
    );
}
