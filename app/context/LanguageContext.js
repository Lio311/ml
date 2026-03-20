"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

const LanguageContext = createContext();

const dictionaries = { he, en };

export function LanguageProvider({ children, initialLocale = 'he' }) {
    const [locale, setLocale] = useState(initialLocale);
    
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('locale', locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
    }, [locale, dir]);

    const toggleLanguage = () => {
        setLocale(prev => prev === 'he' ? 'en' : 'he');
    };

    const t = (keyPath) => {
        const keys = keyPath.split('.');
        let result = dictionaries[locale];
        for (const key of keys) {
            if (result[key] === undefined) return keyPath;
            result = result[key];
        }
        return result;
    };

    const localize = (obj, field) => {
        if (!obj) return '';
        if (locale === 'en') {
            return obj[`${field}_en`] || obj[`${field}_EN`] || obj[field] || '';
        }
        // For Hebrew, prioritize _he if it exists, then fallback to base field
        return obj[`${field}_he`] || obj[`${field}_HE`] || obj[field] || '';
    };

    return (
        <LanguageContext.Provider value={{ locale, dir, toggleLanguage, t, localize }}>
            <div dir={dir} className={locale === 'en' ? 'font-sans' : ''}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
