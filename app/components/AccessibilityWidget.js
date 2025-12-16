"use client";

import { useState, useEffect } from 'react';

export default function AccessibilityWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [fontSize, setFontSize] = useState(100); // Percentage
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [areLinksHighlighted, setAreLinksHighlighted] = useState(false);

    useEffect(() => {
        // Apply Font Size
        document.documentElement.style.fontSize = `${fontSize}%`;

        // Apply High Contrast
        if (isHighContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        // Apply Link Highlight
        if (areLinksHighlighted) {
            document.body.classList.add('highlight-links');
        } else {
            document.body.classList.remove('highlight-links');
        }

    }, [fontSize, isHighContrast, areLinksHighlighted]);

    const resetSettings = () => {
        setFontSize(100);
        setIsHighContrast(false);
        setAreLinksHighlighted(false);
    };

    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50 font-sans group" style={{ direction: 'rtl' }}>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-300 relative z-50"
                aria-label="תפריט נגישות"
                title="תפריט נגישות"
            >
                {/* Accessibility Icon (Active Person - White on Blue) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 14l-4-4-4 4-1.42-1.42L10 14.17v-3.76l-2.8-2.8L8.6 6.2l3.4 3.4 3.4-3.4 1.4 1.4-2.8 2.8v3.76l3.42 3.41L16 19z" />
                </svg>
            </button>

            {/* Close Button (X) - Allows hiding the widget */}
            {!isOpen && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                    className="absolute -top-2 -right-2 z-[60] bg-gray-200 text-gray-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-500 hover:text-white"
                    title="סגור כלי נגישות"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {/* Menu */}
            {isOpen && (
                <div className="absolute bottom-16 left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in-up text-gray-900 z-50">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold">כלי נגישות</h3>
                        <button onClick={resetSettings} className="text-xs text-red-500 hover:underline">איפוס</button>
                    </div>

                    <div className="space-y-4">
                        {/* Font Size */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">גודל טקסט</label>
                            <div className="flex gap-2">
                                <button onClick={() => setFontSize(Math.min(fontSize + 10, 150))} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-lg font-bold text-black border">+</button>
                                <button onClick={() => setFontSize(Math.max(fontSize - 10, 80))} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm text-black border">-</button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <button
                            onClick={() => setIsHighContrast(!isHighContrast)}
                            className={`w-full flex justify-between items-center p-2 rounded border transition-colors ${isHighContrast ? 'bg-black text-yellow-400 border-yellow-400 font-bold' : 'bg-gray-50 text-gray-800'}`}
                        >
                            <span>ניגודיות גבוהה</span>
                            <span>{isHighContrast ? 'פעיל' : 'כבוי'}</span>
                        </button>

                        <button
                            onClick={() => setAreLinksHighlighted(!areLinksHighlighted)}
                            className={`w-full flex justify-between items-center p-2 rounded border transition-colors ${areLinksHighlighted ? 'bg-yellow-100 ring-2 ring-yellow-400 text-black' : 'bg-gray-50 text-gray-800'}`}
                        >
                            <span>הדגשת קישורים</span>
                            <span>{areLinksHighlighted ? 'פעיל' : 'כבוי'}</span>
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                /* Robust Yellow-on-Black High Contrast Theme */
                
                /* Force Colors on Standard Elements */
                .high-contrast,
                .high-contrast body,
                .high-contrast header,
                .high-contrast nav,
                .high-contrast main,
                .high-contrast footer,
                .high-contrast section,
                .high-contrast article,
                .high-contrast aside,
                .high-contrast div:not([class*="fixed"]):not([class*="absolute"]),
                .high-contrast span,
                .high-contrast p,
                .high-contrast h1, .high-contrast h2, .high-contrast h3, .high-contrast h4, .high-contrast h5, .high-contrast h6,
                .high-contrast li,
                .high-contrast table, .high-contrast th, .high-contrast td {
                    background-color: #000 !important;
                    color: #FFD700 !important;
                    border-color: #FFD700 !important;
                    box-shadow: none !important;
                    text-shadow: none !important;
                }

                /* Fix Inputs and Buttons */
                .high-contrast a,
                .high-contrast button:not([class*="fixed"]),
                .high-contrast input,
                .high-contrast select,
                .high-contrast textarea {
                    background-color: #000 !important;
                    color: #FFD700 !important;
                    border: 2px solid #FFD700 !important;
                }
                
                /* SVGs inside High Contrast content */
                .high-contrast header svg,
                .high-contrast main svg,
                .high-contrast footer svg,
                .high-contrast nav svg {
                     fill: #FFD700 !important;
                     stroke: #FFD700 !important;
                }
                .high-contrast .no-fill-svg {
                    fill: none !important;
                }

                /* Ensure Images remain natural but with a border */
                .high-contrast img {
                    filter: none !important;
                    border: 1px solid #FFD700 !important;
                    opacity: 1 !important;
                }

                /* Layout Fixes for Header */
                .high-contrast .sticky, 
                .high-contrast .fixed {
                    background-color: #000 !important;
                    border-bottom: 2px solid #FFD700 !important; 
                    z-index: 50 !important;
                }

                /* Fix Accessibility Widget Itself */
                .high-contrast button[title="תפריט נגישות"] {
                    background-color: #000 !important;
                    color: #FFD700 !important;
                    border: 2px solid #FFD700 !important;
                }
                 .high-contrast button[title="תפריט נגישות"] svg {
                     fill: #FFD700 !important;
                 }


                /* Link Highlighting */
                .highlight-links a {
                    background-color: yellow !important;
                    color: black !important;
                    text-decoration: underline !important;
                    font-weight: bold !important;
                }
            `}</style>
        </div>
    );
}
