"use client";

import { useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";

export default function LanguageSwitcher({ variant = "header" }) {
    const { locale, toggleLanguage } = useLanguage();

    if (variant === "mobile") {
        return (
            <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-gray-50 text-sm font-bold transition-all active:scale-95"
            >
                <span className={locale === 'he' ? 'text-black' : 'text-gray-400'}>עברית</span>
                <div className="w-8 h-4 bg-gray-200 rounded-full relative p-0.5">
                    <motion.div
                        animate={{ x: locale === 'en' ? 16 : 0 }}
                        className="w-3 h-3 bg-black rounded-full"
                    />
                </div>
                <span className={locale === 'en' ? 'text-black' : 'text-gray-400'}>EN</span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleLanguage}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 hover:border-black/20 hover:bg-gray-50 transition-all duration-300 active:scale-95"
            title={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
        >
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter">
                <span className={`transition-colors ${locale === 'he' ? 'text-black' : 'text-gray-300'}`}>HEB</span>
                <div className="w-6 h-3 bg-gray-100 rounded-full relative p-0.5 border border-gray-200">
                    <motion.div
                        animate={{ x: locale === 'en' ? 12 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-1.5 h-1.5 bg-black rounded-full"
                    />
                </div>
                <span className={`transition-colors ${locale === 'en' ? 'text-black' : 'text-gray-300'}`}>ENG</span>
            </div>
        </button>
    );
}
