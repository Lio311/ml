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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:absolute md:inset-auto md:top-full md:left-0 md:mt-2 md:bg-transparent">
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 w-full max-w-[280px] text-right animate-in fade-in zoom-in duration-200" dir="rtl">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-black flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    דירוג לקוחות חכם
                                </h4>
                                <button onClick={() => setShowLegend(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                                    שקלול ביצועי רכישה, וותק ונאמנות
                                </p>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    <TierItem label="AAA" color="bg-indigo-600" desc="Platinum - לקוחות עלית" />
                                    <TierItem label="AA" color="bg-emerald-600" desc="Gold - רכישה גבוהה ועקבית" />
                                    <TierItem label="A" color="bg-blue-600" desc="Silver - לקוחות נאמנים" />
                                    <TierItem label="B" color="bg-amber-500" desc="Active - פעילות רגילה" />
                                    <TierItem label="C" color="bg-gray-400" desc="New - לקוחות חדשים" />
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-1.5 opacity-60">
                                    <MetricBadge icon={<TrendingUp size={10} />} label="סל" />
                                    <MetricBadge icon={<Clock size={10} />} label="וותק" />
                                    <MetricBadge icon={<Star size={10} />} label="עקביות" />
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
        <div className="flex items-center gap-3 p-1.5 bg-gray-50/30 rounded-xl border border-transparent">
            <div className={`w-8 h-5 rounded-lg flex items-center justify-center text-white text-[9px] font-black shadow-sm ${color}`}>
                {label}
            </div>
            <span className="text-[10px] font-bold text-gray-600">{desc}</span>
        </div>
    );
}

function MetricBadge({ icon, label }) {
    return (
        <span className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
            {icon}
            {label}
        </span>
    );
}
