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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {/* Simplified Accessibility Icon (Person in Circle/Wheelchair metaphor) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: isOpen ? 0 : 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" style={{ display: isOpen ? 'none' : 'block' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    {/* Better Icon: Standard Accessibility Icon */}
                    <path d="M10 2a2 2 0 100 4 2 2 0 000-4zm2 5H8a1 1 0 00-1 1v2a1 1 0 001 1v6a1 1 0 002 0v-2h0v2a1 1 0 002 0V9a1 1 0 00-1-1z" />
                </svg>
            </button>

            {/* Menu */}
            {isOpen && (
                <div className="absolute bottom-16 left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-gray-800">כלי נגישות</h3>
                        <button onClick={resetSettings} className="text-xs text-red-500 hover:underline">איפוס</button>
                    </div>

                    <div className="space-y-4">
                        {/* Font Size */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">גודל טקסט</label>
                            <div className="flex gap-2">
                                <button onClick={() => setFontSize(Math.min(fontSize + 10, 150))} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-lg font-bold">+</button>
                                <button onClick={() => setFontSize(Math.max(fontSize - 10, 80))} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm">-</button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <button
                            onClick={() => setIsHighContrast(!isHighContrast)}
                            className={`w-full flex justify-between items-center p-2 rounded ${isHighContrast ? 'bg-black text-yellow-400' : 'bg-gray-50 text-gray-800'}`}
                        >
                            <span>ניגודיות גבוהה</span>
                            <span>{isHighContrast ? 'פעיל' : 'כבוי'}</span>
                        </button>

                        <button
                            onClick={() => setAreLinksHighlighted(!areLinksHighlighted)}
                            className={`w-full flex justify-between items-center p-2 rounded ${areLinksHighlighted ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-gray-50 text-gray-800'}`}
                        >
                            <span>הדגשת קישורים</span>
                            <span>{areLinksHighlighted ? 'פעיל' : 'כבוי'}</span>
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .high-contrast {
                    filter: contrast(120%);
                    background-color: #000 !important;
                    color: #fff !important;
                }
                .high-contrast img {
                    filter: brightness(80%);
                }
                .highlight-links a {
                    background-color: yellow !important;
                    color: black !important;
                    text-decoration: underline !important;
                }
            `}</style>
        </div>
    );
}
