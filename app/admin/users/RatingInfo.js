'use client';

import React, { useState } from 'react';
import { Info, X, Zap, Award, Star, TrendingUp, Clock } from 'lucide-react';

export default function RatingInfo({ score }) {
    const [showLegend, setShowLegend] = useState(false);

    const getTier = (s) => {
        if (s >= 90) return { label: 'AAA', color: 'bg-indigo-600', text: 'text-indigo-600', desc: 'לקוח פלטינה - טופ 5%' };
        if (s >= 75) return { label: 'AA', color: 'bg-emerald-600', text: 'text-emerald-600', desc: 'לקוח זהב - פעילות גבוהה' };
        if (s >= 60) return { label: 'A', color: 'bg-blue-600', text: 'text-blue-600', desc: 'לקוח כסף - נאמנות טובה' };
        if (s >= 40) return { label: 'B', color: 'bg-amber-500', text: 'text-amber-500', desc: 'לקוח פעיל - פוטנציאל גבוה' };
        return { label: 'C', color: 'bg-gray-400', text: 'text-gray-400', desc: 'לקוח מזדמן / חדש' };
    };

    const tier = getTier(score);

    return (
        <div className="relative inline-flex items-center gap-2 group">
            {/* Rating Badge */}
            <div className={`px-2 py-0.5 rounded-md text-white text-[10px] font-black shadow-sm ${tier.color}`}>
                {tier.label}
            </div>

            {/* Info Icon with Toggle */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    setShowLegend(!showLegend);
                }}
                className="text-gray-300 hover:text-blue-500 transition-colors"
                title="מידע על הדירוג"
            >
                <Info className="w-3.5 h-3.5" />
            </button>

            {/* Legend Popover */}
            {showLegend && (
                <>
                    <div 
                        className="fixed inset-0 z-[100] bg-black/5" 
                        onClick={() => setShowLegend(false)}
                    />
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:absolute md:inset-auto md:top-full md:left-0 md:mt-2 md:bg-transparent" onClick={() => setShowLegend(false)}>
                        {/* Wrapper with Responsive Constraints */}
                        <div 
                            className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 
                                       w-full max-w-[300px] max-h-[85vh] 
                                       md:max-w-4xl md:max-h-[30vh] 
                                       overflow-y-auto scrollbar-hide text-right animate-in fade-in zoom-in duration-200" 
                            dir="rtl" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header - Sticky for Desktop short view */}
                            <div className="flex justify-between items-center mb-6 md:mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    <h4 className="text-sm md:text-base font-black text-gray-900 tracking-tight">דירוג לקוחות חכם</h4>
                                </div>
                                <button onClick={() => setShowLegend(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition group">
                                    <X className="w-5 h-5 text-gray-300 group-hover:text-red-500" />
                                </button>
                            </div>

                            {/* Content Grid: Vertical on Mobile, Horizontal on Desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                                
                                {/* Tiers Section */}
                                <div className="md:col-span-8 flex flex-col gap-3">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">סיווג רמות (Tiers)</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <TierItem label="AAA" color="bg-indigo-600" desc="Platinum Elite" />
                                        <TierItem label="AA" color="bg-emerald-600" desc="Gold - רכישה גבוהה" />
                                        <TierItem label="A" color="bg-blue-600" desc="Silver - לקוחות נאמנים" />
                                        <TierItem label="B" color="bg-amber-500" desc="Active - פוטנציאל גבוה" />
                                        <TierItem label="C" color="bg-gray-400" desc="New - לקוחות מזדמנים" />
                                    </div>
                                </div>

                                {/* Weights Section */}
                                <div className="md:col-span-4 flex flex-col gap-3 md:border-r md:border-gray-50 md:pr-6">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">הרכב הציון (%)</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <MetricBadge icon={<TrendingUp size={10} />} label="רכישות" weight="40%" />
                                        <MetricBadge icon={<Award size={10} />} label="צפיפות" weight="30%" />
                                        <MetricBadge icon={<Star size={10} />} label="סל" weight="20%" />
                                        <MetricBadge icon={<Clock size={10} />} label="וותק" weight="10%" />
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

function TierItem({ label, color, desc }) {
    return (
        <div className="flex items-center gap-3 p-2 bg-gray-50/20 rounded-xl border border-transparent hover:bg-white hover:shadow-sm hover:border-gray-100 transition-all cursor-default">
            <div className={`w-9 h-5 rounded-lg flex items-center justify-center text-white text-[9px] font-black shadow-sm shrink-0 ${color}`}>
                {label}
            </div>
            <span className="text-[10px] font-bold text-gray-650 leading-tight">{desc}</span>
        </div>
    );
}

function MetricBadge({ icon, label, weight }) {
    return (
        <div className="flex items-center justify-between gap-3 p-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-blue-500 opacity-70 shrink-0">{icon}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate">{label}</span>
            </div>
            <span className="text-[10px] font-black text-blue-600 shrink-0">{weight}</span>
        </div>
    );
}
