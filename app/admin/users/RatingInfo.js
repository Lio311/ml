'use client';

import React, { useState } from 'react';
import { Info, X, Zap, Award, Star, TrendingUp, Clock, DollarSign, Layers, BarChart3 } from 'lucide-react';

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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setShowLegend(false)}>
                        {/* Premium Glassmorphic Container */}
                        <div 
                            className="bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white p-8 md:p-12 
                                       w-full max-w-[320px] max-h-[85vh] 
                                       md:max-w-5xl md:max-h-[42vh] 
                                       overflow-y-auto text-right animate-in fade-in zoom-in duration-200" 
                            dir="rtl" 
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                scrollbarWidth: 'none', 
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            {/* Hidden scrollbar CSS helper */}
                            <style dangerouslySetInnerHTML={{ __html: `
                                .scrollbar-hidden::-webkit-scrollbar { display: none; }
                            ` }} />

                            {/* Sticky Header with Modern Typography */}
                            <div className="flex justify-between items-center mb-10 md:mb-8 sticky top-0 bg-white/50 backdrop-blur-md z-10 pb-4 border-b border-gray-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shadow-inner">
                                        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">מנגנון דירוג לקוחות חכם</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Premium Scoring Engine & AI Metrics</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowLegend(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all group">
                                    <X className="w-6 h-6 text-gray-300 group-hover:text-red-500 group-hover:rotate-90 duration-300" />
                                </button>
                            </div>

                            {/* Ultra-Wide Content Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 scrollbar-hidden">
                                
                                {/* Tiers Section - Left on Desktop */}
                                <div className="md:col-span-8 flex flex-col gap-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">סיווג רמות לקוח (Tiers)</h5>
                                        <div className="h-px bg-gray-100 flex-grow mr-6"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <TierItem label="AAA" color="bg-indigo-600" desc="Platinum Elite" detail="הטופ 5% עם סל ממוצע מקסימלי" />
                                        <TierItem label="AA" color="bg-emerald-600" desc="Gold Partner" detail="רכישה גבוהה ועקביות לטווח ארוך" />
                                        <TierItem label="A" color="bg-blue-600" desc="Silver Loyal" detail="לקוחות נאמנים עם רכישות קבועות" />
                                        <TierItem label="B" color="bg-amber-500" desc="Active User" detail="פעילות רגילה בטווח חודשי תקין" />
                                        <TierItem label="C" color="bg-gray-400" desc="New/Casual" detail="לקוחות מזדמנים או בשלבי הצטרפות" />
                                    </div>
                                </div>

                                {/* Weights Section - Right Column */}
                                <div className="md:col-span-4 flex flex-col gap-6">
                                    <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">הרכב הציון (Algorithm)</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricBadge icon={<DollarSign size={14} />} label="סך רכישות" weight="40%" />
                                        <MetricBadge icon={<Layers size={14} />} label="צפיפות" weight="30%" />
                                        <MetricBadge icon={<BarChart3 size={14} />} label="סל ממוצע" weight="20%" />
                                        <MetricBadge icon={<Clock size={14} />} label="וותק לקוח" weight="10%" />
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                        <p className="text-[10px] text-blue-600/80 font-bold leading-relaxed text-center italic">
                                            האלגוריתם מתעדכן בזמן אמת עם כל הזמנה חדשה שמתקבלת במערכת
                                        </p>
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
        <div className="flex flex-col gap-2 p-4 bg-gray-50/30 rounded-[1.5rem] border border-transparent hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-100 transition-all duration-300 group">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-lg ${color}`}>
                    {label}
                </div>
                <span className="text-xs font-black text-gray-900 tracking-tight">{desc}</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 group-hover:text-gray-500 transition-colors">{detail}</p>
        </div>
    );
}

function MetricBadge({ icon, label, weight }) {
    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-gray-50/50 rounded-[1.5rem] border border-gray-100/50 hover:bg-white hover:shadow-lg transition-all text-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                {icon}
            </div>
            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">{label}</div>
            <div className="text-sm font-black text-gray-900 tabular-nums">{weight}</div>
        </div>
    );
}
