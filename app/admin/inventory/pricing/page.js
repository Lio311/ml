"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, History, Filter, DollarSign, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomDropdown from '../../../components/ui/CustomDropdown';

export default function SmartPricingPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [filterType, setFilterType] = useState('all');
    const [brand, setBrand] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedSizes, setSelectedSizes] = useState(['2ml', '5ml', '10ml']);
    const [page, setPage] = useState(1);
    const LOGS_PER_PAGE = 10;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/bulk-pricing');
            const data = await res.json();
            if (data.logs) setLogs(data.logs);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount)) {
            toast.error('נא להזין סכום תקין');
            return;
        }
        if (selectedSizes.length === 0) {
            toast.error('נא לבחור לפחות גודל אחד');
            return;
        }

        const confirmText = `האם אתה בטוח שברצונך ${Number(amount) > 0 ? 'להוסיף' : 'להפחית'} ${Math.abs(amount)} ש"ח לכל המוצרים המסומנים?`;
        
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-in fade-in zoom-in-95 duration-300' : 'animate-out fade-out zoom-out-95 duration-300'} flex flex-col gap-4 p-6 min-w-[320px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto`} dir="rtl">
                <div className="flex items-center gap-3 mb-1">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                        <History className="w-5 h-5" />
                    </div>
                    <p className="font-black text-gray-900 text-sm">אישור פעולה</p>
                </div>
                <p className="font-bold text-gray-600 text-xs leading-relaxed">{confirmText}</p>
                <div className="flex justify-end gap-3 mt-2">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                    >
                        ביטול
                    </button>
                    <button 
                        onClick={async () => { 
                            toast.dismiss(t.id);
                            executeApply();
                        }}
                        className="flex-1 px-4 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95"
                    >
                        כן, בצע
                    </button>
                </div>
            </div>
        ), { duration: 8000, position: 'top-center' });
    };

    const executeApply = async () => {
        setSubmitting(true);
        const loadingToast = toast.loading('מעדכן מחירים...');
        try {
            const res = await fetch('/api/admin/bulk-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filterType,
                    brand,
                    amount: Number(amount),
                    sizes: selectedSizes.map(s => s.replace('ml', ''))
                })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.count === 0) {
                    toast.error('הפעולה הסתיימה אך לא עודכנו מוצרים. וודא שבחרת גדלים שיש להם מחיר מוגדר במוצרים המסוננים.', { duration: 6000 });
                } else {
                    toast.success(`התמחור עודכן בהצלחה עבור ${data.count} מוצרים!`);
                    setAmount('');
                    fetchLogs();
                }
            } else {
                toast.error(data.error || 'שגיאה בעדכון התמחור');
            }
        } catch (error) {
            toast.error('שגיאה בתקשורת');
        } finally {
            toast.dismiss(loadingToast);
            setSubmitting(false);
        }
    };

    const handleUndo = async (id) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-in fade-in zoom-in-95 duration-300' : 'animate-out fade-out zoom-out-95 duration-300'} flex flex-col gap-4 p-6 min-w-[320px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto`} dir="rtl">
                <div className="flex items-center gap-3 mb-1">
                    <div className="bg-red-50 text-red-600 p-2 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <p className="font-black text-gray-900 text-sm">ביטול פעולה</p>
                </div>
                <p className="font-bold text-gray-600 text-xs leading-relaxed">
                    האם אתה בטוח שברצונך לבטל פעולה זו? המחירים יחזרו למצבם הקודם.
                </p>
                <div className="flex justify-end gap-3 mt-2">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                    >
                        חזור
                    </button>
                    <button 
                        onClick={async () => { 
                            toast.dismiss(t.id);
                            executeUndo(id);
                        }}
                        className="flex-1 px-4 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95"
                    >
                        כן, בטל
                    </button>
                </div>
            </div>
        ), { duration: 8000, position: 'top-center' });
    };

    const executeUndo = async (id) => {

        const loadingToast = toast.loading('מבטל פעולה...');
        try {
            const res = await fetch('/api/admin/bulk-pricing', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                toast.success('הפעולה בוטלה והמחירים שוחזרו!');
                fetchLogs();
            } else {
                toast.error('שגיאה בביטול הפעולה');
            }
        } catch (error) {
            toast.error('שגיאה בתקשורת');
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => 
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const FILTER_OPTIONS = [
        { value: 'all', label: 'כל המוצרים' },
        { value: 'on_sale', label: 'מוצרים שבמבצע בלבד' },
        { value: 'not_on_sale', label: 'מוצרים ללא מבצע בלבד' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 text-right font-sans" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                        תמחור חכם וגורף
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">ניהול מחירים מהיר ומדויק לכל האתר</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                
                {/* Form Section */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50/50">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-gray-800">
                            <Filter className="w-5 h-5 text-blue-600" />
                            הגדרות תמחור
                        </h2>

                        <form onSubmit={handleApply} className="space-y-6">
                            {/* Filter Type */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ps-1">קהל יעד</label>
                                <CustomDropdown
                                    options={FILTER_OPTIONS}
                                    value={filterType}
                                    onChange={setFilterType}
                                    fullWidth
                                    className="!bg-gray-50 !border-gray-100 !rounded-2xl h-12"
                                />
                            </div>

                            {/* Brand Filter */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ps-1">סינון לפי מותג (אופציונלי)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        placeholder="לדוגמה: Xerjoff"
                                        className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl p-3 pr-10 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Sizes Selection */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ps-1">בחירת גדלים</label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {['2ml', '5ml', '10ml'].map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => toggleSize(size)}
                                            className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${
                                                selectedSizes.includes(size)
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                            }`}
                                        >
                                            {size === '2ml' ? '2 מ"ל' : size === '5ml' ? '5 מ"ל' : '10 מ"ל'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ps-1">תוספת/הפחתה במחיר (ש"ח נטו)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="לדוגמה: 5 או -5"
                                        className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl p-4 pr-12 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-black text-2xl"
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xl text-gray-400">₪</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium ps-1">המחיר החדש יחושב נטו. מחיר הבסיס יגדל בהתאם להנחה הקיימת.</p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black shadow-xl shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        מעדכן מחירים...
                                    </>
                                ) : (
                                    <>
                                        עדכן תמחור עכשיו
                                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Section */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50/50 flex-1 flex flex-col min-h-[500px]">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-gray-800">
                            <History className="w-5 h-5 text-gray-400" />
                            תיעוד פעולות תמחור
                        </h2>

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                <p className="font-bold italic">טוען היסטוריה...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-300">
                                <History className="w-16 h-16 opacity-20" />
                                <p className="font-bold italic">לא נמצאו פעולות תמחור קודמות</p>
                            </div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar pb-4 pr-1">
                                {logs.slice((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE).map((log) => (
                                    <div 
                                        key={log.id} 
                                        className={`p-5 rounded-3xl border-2 transition-all ${
                                            log.undone 
                                            ? 'bg-gray-50 border-gray-100 grayscale opacity-60' 
                                            : 'bg-white border-blue-50 hover:border-blue-100 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        log.undone ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {log.undone ? 'בוטל' : 'בוצע'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        {new Date(log.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-gray-900 flex items-center gap-1.5" dir="rtl">
                                                    {log.undone ? 'בוטל: ' : ''} 
                                                    <span className="flex items-center gap-1" dir="ltr">
                                                        <span>₪ {Number(log.amount) > 0 ? '+' : ''}{Math.abs(log.amount)}</span>
                                                    </span>
                                                    <span className="text-gray-400 text-xs font-bold mr-2">
                                                        ({log.sizes.map(s => s + 'ml').join(', ')})
                                                    </span>
                                                </h3>
                                            </div>
                                            
                                            {!log.undone && (
                                                <button
                                                    onClick={() => handleUndo(log.id)}
                                                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                    title="בטל פעולה"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <div className="bg-gray-50 px-3 py-1 rounded-xl border border-gray-100 flex items-center gap-1.5">
                                                <Filter className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-500">
                                                    {log.filter_type === 'all' ? 'כל המוצרים' : log.filter_type === 'on_sale' ? 'מבצע' : 'ללא מבצע'}
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 px-3 py-1 rounded-xl border border-gray-100 flex items-center gap-1.5">
                                                <Store className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-500">{log.brand}</span>
                                            </div>
                                            <div className="bg-gray-50 px-3 py-1 rounded-xl border border-gray-100 flex items-center gap-1.5">
                                                <CheckCircle className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-500">{log.affected_count} מוצרים</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {Math.ceil(logs.length / LOGS_PER_PAGE) > 1 && (
                            <div className="flex justify-center items-center gap-3 mt-auto pt-6 border-t border-gray-50">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-gray-600"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                                    {page} / {Math.ceil(logs.length / LOGS_PER_PAGE)}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(Math.ceil(logs.length / LOGS_PER_PAGE), p + 1))}
                                    disabled={page === Math.ceil(logs.length / LOGS_PER_PAGE)}
                                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-gray-600"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Store({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V10.5m0 10.5h9m-9 0H3m10.5 0h3m-3-10.5H3m10.5 0V3m0 7.5h9" />
        </svg>
    );
}
