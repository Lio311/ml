'use client';

import React, { useState } from 'react';
import { Info, X, Zap, Award, Star, TrendingUp, Clock, DollarSign, Layers, BarChart3 } from 'lucide-react';

const TIERS = [
    { label: 'AAA', color: 'bg-indigo-600', text: 'text-indigo-600', desc: 'Platinum Elite', detail: 'הטופ 5% עם סל ממוצע מקסימלי' },
    { label: 'AA', color: 'bg-emerald-600', text: 'text-emerald-600', desc: 'Gold Partner', detail: 'רכישה גבוהה ועקביות לטווח ארוך' },
    { label: 'A', color: 'bg-blue-600', text: 'text-blue-600', desc: 'Silver Loyal', detail: 'לקוחות נאמנים עם רכישות קבועות' },
    { label: 'B', color: 'bg-amber-500', text: 'text-amber-500', desc: 'Active User', detail: 'פעילות רגילה בטווח חודשי תקין' },
    { label: 'C', color: 'bg-gray-400', text: 'text-gray-400', desc: 'New/Casual', detail: 'לקוחות מזדמנים או בשלבי הצטרפות' },
];

export function RatingBadge({ score }) {
    const getTier = (s) => {
        if (s >= 90) return TIERS[0];
        if (s >= 75) return TIERS[1];
        if (s >= 60) return TIERS[2];
        if (s >= 40) return TIERS[3];
        return TIERS[4];
    };

    const tier = getTier(score);

    return (
        <div className={`px-2 py-0.5 rounded-md text-white text-[10px] font-black shadow-sm inline-block ${tier.color}`}>
            {tier.label}
        </div>
    );
}

export function RatingLegend() {
    const [showLegend, setShowLegend] = useState(false);

    return (
        <div className="relative inline-flex items-center group">
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    setShowLegend(!showLegend);
                }}
                className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                title="מידע על הדירוג"
            >
                <Info className="w-3.5 h-3.5" />
            </button>

            {showLegend && (
                <>
                    <div 
                        className="fixed inset-0 z-[100] bg-black/5 backdrop-blur-[2px]" 
                        onClick={() => setShowLegend(false)}
                    />
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setShowLegend(false)}>
                        <div 
                            className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white p-6 md:p-10 
                                       w-full max-w-[300px] md:max-w-4xl max-h-[85vh] md:max-h-[70vh]
                                       overflow-y-auto scrollbar-hide text-right animate-in fade-in zoom-in duration-200" 
                            dir="rtl" 
                            onClick={(e) => e.stopPropagation()}
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />

                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 md:mb-8 bg-white/50 backdrop-blur-md z-10 pb-4 border-b border-gray-100/50">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-9 h-9 md:w-12 md:h-12 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
                                        <Zap className="w-5 h-5 md:w-6 md:h-6 text-amber-500 fill-amber-500" />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-sm md:text-xl font-black text-gray-900 tracking-tight leading-none">מנגנון דירוג לקוחות</h4>
                                        <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 md:mt-2">Premium Scoring Engine</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowLegend(false)} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-all group">
                                    <X className="w-5 h-5 md:w-6 md:h-6 text-gray-300 group-hover:text-red-500 group-hover:rotate-90 duration-300" />
                                </button>
                            </div>

                            {/* Vertical Stacking Layout */}
                            <div className="flex flex-col gap-8 md:gap-10">
                                
                                {/* Section 1: Tiers */}
                                <div className="flex flex-col gap-3 md:gap-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h5 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">סיווג רמות (Tiers)</h5>
                                        <div className="h-px bg-gray-100 flex-grow mr-4 md:mr-6"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                        {TIERS.map(t => (
                                            <TierItem key={t.label} {...t} />
                                        ))}
                                    </div>
                                </div>

                                {/* Section 2: Algorithm Weights */}
                                <div className="flex flex-col gap-3 md:gap-4 border-t border-gray-50 pt-6 md:pt-8">
                                    <div className="flex items-center justify-between px-2">
                                        <h5 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">הרכב הציון (Algorithm)</h5>
                                        <div className="h-px bg-gray-100 flex-grow mr-4 md:mr-6"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                                        <MetricBadge icon={<DollarSign size={14} />} label="סך רכישות" weight="40%" />
                                        <MetricBadge icon={<Layers size={14} />} label="צפיפות רכישה" weight="30%" />
                                        <MetricBadge icon={<BarChart3 size={14} />} label="סל ממוצע" weight="20%" />
                                        <MetricBadge icon={<Clock size={14} />} label="וותק לקוח" weight="10%" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function TierItem({ label, color, desc, detail }) {
    return (
        <div className="flex items-center md:flex-col gap-3 md:gap-2 p-3 md:p-4 bg-gray-50/20 md:bg-gray-50/30 rounded-xl md:rounded-[1.5rem] border border-transparent hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-100 transition-all duration-300 group">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-5 md:w-10 md:h-6 rounded-lg flex items-center justify-center text-white text-[9px] md:text-[10px] font-black shadow-lg shrink-0 ${color}`}>
                    {label}
                </div>
                <span className="text-[11px] md:text-xs font-black text-gray-900 tracking-tight">{desc}</span>
            </div>
            <p className="hidden md:block text-[9px] font-bold text-gray-400 group-hover:text-gray-500 transition-colors uppercase tracking-tight">{detail}</p>
        </div>
    );
}

function MetricBadge({ icon, label, weight }) {
    return (
        <div className="flex items-center justify-between md:flex-col md:justify-center md:text-center gap-3 md:gap-2 p-3 md:p-4 bg-gray-50/50 rounded-xl md:rounded-2xl border border-gray-100/50 hover:bg-white hover:shadow-xl transition-all">
            <div className="flex items-center gap-2.5 md:flex-col md:gap-2 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                    {icon}
                </div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none truncate">{label}</div>
            </div>
            <div className="text-[11px] md:text-sm font-black text-gray-900 tabular-nums bg-white px-2 md:px-2.5 py-1 rounded-lg shadow-sm shrink-0">{weight}</div>
        </div>
    );
}
