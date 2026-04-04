"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Eye, EyeOff, Trash2, Loader2, MessageSquare, ExternalLink, Calendar, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviewsClient({ initialReviews = [] }) {
    const [reviews, setReviews] = useState(initialReviews);
    const [isProcessing, setIsProcessing] = useState(null); // ID of review being processed

    const toggleVisibility = async (reviewId, currentStatus) => {
        setIsProcessing(reviewId);
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, isPublic: !currentStatus })
            });

            if (res.ok) {
                setReviews(prev => prev.map(r => 
                    r.id === reviewId ? { ...r, is_public: !currentStatus } : r
                ));
                toast.success(!currentStatus ? "הביקורת מוצגת כעת" : "הביקורת הוסתרה");
            } else {
                toast.error("שגיאה בעדכון הביקורת");
            }
        } catch (err) {
            toast.error("שגיאה בעדכון הביקורת");
        } finally {
            setIsProcessing(null);
        }
    };

    const deleteReview = async (reviewId) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק ביקורת זו לצמיתות?")) return;
        
        setIsProcessing(reviewId);
        try {
            const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== reviewId));
                toast.success("הביקורת נמחקה");
            } else {
                toast.error("שגיאה במחיקת הביקורת");
            }
        } catch (err) {
            toast.error("שגיאה במחיקת הביקורת");
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
                        <Star className="w-6 h-6 fill-black" />
                        ניהול ביקורות גולשים
                    </h1>
                    <p className="text-gray-500 text-sm">נהל את הביקורות שמופיעות באתר. תוכל להסתיר או למחוק ביקורות לפי הצורך.</p>
                </div>
                <div className="text-center bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-black">{reviews.length}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">סה״כ ביקורות</div>
                </div>
            </div>

            {reviews.length === 0 ? (
                <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">עדיין אין ביקורות במערכת.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reviews.map((review) => (
                        <div 
                            key={review.id} 
                            className={`bg-white p-6 rounded-[2rem] border transition-all duration-300 ${!review.is_public ? 'opacity-70 border-gray-200 bg-gray-50/50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
                        >
                            <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                {/* User Info */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shadow-inner relative">
                                        {review.user_image ? (
                                            <Image 
                                                src={review.user_image} 
                                                alt="" 
                                                fill 
                                                className="object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-sm">
                                                {review.user_name?.[0] || 'L'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm text-black uppercase tracking-tight truncate max-w-[150px]">
                                            {review.user_name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(review.created_at).toLocaleDateString('he-IL')}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    {review.image_url && (
                                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden mb-3 border border-gray-100 shadow-sm">
                                            <Image 
                                                src={review.image_url} 
                                                alt="Review" 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                    )}
                                    <p className="text-gray-700 text-sm leading-relaxed italic line-clamp-2 md:line-clamp-none">
                                        "{review.content}"
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star 
                                                key={s} 
                                                className={`w-3 h-3 ${s <= (review.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-500 flex items-center gap-1">
                                            הזמנה #{review.order_id}
                                        </div>
                                        {!review.is_public && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">מוסתר מהאתר</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 md:border-r md:pr-6 border-gray-100">
                                    <button
                                        onClick={() => toggleVisibility(review.id, review.is_public)}
                                        disabled={isProcessing === review.id}
                                        className={`p-3 rounded-2xl transition-all ${review.is_public ? 'bg-gray-100 text-gray-500 hover:bg-black hover:text-white' : 'bg-black text-white hover:bg-gray-800'} shadow-sm`}
                                        title={review.is_public ? "הסתר ביקורת" : "הצג ביקורת"}
                                    >
                                        {isProcessing === review.id ? <Loader2 className="w-5 h-5 animate-spin" /> : review.is_public ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => deleteReview(review.id)}
                                        disabled={isProcessing === review.id}
                                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                        title="מחק ביקורת"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
