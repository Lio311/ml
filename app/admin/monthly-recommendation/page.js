"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Check, AlertCircle, Save, Send, Calendar, CheckCircle2 } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function MonthlyRecommendationAdmin() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPerfumes, setSelectedPerfumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("pending");

    useEffect(() => {
        fetchRecommendation();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchProducts();
            } else if (searchTerm.length === 0) {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchRecommendation = async () => {
        try {
            const res = await fetch('/api/admin/monthly-recommendation');
            const data = await res.json();
            if (res.ok && data.recommendation) {
                setStatus(data.recommendation.status);
                if (data.products && data.products.length > 0) {
                    setSelectedPerfumes(data.products);
                }
            }
        } catch (error) {
            toast.error("שגיאה בטעינת נתונים");
        } finally {
            setLoading(false);
        }
    };

    const searchProducts = async () => {
        try {
            const res = await fetch(`/api/products?q=${encodeURIComponent(searchTerm)}`);
            const data = await res.json();
            if (res.ok && data.products) {
                setSearchResults(data.products);
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    const togglePerfume = (perfume) => {
        const isSelected = selectedPerfumes.some(p => p.id === perfume.id);
        if (isSelected) {
            setSelectedPerfumes(prev => prev.filter(p => p.id !== perfume.id));
        } else {
            if (selectedPerfumes.length >= 4) {
                toast.error("ניתן לבחור עד 4 בשמים בלבד");
                return;
            }
            setSelectedPerfumes(prev => [...prev, perfume]);
        }
    };

    const handleSave = async (action = 'save') => {
        if (selectedPerfumes.length === 0) {
            toast.error("אנא בחר לפחות בושם אחד");
            return;
        }
        if (action === 'save_and_send' && selectedPerfumes.length !== 4) {
             toast.error("מומלץ לבחור 4 בשמים לשליחה אידיאלית");
             // Optionally allow or block. Let's allow but warn.
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/monthly-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    perfumeIds: selectedPerfumes.map(p => p.id),
                    action
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(action === 'save_and_send' ? "הבחירה נשמרה והוגדרה לשליחה ללקוחות" : "הבחירה נשמרה בהצלחה");
                setStatus(data.recommendation.status);
            } else {
                toast.error(data.error || "שגיאה בשמירה");
            }
        } catch (error) {
            toast.error("שגיאה בתקשורת");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
            <Toaster position="top-center" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Calendar className="text-blue-500" size={24} />
                        המלצת החודש של מנהל האתר
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">בחר 4 בשמים שיומלצו בחודש הנוכחי. ההמלצה תישלח ללקוחות ב-30 לחודש.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${status === 'selected' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {status === 'selected' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {status === 'selected' ? 'אושר לשליחה' : 'טרם אושר'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Search & Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="relative mb-6">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="חפש בושם לפי שם או מותג..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-12 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all outline-none"
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                {searchResults.slice(0, 6).map((perfume) => {
                                    const isSelected = selectedPerfumes.some(p => p.id === perfume.id);
                                    return (
                                        <div 
                                            key={perfume.id}
                                            onClick={() => togglePerfume(perfume)}
                                            className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}
                                        >
                                            <div className="aspect-square relative bg-gray-50">
                                                {perfume.image_url ? (
                                                    <Image src={perfume.image_url} alt={perfume.name} fill className="object-contain p-2" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Image size={32} /></div>
                                                )}
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-10 animate-in zoom-in">
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`p-3 text-center ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
                                                <p className="text-xs text-gray-500 font-medium mb-1 line-clamp-1">{perfume.brand}</p>
                                                <p className="text-sm font-bold text-gray-900 line-clamp-1">{perfume.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {searchTerm.length >= 2 && searchResults.length === 0 && (
                            <div className="text-center py-8 text-gray-400">לא נמצאו תוצאות לחיפוש זה.</div>
                        )}
                    </div>
                </div>

                {/* Selected Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-[#050505] text-white p-6 rounded-2xl shadow-xl sticky top-24">
                        <h2 className="text-xl font-black mb-2 tracking-tight">הבחירה שלך</h2>
                        <p className="text-gray-400 text-sm mb-6" dir="rtl">נבחרו {selectedPerfumes.length} מתוך 4</p>

                        <div className="space-y-3 mb-8">
                            {selectedPerfumes.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-xl">
                                    <p className="text-gray-500 text-sm">טרם נבחרו בשמים</p>
                                </div>
                            ) : (
                                selectedPerfumes.map((perfume, idx) => (
                                    <div key={perfume.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                                        <div className="w-12 h-12 relative bg-white rounded-lg flex-shrink-0">
                                            {perfume.image_url && <Image src={perfume.image_url} alt={perfume.name} fill className="object-contain p-1" unoptimized />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-blue-400 font-medium mb-0.5 line-clamp-1">{perfume.brand}</p>
                                            <p className="text-sm font-bold truncate">{perfume.name}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); togglePerfume(perfume); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={() => handleSave('save')}
                                disabled={saving}
                                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                שמור כטיוטה
                                <Save size={18} />
                            </button>
                            <button 
                                onClick={() => handleSave('save_and_send')}
                                disabled={saving || selectedPerfumes.length === 0}
                                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                אשר בחירה סופית
                                <Send size={18} />
                            </button>
                            <p className="text-[11px] text-gray-500 text-center mt-4">
                                לחיצה על אישור תקבע את הבשמים אלו. המייל יישלח אוטומטית למנויים בתאריך 30 לחודש (או 28 בפברואר).
                            </p>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
