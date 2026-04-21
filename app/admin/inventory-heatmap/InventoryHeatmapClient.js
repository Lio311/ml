"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, AlertCircle, CheckCircle2, Clock, Skull, Droplet, TrendingUp } from 'lucide-react';

export default function InventoryHeatmapClient() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

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
        let category = 'slow'; // Default
        let color = 'bg-gray-400';
        let bgLight = 'bg-gray-50';
        let barColor = 'bg-gray-500';
        let icon = <Clock className="w-4 h-4" />;
        let statusText = '';
        
        if (item.velocity === 0 && item.stock > 0) {
            category = 'dead';
            color = 'text-slate-500';
            bgLight = 'bg-slate-50';
            barColor = 'bg-slate-300';
            icon = <Skull className="w-4 h-4" />;
            statusText = 'שוכב במדף (0 מכירות)';
        } else if (item.stock <= 0 && item.velocity > 0) {
            category = 'sold_out';
            color = 'text-red-600';
            bgLight = 'bg-red-50/50';
            barColor = 'bg-red-600';
            icon = <AlertCircle className="w-4 h-4" />;
            statusText = 'אזל המלאי!';
        } else if (item.daysRemaining < 30) {
            category = 'hot';
            color = 'text-orange-600';
            bgLight = 'bg-orange-50';
            barColor = 'bg-gradient-to-r from-orange-400 to-red-500';
            icon = <Flame className="w-4 h-4" />;
            statusText = `תכף נגמר (${Math.round(item.daysRemaining)} ימים)`;
        } else if (item.daysRemaining < 90) {
            category = 'warm';
            color = 'text-amber-600';
            bgLight = 'bg-amber-50/50';
            barColor = 'bg-amber-400';
            icon = <TrendingUp className="w-4 h-4" />;
            statusText = `קצב גבוה (${Math.round(item.daysRemaining)} ימים)`;
        } else if (item.daysRemaining < 180) {
            category = 'healthy';
            color = 'text-emerald-600';
            bgLight = 'bg-emerald-50/30';
            barColor = 'bg-emerald-500';
            icon = <CheckCircle2 className="w-4 h-4" />;
            statusText = `מלאי תקין (${Math.round(item.daysRemaining)} ימים)`;
        } else {
            category = 'slow';
            color = 'text-blue-500';
            bgLight = 'bg-blue-50/30';
            barColor = 'bg-blue-400';
            icon = <Droplet className="w-4 h-4" />;
            statusText = `עודף מלאי (${Math.round(item.daysRemaining)} ימים)`;
        }

        // Velocity bar width determination
        // Max velocity is generally around 10-30ml per day for a hit perfume
        const normalizedVelocity = Math.min(100, ((item.velocity || 0) / 10) * 100);

        return { ...item, category, color, bgLight, barColor, icon, statusText, normalizedVelocity };
    };

    const processedData = useMemo(() => {
        return data.map(processItem).filter(item => {
            if (item.velocity === 0 && item.stock <= 0) return false; // Ignore completely dead and zero inventory
            
            const searchMatch = (`${item.brand} ${item.model} ${item.brand_he} ${item.model_he}`).toLowerCase().includes(search.toLowerCase());
            const catMatch = selectedCategory === 'all' || item.category === selectedCategory;
            
            return searchMatch && catMatch;
        }).sort((a, b) => {
            // Sort by heat essentially (days remaining asc, handling nulls)
            const aDays = a.velocity > 0 ? a.daysRemaining : 9999;
            const bDays = b.velocity > 0 ? b.daysRemaining : 9999;
            return aDays - bDays;
        });
    }, [data, search, selectedCategory]);

    const stats = useMemo(() => {
        const p = data.map(processItem);
        return {
            hot: p.filter(i => i.category === 'hot').length,
            sold_out: p.filter(i => i.category === 'sold_out').length,
            healthy: p.filter(i => i.category === 'healthy' || i.category === 'warm').length,
            dead: p.filter(i => i.category === 'dead').length,
        };
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">טוען נתונים...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Top Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div onClick={() => setSelectedCategory(selectedCategory === 'hot' ? 'all' : 'hot')} className={`bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-lg transition-all ${selectedCategory === 'hot' ? 'border-orange-500 shadow-md ring-2 ring-orange-200' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Flame className="w-4 h-4" />
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">תכף נגמר</h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats.hot}</div>
                </div>
                
                <div onClick={() => setSelectedCategory(selectedCategory === 'sold_out' ? 'all' : 'sold_out')} className={`bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-lg transition-all ${selectedCategory === 'sold_out' ? 'border-red-500 shadow-md ring-2 ring-red-200' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">אזל לחלוטין </h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats.sold_out}</div>
                </div>

                <div onClick={() => setSelectedCategory(selectedCategory === 'healthy' ? 'all' : 'healthy')} className={`bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-lg transition-all ${selectedCategory === 'healthy' ? 'border-emerald-500 shadow-md ring-2 ring-emerald-200' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">מלאי תקין</h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats.healthy}</div>
                </div>

                <div onClick={() => setSelectedCategory(selectedCategory === 'dead' ? 'all' : 'dead')} className={`bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-lg transition-all ${selectedCategory === 'dead' ? 'border-slate-500 shadow-md ring-2 ring-slate-200' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <Skull className="w-4 h-4" />
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">מלאי מת (אפס מכר)</h3>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats.dead}</div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="חיפוש מותג או דגם..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium py-4 pr-12 pl-4 outline-none placeholder:text-gray-300"
                    />
                </div>
                {selectedCategory !== 'all' && (
                    <button 
                        onClick={() => setSelectedCategory('all')}
                        className="px-6 py-3 bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        נקה סינון
                    </button>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                    <AnimatePresence>
                        {processedData.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 font-bold">לא נמצאו תוצאות לסינון הנוכחי</div>
                        ) : (
                            processedData.map((item, index) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                                    className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 p-4 md:p-6 hover:bg-gray-50/50 transition-colors ${item.bgLight}`}
                                >
                                    {/* Left: Product Info */}
                                    <div className="flex items-center gap-4 w-full md:w-1/3 shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.model} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="opacity-20 text-xs font-bold text-gray-400 uppercase">{item.brand?.substring(0,2)}</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="font-black text-gray-900 text-sm leading-tight truncate">{item.brand}</div>
                                            <div className="text-xs text-gray-500 truncate mt-0.5">{item.model}{item.model_he ? ` (${item.model_he})` : ''}</div>
                                        </div>
                                    </div>

                                    {/* Middle: Heat Bar */}
                                    <div className="flex-1 w-full flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <div className={`flex items-center gap-1.5 ${item.color} font-black text-xs uppercase tracking-widest`}>
                                                {item.icon}
                                                <span>{item.statusText}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 tabular-nums">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">קצב (יום):</span>
                                                    <span className="text-gray-900" dir="ltr">{item.velocity?.toFixed(1)} ml</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">מלאי:</span>
                                                    <span className="text-gray-900" dir="ltr">{Math.floor(item.stock)} ml</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full h-2.5 bg-gray-100/80 rounded-full overflow-hidden relative shadow-inner">
                                            {item.velocity > 0 && (
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max(2, item.normalizedVelocity)}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`absolute left-0 top-0 bottom-0 rounded-full ${item.barColor} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Right: Quick actions / badges */}
                                    <div className="hidden md:flex items-center gap-2 shrink-0 w-24 justify-end">
                                        {item.category === 'dead' ? (
                                            <div className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">לא נמכר</div>
                                        ) : item.category === 'sold_out' ? (
                                            <div className="px-2 py-1 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">אזל</div>
                                        ) : item.category === 'hot' ? (
                                            <div className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-[9px] font-black uppercase tracking-widest">לוהט</div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
