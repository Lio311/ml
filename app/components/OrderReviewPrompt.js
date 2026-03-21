"use client";

import { useState } from 'react';
import { Loader2, Sparkles, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function OrderReviewPrompt({ orderId, initialHasSubmitted = false, onSubmitted }) {
    const { t, dir } = useLanguage();
    const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted);
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error(t('common.orders.review.empty_error'));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, content, rating })
            });

            if (res.ok) {
                setHasSubmitted(true);
                toast.success(t('common.orders.review.success'));
                if (onSubmitted) onSubmitted();
            } else {
                toast.error(t('common.orders.review.error'));
            }
        } catch (error) {
            toast.error(t('common.orders.review.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (hasSubmitted) return null;

    return (
        <div className="mt-4 p-6 bg-black rounded-[2.5rem] shadow-2xl transition-all border border-gray-800" dir={dir}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    {t('common.orders.review.prompt')}
                </h3>
                
                {/* Star Rating Selector */}
                <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform active:scale-90"
                        >
                            <Star 
                                className={`w-6 h-6 ${
                                    (hoverRating || rating) >= star 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'text-gray-600'
                                } transition-colors duration-200`}
                            />
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="relative group">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('common.orders.review.placeholder')}
                    className="w-full bg-white text-black p-5 rounded-3xl text-sm min-h-[120px] outline-none transition-all placeholder:text-gray-400 font-bold focus:shadow-[0_0_20px_rgba(255,255,255,0.1)] border-2 border-transparent focus:border-white/10"
                />
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="mt-6 w-full bg-emerald-500 text-white font-black py-4 rounded-3xl text-sm transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2 uppercase tracking-tight"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.orders.review.submit')}
            </button>
        </div>
    );
}
