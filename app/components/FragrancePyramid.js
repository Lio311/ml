"use client";

import React from 'react';

export default function FragrancePyramid({ top, middle, base }) {
    const [isOpen, setIsOpen] = React.useState(false);

    if (!top && !middle && !base) return null;

    const parseNotes = (notesStr) => {
        if (!notesStr) return [];
        return notesStr.split(',').map(n => n.trim()).filter(Boolean);
    };

    const topNotes = parseNotes(top);
    const middleNotes = parseNotes(middle);
    const baseNotes = parseNotes(base);

    return (
        <div className="w-full mt-6 border-t pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-right group py-2"
            >
                <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    פירמידת הבושם
                </span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="py-4 flex flex-col items-center gap-4 relative">

                    {/* Background Triangle Shape */}
                    <div className="absolute inset-0 z-0 flex justify-center opacity-5 pointer-events-none">
                        <div className="w-0 h-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-b-[200px] border-b-black"></div>
                    </div>

                    {/* Top Notes */}
                    {topNotes.length > 0 && (
                        <div className="z-10 flex flex-col items-center animate-fadeIn">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">תווים עליונים</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {topNotes.map((note, idx) => (
                                    <span key={idx} className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Middle Notes */}
                    {middleNotes.length > 0 && (
                        <div className="z-10 flex flex-col items-center mt-2 animate-fadeIn delay-100">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">תווי לב</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {middleNotes.map((note, idx) => (
                                    <span key={idx} className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Base Notes */}
                    {baseNotes.length > 0 && (
                        <div className="z-10 flex flex-col items-center mt-2 animate-fadeIn delay-200">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">תווי בסיס</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {baseNotes.map((note, idx) => (
                                    <span key={idx} className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-gray-200 shadow-sm">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
