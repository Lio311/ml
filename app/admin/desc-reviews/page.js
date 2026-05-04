"use client";

import { useState, useEffect } from "react";
import { Wand2, Star, AlertTriangle, CheckCircle2, TrendingUp, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function DescReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ total_with_desc: 0, total_reviewed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [filter, setFilter] = useState('all'); // all, low, medium, high
    const [isSettingUp, setIsSettingUp] = useState(false);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/admin/desc-review/list');
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
                setStats(data.stats || { total_with_desc: 0, total_reviewed: 0 });
            } else {
                // Table might not exist yet
                setReviews([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleSetup = async () => {
        setIsSettingUp(true);
        try {
            const res = await fetch('/api/admin/desc-review/setup', { method: 'POST' });
            if (res.ok) {
                toast.success("טבלה נוצרה בהצלחה!");
            } else {
                const data = await res.json();
                toast.error(data.error || "שגיאה ביצירת הטבלה");
            }
        } catch (e) {
            toast.error("שגיאה בתקשורת");
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        toast.loading("הבוט סוקר תיאורי מוצרים... זה עשוי לקחת כמה דקות", { id: 'review-bot' });
        try {
            const res = await fetch('/api/admin/desc-review/run', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast.success(`סקירה הושלמה! ${data.reviewed} תיאורים נסקרו`, { id: 'review-bot' });
                fetchReviews();
            } else {
                toast.error(data.error || "שגיאה בהרצת הבוט", { id: 'review-bot' });
            }
        } catch (e) {
            toast.error("שגיאה בתקשורת", { id: 'review-bot' });
        } finally {
            setIsRunning(false);
        }
    };

    const getRatingColor = (rating) => {
        if (rating >= 8) return 'text-green-600 bg-green-50 border-green-200';
        if (rating >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        if (rating >= 4) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getRatingBadge = (rating) => {
        if (rating >= 8) return { label: 'מעולה', icon: CheckCircle2, color: 'bg-green-100 text-green-700' };
        if (rating >= 6) return { label: 'טוב', icon: TrendingUp, color: 'bg-yellow-100 text-yellow-700' };
        if (rating >= 4) return { label: 'בינוני', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' };
        return { label: 'דורש שיפור', icon: AlertTriangle, color: 'bg-red-100 text-red-700' };
    };

    const filteredReviews = reviews.filter(r => {
        if (filter === 'low') return r.rating <= 4;
        if (filter === 'medium') return r.rating >= 5 && r.rating <= 7;
        if (filter === 'high') return r.rating >= 8;
        return true;
    });

    const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    const lowCount = reviews.filter(r => r.rating <= 4).length;
    const mediumCount = reviews.filter(r => r.rating >= 5 && r.rating <= 7).length;
    const highCount = reviews.filter(r => r.rating >= 8).length;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">סקירת תיאורי מוצרים</h1>
                    <p className="text-sm text-gray-500 mt-1">בוט AI שמדרג את תיאורי המוצרים ומציע שיפורים</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSetup}
                        disabled={isSettingUp}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                    >
                        {isSettingUp ? 'מגדיר...' : 'הגדר טבלה'}
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
                    >
                        <span>{isRunning ? 'סוקר...' : 'הרץ סקירה'}</span>
                        <Wand2 className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-3xl font-black text-gray-900">{stats.total_reviewed || 0}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">תיאורים שנסקרו</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-3xl font-black text-blue-600">{avgRating}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">ממוצע דירוג</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-3xl font-black text-green-600">{highCount}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">מעולים (8+)</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-3xl font-black text-red-600">{lowCount}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">דורשים שיפור (≤4)</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 mb-4">
                {[
                    { key: 'all', label: `הכל (${reviews.length})` },
                    { key: 'low', label: `דורש שיפור (${lowCount})`, color: 'text-red-600' },
                    { key: 'medium', label: `טוב (${mediumCount})`, color: 'text-yellow-600' },
                    { key: 'high', label: `מעולה (${highCount})`, color: 'text-green-600' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                            filter === f.key 
                                ? 'bg-black text-white border-black' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Results List */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>טוען נתונים...</p>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-gray-400 text-lg font-bold mb-2">
                        {reviews.length === 0 ? 'אין סקירות עדיין' : 'אין תוצאות לפילטר הנבחר'}
                    </p>
                    {reviews.length === 0 && (
                        <p className="text-sm text-gray-400">לחץ על "הגדר טבלה" ואז "הרץ סקירה" כדי להתחיל</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredReviews.map((review) => {
                        const badge = getRatingBadge(review.rating);
                        const isExpanded = expandedId === review.id;
                        const BadgeIcon = badge.icon;
                        
                        return (
                            <div 
                                key={review.id} 
                                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${getRatingColor(review.rating)}`}
                            >
                                <div 
                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : review.id)}
                                >
                                    {/* Rating Circle */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${getRatingColor(review.rating)}`}>
                                        {review.rating}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-black text-gray-900 text-sm">{review.brand}</span>
                                            <span className="text-gray-400">·</span>
                                            <span className="font-bold text-gray-700 text-sm">{review.model}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{review.description}</p>
                                    </div>

                                    {/* Badge + Chevron */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 ${badge.color}`}>
                                            <BadgeIcon className="w-3 h-3" />
                                            {badge.label}
                                        </span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">תיאור נוכחי</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{review.description}</p>
                                        </div>
                                        
                                        {review.strengths && (
                                            <div className="bg-green-50 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> חוזקות
                                                </p>
                                                <p className="text-sm text-green-800 leading-relaxed">{review.strengths}</p>
                                            </div>
                                        )}

                                        {review.suggestions && (
                                            <div className="bg-amber-50 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> הצעות לשיפור
                                                </p>
                                                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{review.suggestions}</p>
                                            </div>
                                        )}

                                        <p className="text-[10px] text-gray-400 text-left" dir="ltr">
                                            Reviewed: {new Date(review.reviewed_at).toLocaleDateString('he-IL')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
