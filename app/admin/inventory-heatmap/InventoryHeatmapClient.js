"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, AlertCircle, CheckCircle2, Clock, Skull, Droplet, TrendingUp, Info } from 'lucide-react';

export default function InventoryHeatmapClient() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await fetch('/api/admin/procurement/insights');
                if (res.ok) {
                    const json = await res.json();
                    setData(json.insights || []);
                }
            } catch (err) {
                console.error("Error fetching insights:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    const processItem = (item) => {
        let category = 'slow';
        let overlayColor = 'bg-blue-500/40';
        let borderColor = 'border-blue-200';
        let icon = <Droplet className="w-4 h-4" />;
        let statusText = 'עודף מלאי';
        
        if (item.velocity === 0 && item.stock > 0) {
            category = 'dead';
            overlayColor = 'bg-slate-600/60';
            borderColor = 'border-slate-300';
            icon = <Skull className="w-4 h-4" />;
            statusText = 'מלאי מת';
        } else if (item.stock <= 0 && item.velocity > 0) {
            category = 'sold_out';
            overlayColor = 'bg-red-600/70';
            borderColor = 'border-red-400';
            icon = <AlertCircle className="w-4 h-4" />;
            statusText = 'אזל המלאי';
        } else if (item.daysRemaining < 30) {
            category = 'hot';
            overlayColor = 'bg-orange-600/70';
            borderColor = 'border-orange-400';
            icon = <Flame className="w-4 h-4" />;
            statusText = 'לוהט';
        } else if (item.daysRemaining < 90) {
            category = 'warm';
            overlayColor = 'bg-amber-500/60';
            borderColor = 'border-amber-300';
            icon = <TrendingUp className="w-4 h-4" />;
            statusText = 'מבוקש';
        } else if (item.daysRemaining < 180) {
            category = 'healthy';
            overlayColor = 'bg-emerald-500/50';
            borderColor = 'border-emerald-300';
            icon = <CheckCircle2 className="w-4 h-4" />;
            statusText = 'תקין';
        }

        return { ...item, category, overlayColor, borderColor, icon, statusText };
    };

    const processedData = useMemo(() => {
        return data.map(processItem).filter(item => {
            if (item.velocity === 0 && item.stock <= 0) return false;
            const searchMatch = (`${item.brand} ${item.model} ${item.brand_he} ${item.model_he}`).toLowerCase().includes(search.toLowerCase());
            const catMatch = selectedCategory === 'all' || item.category === selectedCategory;
            return searchMatch && catMatch;
        }).sort((a, b) => {
            const aDays = a.velocity > 0 ? a.daysRemaining : 9999;
            const bDays = b.velocity > 0 ? b.daysRemaining : 9999;
            return aDays - bDays;
        });
    }, [data, search, selectedCategory]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">בונה את הכוורת...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Legend & Stats Overview */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <LegendItem color="bg-orange-500" label="לוהט (<30 יום)" onClick={() => setSelectedCategory('hot')} active={selectedCategory === 'hot'} />
                    <LegendItem color="bg-red-600" label="אזל (0 מ״ל)" onClick={() => setSelectedCategory('sold_out')} active={selectedCategory === 'sold_out'} />
                    <LegendItem color="bg-emerald-500" label="תקין" onClick={() => setSelectedCategory('healthy')} active={selectedCategory === 'healthy'} />
                    <LegendItem color="bg-slate-600" label="מלאי מת" onClick={() => setSelectedCategory('dead')} active={selectedCategory === 'dead'} />
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="חיפוש מהיר..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border-none focus:ring-1 focus:ring-blue-500/20 text-xs font-bold py-2 pr-9 pl-3 rounded-xl outline-none placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* The Heatmap Grid (Hive) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <AnimatePresence>
                    {processedData.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.01 }}
                            className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Product Image Background */}
                            <div className="absolute inset-0">
                                {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-300 uppercase tracking-tighter text-center px-1">
                                        {item.brand}
                                    </div>
                                )}
                            </div>

                            {/* Status Overlay */}
                            <div className={`absolute inset-0 ${item.overlayColor} transition-opacity duration-300 group-hover:opacity-20`}></div>

                            {/* Label Bottom */}
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <div className="text-[9px] font-black text-white uppercase tracking-tight truncate leading-none">{item.brand}</div>
                                <div className="text-[8px] font-medium text-white/70 truncate">{item.model}</div>
                            </div>

                            {/* Top Badge Icon */}
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/30">
                                {item.icon}
                            </div>

                            {/* Data Reveal on Hover */}
                            <motion.div 
                                className="absolute inset-0 bg-black/85 backdrop-blur-sm p-3 flex flex-col justify-center items-center text-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                initial={false}
                            >
                                <div className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/20 pb-1 w-full">{item.statusText}</div>
                                
                                <div className="space-y-1 w-full">
                                    <DataRow label="מלאי" value={`${Math.floor(item.stock)} ml`} />
                                    <DataRow label="קצב יומי" value={`${item.velocity?.toFixed(1)} ml`} />
                                    <DataRow label="ימי מלאי" value={item.velocity > 0 ? Math.round(item.daysRemaining) : '∞'} color={item.daysRemaining < 30 ? 'text-red-400' : 'text-blue-400'} />
                                </div>

                                <motion.div 
                                    className="mt-1 w-full h-1 bg-white/10 rounded-full overflow-hidden"
                                >
                                    <motion.div 
                                        className={`h-full ${item.category === 'hot' ? 'bg-orange-500' : 'bg-blue-400'}`}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${Math.min(100, (item.velocity/10)*100)}%` }}
                                    />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {processedData.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">לא נמצאו מוצרים תואמים לחיפוש</p>
                </div>
            )}
        </div>
    );
}

function LegendItem({ color, label, onClick, active }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${active ? 'bg-white shadow-md scale-105 border-gray-200 ring-2 ring-blue-500/10' : 'bg-transparent border-transparent hover:bg-white/50'}`}
        >
            <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{label}</span>
        </button>
    );
}

function DataRow({ label, value, color = "text-white" }) {
    return (
        <div className="flex justify-between items-center w-full">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
            <span className={`text-[10px] font-black ${color} tabular-nums`} dir="ltr">{value}</span>
        </div>
    );
}
