"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState('he');

    useEffect(() => {
        // Initialize Google Translate
        const googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement({
                pageLanguage: 'he',
                includedLanguages: 'he,en,ru',
                autoDisplay: false,
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
            }, 'google_translate_element');
        };

        window.googleTranslateElementInit = googleTranslateElementInit;

        if (!document.querySelector("#google-translate-script")) {
            const script = document.createElement("script");
            script.id = "google-translate-script";
            script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const changeLanguage = (langCode) => {
        setCurrentLang(langCode);
        setIsOpen(false);

        // 1. Set the Google Translate cookie
        // Format: /sourceLang/targetLang. We use 'auto' as source.
        const cookieValue = `/auto/${langCode}`;

        document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=${cookieValue}; path=/`;

        // 2. Reload the page to apply the translation
        window.location.reload();
    };

    const flags = {
        he: "🇮🇱",
        en: "🇺🇸",
        ru: "🇷🇺"
    };

    const labels = {
        he: "עברית",
        en: "English",
        ru: "Русский"
    };

    return (
        <div className="relative z-50">
            {/* Hidden Google Element */}
            <div id="google_translate_element" className="hidden"></div>

            {/* Custom Dropdown */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition"
            >
                <span className="text-xl">{flags[currentLang] || flags.he}</span>
                <span className="text-sm hidden md:block">{labels[currentLang] || labels.he}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border rounded-lg shadow-xl overflow-hidden">
                    <button onClick={() => changeLanguage('he')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right">
                        <span className="text-xl">🇮🇱</span>
                        <span className="text-sm">עברית</span>
                    </button>
                    <button onClick={() => changeLanguage('en')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right">
                        <span className="text-xl">🇺🇸</span>
                        <span className="text-sm">English</span>
                    </button>
                    <button onClick={() => changeLanguage('ru')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right">
                        <span className="text-xl">🇷🇺</span>
                        <span className="text-sm">Русский</span>
                    </button>
                </div>
            )}
        </div>
    );
}
