"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// --- Icons (Inline SVGs for performance & no deps) ---
const Icons = {
    Text: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>,
    Font: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M19 10c0-3.9-3.1-7-7-7S5 6.1 5 10c0 1.2.3 2.3.9 3.2L12 22l6.1-8.8c.6-.9.9-2 .9-3.2Z" /><circle cx="12" cy="10" r="3" /></svg>,
    Link: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    Header: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M6 4v16" /><path d="M18 4v16" /><path d="M6 12h12" /></svg>,
    Contrast: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M12 18a6 6 0 0 0 0-12v12z" /></svg>,
    Invert: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 20v2" /><path d="M12 2v2" /><path d="M20 12h2" /><path d="M2 12h2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="m4.93 19.07 1.41-1.41" /><path d="m17.66 6.34 1.41-1.41" /></svg>,
    Eye: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
    Cursor: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>,
    Stop: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M9 9h6v6H9z" /></svg>,
    Close: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
    Guide: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M5 12h14" /><path d="M5 18h14" /><path d="M5 6h14" /></svg>,
};


const STORAGE_KEY = 'accessibility_settings_v1';

const DEFAULT_SETTINGS = {
    fontSize: 100, // percentage
    readableFont: false,
    highlightLinks: false,
    highlightHeaders: false,
    highContrast: false,
    invertColors: false,
    monochrome: false,
    bigCursor: false,
    stopAnimations: false,
    readingGuide: false,
};

