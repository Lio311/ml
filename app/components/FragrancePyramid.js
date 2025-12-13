"use client";

import React from 'react';

export default function FragrancePyramid({ top, middle, base }) {
    if (!top && !middle && !base) return null;

    const parseNotes = (notesStr) => {
        if (!notesStr) return [];
        return notesStr.split(',').map(n => n.trim()).filter(Boolean);
    };

    const topNotes = parseNotes(top);
    const middleNotes = parseNotes(middle);
    const baseNotes = parseNotes(base);

    return (
        <div className="w-full max-w-2xl mx-auto my-12 text-center rtl">
            <h3 className="text-2xl font-serif text-black mb-8 border-b-2 border-black/10 pb-4 inline-block px-8">
                פירמידת הבושם
            </h3>

            <div className="relative flex flex-col items-center gap-8 py-8 bg-neutral-50/50 rounded-3xl">

                {/* Top Notes */}
                {topNotes.length > 0 && (
                    <div className="w-[40%] flex flex-col items-center">
                        <div className="mb-2 text-xs uppercase tracking-widest text-neutral-500 font-medium">תווים עליונים</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {topNotes.map((note, idx) => (
                                <span key={idx} className="bg-white px-3 py-1.5 rounded-full shadow-sm text-sm border border-neutral-100 text-neutral-800">
                                    {note}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Middle Notes */}
                {middleNotes.length > 0 && (
                    <div className="w-[70%] flex flex-col items-center border-t border-dashed border-neutral-300/50 pt-6">
                        <div className="mb-2 text-xs uppercase tracking-widest text-neutral-500 font-medium">תווי לב</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {middleNotes.map((note, idx) => (
                                <span key={idx} className="bg-white px-3 py-1.5 rounded-full shadow-sm text-sm border border-neutral-100 text-neutral-800">
                                    {note}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Base Notes */}
                {baseNotes.length > 0 && (
                    <div className="w-[90%] flex flex-col items-center border-t border-dashed border-neutral-300/50 pt-6">
                        <div className="mb-2 text-xs uppercase tracking-widest text-neutral-500 font-medium">תווי בסיס</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {baseNotes.map((note, idx) => (
                                <span key={idx} className="bg-white px-3 py-1.5 rounded-full shadow-sm text-sm border border-neutral-100 text-neutral-800">
                                    {note}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
