"use client";

import { useState, useEffect, useRef } from 'react';

// --- Icons (Inline SVGs for performance & no deps) ---
const Icons = {
    Accessibility: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <path d="m4.93 4.93 14.14 14.14" className="opacity-0" />
            <path d="M12 2A10 10 0 1 0 12 22A10 10 0 1 0 12 2z" />
            <path d="M12 6v6" />
            <path d="M12 18h.01" />
            <path d="m8 8 8 8" className="opacity-0" />
            {/* Person Icon */}
            <circle cx="12" cy="7" r="2" />
            <path d="M10 11h4v7h-4z" />
            <path d="M6 11h4" />
            <path d="M14 11h4" />
        </svg>
    ),
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
    }, [settings]);

    // --- DOM Manipulation Side Effects ---
    const applySettings = () => {
        // 1. Text Scale
        document.documentElement.style.fontSize = `${settings.fontSize}%`;

        // 2. Class Toggles (Global Helper Classes)
        const body = document.body;

        // Helper to toggle class based on condition
        const toggle = (cls, condition) => condition ? body.classList.add(cls) : body.classList.remove(cls);

        toggle('acc-readable-font', settings.readableFont);
        toggle('acc-highlight-links', settings.highlightLinks);
        toggle('acc-highlight-headers', settings.highlightHeaders);
        toggle('acc-high-contrast', settings.highContrast);
        toggle('acc-invert', settings.invertColors);
        toggle('acc-monochrome', settings.monochrome);
        toggle('acc-big-cursor', settings.bigCursor);
        toggle('acc-stop-animations', settings.stopAnimations);
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
        <>
            {/* Global Style Injection */}
            <style jsx global>{`
                /* --- Accessibility Styles --- */
                
                /* Readable Font */
                .acc-readable-font * {
                    font-family: Arial, Helvetica, sans-serif !important;
                }

                /* Highlight Links */
                .acc-highlight-links a {
                    background-color: #ffeb3b !important; /* Yellow */
                    color: #000 !important;
                    text-decoration: underline !important;
                    font-weight: bold !important;
                }

                /* Highlight Headers */
                .acc-highlight-headers h1, .acc-highlight-headers h2, .acc-highlight-headers h3, .acc-highlight-headers h4, .acc-highlight-headers h5, .acc-highlight-headers h6 {
                    background-color: #e0f7fa !important; /* Cyan Light */
                    color: #006064 !important;
                    border-bottom: 3px solid #0097a7 !important;
                    padding: 4px !important;
                }

                /* High Contrast (Dark Mode like) */
                .acc-high-contrast {
                    filter: contrast(120%); 
                    background-color: #000 !important;
                    color: #fff !important;
                }
                .acc-high-contrast * {
                    background-color: #000 !important;
                    color: #ff0 !important; /* Yellow Text */
                    border-color: #fff !important;
                }
                .acc-high-contrast img, .acc-high-contrast video {
                    filter: grayscale(100%) !important;
                    opacity: 0.8;
                }
                .acc-high-contrast a {
                    color: #0ff !important; /* Cyan Links */
                    text-decoration: underline;
                }
                
                /* Invert Colors */
                .acc-invert {
                    filter: invert(100%);
                }
                .acc-invert img, .acc-invert video {
                    filter: invert(100%) !important; /* Re-invert media to look normal */
                }

                /* Monochrome */
                .acc-monochrome {
                    filter: grayscale(100%);
                }

                /* Big Cursor */
                .acc-big-cursor, .acc-big-cursor * {
                    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewport="0 0 48 48" style="fill:black;stroke:white;stroke-width:2px;"><path d="M7,2l12,36l6-16l16-6L7,2z"></path></svg>') 0 0, auto !important;
                }

                /* Stop Animations */
                .acc-stop-animations *, .acc-stop-animations *:before, .acc-stop-animations *:after {
                    animation: none !important;
                    transition: none !important;
                }
            `}</style>

            {/* Reading Guide Overlay */}
            {settings.readingGuide && (
                <div
                    className="fixed left-0 w-full h-8 bg-yellow-400/30 border-t-2 border-b-2 border-red-500 pointer-events-none z-[10000]"
                    style={{ top: readingGuideY - 16 }}
                />
            )}

            {/* Trigger Button */}
            <div className="fixed bottom-8 left-8 z-[9999] font-sans rtl group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2
                        ${isOpen ? 'bg-blue-700 ring-blue-400' : 'bg-blue-600 ring-blue-300'}
                    `}
                    aria-label="פתח תפריט נגישות"
                >
                    <div className="text-white">
                        {/* Custom Accessibility Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                            <circle cx="12" cy="7" r="2" />
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity=".3" />
                            <path d="M14 11h4v7h-2.5v-3h-1v3H12v-3.5l-2.5 3.5L8.2 13.1l2.3-3.1H10V11H6v-1.5h2.5V7H10V5h4v2h1.5v2.5H14V11z" />
                        </svg>
                    </div>

                    {/* Pulsing Effect when closed */}
                    {!isOpen && <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>}
                </button>

                {/* The Widget Panel */}
                {isOpen && (
                    <div
                        className="absolute bottom-20 left-0 w-[340px] md:w-[400px] bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom-left"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="bg-gray-50/80 p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1 rounded-md"><Icons.Accessibility /></span>
                                תפריט נגישות
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-200">
                                <Icons.Close />
                            </button>
                        </div>

                        <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">

                            {/* Text Size Slider Area */}
                            <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-700">הגדלת טקסט</span>
                                    <span className="text-sm font-bold text-blue-600">{settings.fontSize}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => adjustFontSize(-10)} className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50">-</button>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(settings.fontSize - 100)}%` }}></div>
                                    </div>
                                    <button onClick={() => adjustFontSize(10)} className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50">+</button>
                                </div>
                            </div>

                            {/* Grid of Features */}
                            <div className="grid grid-cols-2 gap-3">
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
                        <div className="bg-gray-50 p-4 border-t flex justify-between items-center text-xs text-gray-500">
                            <a href="/accessibility" className="hover:underline hover:text-blue-600">הצהרת נגישות</a>
                            <button onClick={resetAll} className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                איפוס הגדרות
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// Sub-component for Tiles
function FeatureTile({ label, icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200
                ${active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                }
            `}
        >
            <div className={`${active ? 'text-white' : 'text-blue-500'}`}>
                {icon}
            </div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
}
