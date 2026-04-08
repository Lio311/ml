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
                        <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-10 w-full max-w-2xl text-right animate-in fade-in zoom-in duration-200" dir="rtl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shadow-sm">
                                        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-gray-900 tracking-tight leading-none">מערכת דירוג הלקוחות</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Smart Customer Analytics Engine</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowLegend(false)} className="p-2 hover:bg-gray-100 rounded-full transition group">
                                    <X className="w-6 h-6 text-gray-300 group-hover:text-red-500 transition-colors" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                    <p className="text-xs text-gray-500 font-bold leading-relaxed">
                                        הדירוג מחושב באופן אוטומטי על בסיס שקלול ביצועי רכישה, עקביות הזמנות וותק הלקוח במערכת.
                                    </p>
                                </div>
                                
                                <div className="space-y-4">
                                    <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">סיווג רמות לקוח (Tiers)</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <TierItem label="AAA" color="bg-indigo-600" desc="Platinum Elite - לקוחות העל" />
                                        <TierItem label="AA" color="bg-emerald-600" desc="Gold - רכישה גבוהה ועקבית" />
                                        <TierItem label="A" color="bg-blue-600" desc="Silver - לקוחות נאמנים" />
                                        <TierItem label="B" color="bg-amber-500" desc="Active - פוטנציאל גבוה" />
                                        <TierItem label="C" color="bg-gray-400" desc="New - לקוחות מזדמנים" />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">הרכב הציון (Algorithm Weights)</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <MetricBadge icon={<TrendingUp size={12} />} label="רכישות" weight="40%" />
                                        <MetricBadge icon={<Award size={12} />} label="צפיפות" weight="30%" />
                                        <MetricBadge icon={<Star size={12} />} label="סל" weight="20%" />
                                        <MetricBadge icon={<Clock size={12} />} label="וותק" weight="10%" />
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
        <div className="flex items-center gap-3 p-3 bg-gray-50/20 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all duration-300 hover:shadow-sm">
            <div className={`w-9 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-sm shrink-0 ${color}`}>
                {label}
            </div>
            <span className="text-[11px] font-bold text-gray-700 leading-tight">{desc}</span>
        </div>
    );
}

function MetricBadge({ icon, label, weight }) {
    return (
        <div className="flex flex-col items-center gap-1.5 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50 text-center transition-all hover:bg-white hover:shadow-sm">
            <div className="text-blue-500 bg-white p-1.5 rounded-lg shadow-sm">{icon}</div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{label}</div>
            <div className="text-sm font-black text-blue-600 leading-none">{weight}</div>
        </div>
    );
}
