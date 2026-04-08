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
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 w-full max-w-[420px] text-right animate-in fade-in zoom-in duration-200" dir="rtl">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900 tracking-tight">דירוג לקוחות חכם</h4>
                                </div>
                                <button onClick={() => setShowLegend(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                    שקלול ביצועי רכישה, וותק ונאמנות להגדרת איכות הלקוח
                                </p>
                                
                                <div className="grid grid-cols-1 gap-2.5">
                                    <TierItem label="AAA" color="bg-indigo-600" desc="Platinum Elite - לקוחות העל של המותג" />
                                    <TierItem label="AA" color="bg-emerald-600" desc="Gold - רכישה גבוהה ועקביות יוצאת דופן" />
                                    <TierItem label="A" color="bg-blue-600" desc="Silver - לקוחות נאמנים ופעילים" />
                                    <TierItem label="B" color="bg-amber-500" desc="Active - פעילות רגילה ופוטנציאל גבוה" />
                                    <TierItem label="C" color="bg-gray-400" desc="New/Occasional - לקוחות חדשים" />
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">הרכב הציון המשוקלל</p>
                                    <div className="flex flex-wrap gap-2">
                                        <MetricBadge icon={<TrendingUp size={11} />} label="סך רכישות" weight="40%" />
                                        <MetricBadge icon={<Award size={11} />} label="צפיפות הזמנות" weight="30%" />
                                        <MetricBadge icon={<Star size={11} />} label="סל ממוצע" weight="20%" />
                                        <MetricBadge icon={<Clock size={11} />} label="וותק לקוח" weight="10%" />
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
        <div className="flex items-center gap-4 p-2 bg-gray-50/20 rounded-2xl border border-transparent hover:bg-gray-50/50 transition duration-300">
            <div className={`w-10 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-sm ${color}`}>
                {label}
            </div>
            <span className="text-xs font-bold text-gray-700">{desc}</span>
        </div>
    );
}

function MetricBadge({ icon, label, weight }) {
    return (
        <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 bg-gray-50/80 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-blue-500">{icon}</span>
            <span>{label}</span>
            <span className="text-gray-300 mr-1">•</span>
            <span className="text-blue-600 font-black">{weight}</span>
        </span>
    );
}
