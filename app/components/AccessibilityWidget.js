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

    return (
        <div className="fixed bottom-6 left-6 z-50 font-sans" style={{ direction: 'rtl' }}>
            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="תפריט נגישות"
                title="תפריט נגישות"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H1V7h6V1.24c-2-.16-4.9-1.59-5.55-4.24l-1.9 1.9-.7-1.4L2.85.5C5.05.5 8 2.5 8 2.5V7h13v2zM12 22c-4.97 0-9-4.03-9-9s4.03-9 9-9c4.97 0 9 4.03 9 9s-4.03 9-9 9zm1.25-13.88c-.37-.08-.75-.12-1.15-.12-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6c0-2.31-1.31-4.32-3.25-5.3l-.6.52v4.9z" />
                    <path fill="none" d="M0 0h24v24H0z" />
                </svg>
            </button>

            {/* Menu */}
            {isOpen && (
                <div className="absolute bottom-16 left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in-up text-gray-900">
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
                .high-contrast {
                    filter: invert(100%) hue-rotate(180deg) brightness(1.1) contrast(1.2);
                    background-color: #000 !important;
                }
                .high-contrast img, .high-contrast video, .high-contrast iframe, .high-contrast .fixed {
                    filter: invert(100%) hue-rotate(180deg);
                }
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