export default function AccessibilityWidget() {
    const { locale } = useLanguage();
    const isHebrew = locale === 'he';
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [readingGuideY, setReadingGuideY] = useState(0);

    // --- Initialization & Persistence ---
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        applySettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    // --- DOM Manipulation Side Effects ---
    const applySettings = () => {
        // 1. Text Scale (Apply to root, widget is protected by fixed size)
        document.documentElement.style.fontSize = `${settings.fontSize}%`;

        // 2. Target Container for Content Filters
        const contentContainer = document.getElementById('site-content');
        if (!contentContainer) return;

        // Helper to toggle class on the content container
        const toggleContent = (cls, condition) => condition ? contentContainer.classList.add(cls) : contentContainer.classList.remove(cls);

        // Helper to toggle class on body (for cursor/animations that can be global)
        const toggleBody = (cls, condition) => condition ? document.body.classList.add(cls) : document.body.classList.remove(cls);


        toggleContent('acc-readable-font', settings.readableFont);
        toggleContent('acc-highlight-links', settings.highlightLinks);
        toggleContent('acc-highlight-headers', settings.highlightHeaders);
        toggleContent('acc-high-contrast', settings.highContrast);
        toggleContent('acc-invert', settings.invertColors);
        toggleContent('acc-monochrome', settings.monochrome);

        toggleBody('acc-big-cursor', settings.bigCursor);
        toggleBody('acc-stop-animations', settings.stopAnimations);
    };

    // --- Reading Guide Logic ---
    useEffect(() => {
        if (!settings.readingGuide) return;

        const handleMouseMove = (e) => {
            setReadingGuideY(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [settings.readingGuide]);

    // --- Handlers ---
    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const adjustFontSize = (delta) => {
        setSettings(prev => ({
            ...prev,
            fontSize: Math.min(200, Math.max(100, prev.fontSize + delta))
        }));
    };

    const resetAll = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <div className="acc-widget-root">
            {/* Global Style Injection */}
            <style jsx global>{`
                /* --- Accessibility Styles (Scoped to #site-content where possible) --- */
                
                /* Readable Font */
                #site-content.acc-readable-font * {
                    font-family: Arial, Helvetica, sans-serif !important;
                }

                /* Highlight Links */
                #site-content.acc-highlight-links a {
                    background-color: #ffeb3b !important; /* Yellow */
                    color: #000 !important;
                    text-decoration: underline !important;
                    font-weight: bold !important;
                }

                /* Highlight Headers */
                #site-content.acc-highlight-headers h1, 
                #site-content.acc-highlight-headers h2, 
                #site-content.acc-highlight-headers h3, 
                #site-content.acc-highlight-headers h4, 
                #site-content.acc-highlight-headers h5, 
                #site-content.acc-highlight-headers h6 {
                    background-color: #e0f7fa !important; /* Cyan Light */
                    color: #006064 !important;
                    border-bottom: 3px solid #0097a7 !important;
                    padding: 4px !important;
                }

                /* High Contrast */
                #site-content.acc-high-contrast {
                    filter: contrast(120%); 
                    background-color: #000 !important;
                    color: #fff !important;
                }
                #site-content.acc-high-contrast * {
                    background-color: #000 !important;
                    color: #ff0 !important; /* Yellow Text */
                    border-color: #fff !important;
                }
                #site-content.acc-high-contrast img, 
                #site-content.acc-high-contrast video {
                    filter: grayscale(100%) !important;
                    opacity: 0.8;
                }
                #site-content.acc-high-contrast a {
                    color: #0ff !important; /* Cyan Links */
                    text-decoration: underline;
                }
                
                /* Invert Colors */
                #site-content.acc-invert {
                    filter: invert(100%);
                }
                #site-content.acc-invert img, 
                #site-content.acc-invert video {
                    filter: invert(100%) !important; /* Re-invert to look normal */
                }

                /* Monochrome */
                #site-content.acc-monochrome {
                    filter: grayscale(100%);
                }

                /* Big Cursor (Global on Body) */
                body.acc-big-cursor, body.acc-big-cursor * {
                    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewport="0 0 48 48" style="fill:black;stroke:white;stroke-width:2px;"><path d="M7,2l12,36l6-16l16-6L7,2z"></path></svg>') 0 0, auto !important;
                }

                /* Stop Animations (Global on Body) */
                body.acc-stop-animations *, body.acc-stop-animations *:before, body.acc-stop-animations *:after {
                    animation: none !important;
                    transition: none !important;
                }
                
                /* Widget Protection Helper (Optional if inherited props leak) */
                .acc-widget-root {
                     font-size: 16px !important; 
                     line-height: 1.5 !important;
                }
            `}</style>

            {/* Reading Guide Overlay */}
            {settings.readingGuide && (
                <div
                    className="fixed left-0 w-full h-8 bg-yellow-400/30 border-t-2 border-b-2 border-red-500 pointer-events-none z-[10000]"
                    style={{ top: readingGuideY - 16 }}
                />
            )}

            {/* Trigger Button - Reduced Size, Custom Image Icon */}
            <div className={`fixed bottom-6 ${isHebrew ? 'left-6' : 'right-6'} z-[9999] font-sans rtl group acc-widget-ignore`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none bg-white/60 backdrop-blur-md border border-white/30 shadow-lg"
                    aria-label="פתח תפריט נגישות"
                    style={{ filter: 'none' }} // Extra safety
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-6 h-6 text-[#007AFF] transition-transform duration-300 group-hover:scale-110"
                    >
                        {/* Traced Head */}
                        <path d="M 11.672 0.000 L 11.203 0.094 L 11.062 0.188 L 10.969 0.188 L 10.688 0.328 L 10.172 0.703 L 9.844 1.078 L 9.750 1.219 L 9.562 1.594 L 9.562 1.688 L 9.469 1.828 L 9.375 2.297 L 9.375 2.906 L 9.469 3.375 L 9.562 3.516 L 9.562 3.609 L 9.750 3.984 L 10.078 4.406 L 10.406 4.688 L 10.688 4.875 L 10.969 5.016 L 11.391 5.156 L 12.281 5.203 L 12.562 5.156 L 12.984 5.016 L 13.359 4.828 L 13.781 4.500 L 14.109 4.125 L 14.391 3.609 L 14.531 3.188 L 14.578 2.906 L 14.578 2.297 L 14.484 1.828 L 14.391 1.688 L 14.391 1.594 L 14.203 1.219 L 13.875 0.797 L 13.500 0.469 L 13.359 0.375 L 12.984 0.188 L 12.891 0.188 L 12.750 0.094 L 12.281 0.000 Z" />
                        {/* Traced Torso, Arms & Legs */}
                        <path d="M 2.766 5.484 L 2.438 5.906 L 2.250 6.469 L 2.297 7.172 L 2.672 7.688 L 3.703 8.250 L 8.156 9.609 L 8.766 10.031 L 8.906 10.406 L 8.906 11.391 L 8.578 13.922 L 6.984 22.500 L 7.172 23.344 L 7.547 23.719 L 8.203 23.953 L 8.953 23.906 L 9.328 23.719 L 9.656 23.344 L 9.984 22.453 L 11.156 16.828 L 11.719 15.281 L 12.000 15.094 L 12.375 15.656 L 12.797 16.969 L 13.969 22.500 L 14.250 23.297 L 14.625 23.719 L 15.188 23.953 L 15.984 23.906 L 16.453 23.672 L 16.875 23.156 L 16.969 22.594 L 15.375 14.203 L 15.000 11.297 L 15.047 10.406 L 15.328 10.031 L 15.844 9.750 L 20.109 8.297 L 21.094 7.828 L 21.562 7.359 L 21.703 6.984 L 21.656 6.281 L 21.422 5.766 L 20.859 5.297 L 20.344 5.250 L 15.562 6.422 L 13.172 6.750 L 11.391 6.797 L 8.344 6.422 L 3.656 5.250 L 3.234 5.250 Z" />
                    </svg>
                </button>

                {/* The Widget Panel - Reduced size and max-height */}
                {isOpen && (
                    <div
                        className="absolute bottom-16 left-0 w-[300px] bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-fade-in-up origin-bottom-left acc-widget-ignore text-gray-800"
                        dir="rtl"
                        style={{ filter: 'none', color: '#1f2937' }} // Explicit colors to override high contrast
                    >
                        {/* Header */}
                        <div className="bg-gray-50/80 p-3 border-b flex justify-between items-center">
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                תפריט נגישות
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-200">
                                <Icons.Close />
                            </button>
                        </div>

                        <div className="p-3 max-h-[260px] overflow-y-auto custom-scrollbar">

                            {/* Text Size Slider Area */}
                            <div className="mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-700">הגדלת טקסט</span>
                                    <span className="text-xs font-bold text-blue-600">{settings.fontSize}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => adjustFontSize(-10)} className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50 text-lg">-</button>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(settings.fontSize - 100)}%` }}></div>
                                    </div>
                                    <button onClick={() => adjustFontSize(10)} className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50 text-lg">+</button>
                                </div>
                            </div>

                            {/* Grid of Features */}
                            <div className="grid grid-cols-2 gap-2">
                                <FeatureTile
                                    label="גופן קריא"
                                    icon={<Icons.Font />}
                                    active={settings.readableFont}
                                    onClick={() => toggleSetting('readableFont')}
                                />
                                <FeatureTile
                                    label="הדגשת קישורים"
                                    icon={<Icons.Link />}
                                    active={settings.highlightLinks}
                                    onClick={() => toggleSetting('highlightLinks')}
                                />
                                <FeatureTile
                                    label="הדגשת כותרות"
                                    icon={<Icons.Header />}
                                    active={settings.highlightHeaders}
                                    onClick={() => toggleSetting('highlightHeaders')}
                                />
                                <FeatureTile
                                    label="ניגודיות גבוהה"
                                    icon={<Icons.Contrast />}
                                    active={settings.highContrast}
                                    onClick={() => {
                                        // Exclusive modes check
                                        if (!settings.highContrast) {
                                            setSettings(s => ({ ...s, highContrast: true, invertColors: false, monochrome: false }));
                                        } else {
                                            toggleSetting('highContrast');
                                        }
                                    }}
                                />
                                <FeatureTile
                                    label="ניגודיות הפוכה"
                                    icon={<Icons.Invert />}
                                    active={settings.invertColors}
                                    onClick={() => {
                                        if (!settings.invertColors) {
                                            setSettings(s => ({ ...s, highContrast: false, invertColors: true, monochrome: false }));
                                        } else {
                                            toggleSetting('invertColors');
                                        }
                                    }}
                                />
                                <FeatureTile
                                    label="מונוכרום"
                                    icon={<Icons.Eye />}
                                    active={settings.monochrome}
                                    onClick={() => {
                                        if (!settings.monochrome) {
                                            setSettings(s => ({ ...s, highContrast: false, invertColors: false, monochrome: true }));
                                        } else {
                                            toggleSetting('monochrome');
                                        }
                                    }}
                                />
                                <FeatureTile
                                    label="סמן ענק"
                                    icon={<Icons.Cursor />}
                                    active={settings.bigCursor}
                                    onClick={() => toggleSetting('bigCursor')}
                                />
                                <FeatureTile
                                    label="עצור אנימציות"
                                    icon={<Icons.Stop />}
                                    active={settings.stopAnimations}
                                    onClick={() => toggleSetting('stopAnimations')}
                                />
                                <FeatureTile
                                    label="מדריך קריאה"
                                    icon={<Icons.Guide />}
                                    active={settings.readingGuide}
                                    onClick={() => toggleSetting('readingGuide')}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 p-3 border-t flex justify-between items-center text-[10px] text-gray-500">
                            <a href="/accessibility" className="hover:underline hover:text-blue-600">הצהרת נגישות</a>
                            <button onClick={resetAll} className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                איפוס
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for Tiles
function FeatureTile({ label, icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 min-h-[70px]
                ${active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                }
            `}
        >
            <div className={`${active ? 'text-white' : 'text-blue-500'}`}>
                {icon}
            </div>
            <span className="text-[11px] font-bold">{label}</span>
        </button>
    );
}
