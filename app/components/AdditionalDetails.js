"use client";

import React from 'react';
import { Calendar, Globe, Palette, ChevronDown } from 'lucide-react';

export default function AdditionalDetails({ seasons, country, perfumers }) {
    const [isOpen, setIsOpen] = React.useState(false);

    if (!seasons && !country && !perfumers) return null;

    return (
        <div className="w-full mt-4 border-t pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-right group py-2"
            >
                <span className="font-bold text-lg text-gray-800">
                    פרטים נוספים
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-6 shadow-sm">
                    {seasons && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                                <Calendar className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">עונות מתאימות</div>
                                <div className="flex flex-wrap gap-2">
                                    {seasons.split(',').map(s => (
                                        <span key={s} className="bg-black text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-sm transition-transform hover:scale-105">
                                            {s.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {country && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                                <Globe className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ארץ מקור</div>
                                <div className="text-sm font-bold text-gray-800">{country}</div>
                            </div>
                        </div>
                    )}

                    {perfumers && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                                <Palette className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">פרפיומר (PERFUMER)</div>
                                <div className="text-sm font-bold text-gray-800">
                                    {perfumers.split(',').map(p => p.trim()).join(' • ')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
