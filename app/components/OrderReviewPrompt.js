"use client";

import { useState, useRef } from 'react';
import { Loader2, Sparkles, Star, Camera, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useLanguage } from '../context/LanguageContext';

export default function OrderReviewPrompt({ orderId, initialHasSubmitted = false, onSubmitted, reviewToken = null }) {
    const { t, dir } = useLanguage();
    const fileInputRef = useRef(null);
    const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted);
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Image handling
    const [imageUrl, setImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t('common.my_catalogs.file_too_large'));
            return;
        }

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result);
                setIsUploading(false);
                toast.success(t('common.orders.review.photo_uploaded_success') || "התמונה הועלתה בהצלחה!");
            };
            reader.onerror = () => {
                setIsUploading(false);
                toast.error(t('common.orders.review.error'));
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File reading error:', error);
            toast.error(t('common.orders.review.error'));
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        setImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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
                body: JSON.stringify({ 
                    orderId, 
                    content, 
                    rating,
                    image_url: imageUrl,
                    token: reviewToken
                })
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
        <div className="mt-2 p-6 bg-black rounded-[2.5rem] shadow-2xl transition-all border border-gray-800" dir={dir}>
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
            
            <div className="relative group mb-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('common.orders.review.placeholder')}
                    className="w-full bg-white text-black p-5 rounded-3xl text-sm min-h-[120px] outline-none transition-all placeholder:text-gray-400 font-bold focus:shadow-[0_0_20px_rgba(255,255,255,0.1)] border-2 border-transparent focus:border-white/10"
                />
            </div>
            
            {/* Image Upload UI */}
            <div className="flex flex-wrap items-center gap-4">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden" 
                />
                
                {!imageUrl ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                        {isUploading ? t('common.orders.review.uploading') : t('common.orders.review.upload_photo')}
                    </button>
                ) : (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden group shadow-lg ring-2 ring-white/10">
                        <Image 
                            src={imageUrl} 
                            alt="Preview" 
                            fill 
                            className="object-cover" 
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                )}
                
                {imageUrl && (
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        {t('common.orders.review.photo_uploaded_success') || "תמונה צורפה!"}
                    </div>
                )}
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim() || isUploading}
                className="mt-6 w-full bg-emerald-500 text-white font-black py-4 rounded-3xl text-sm transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2 uppercase tracking-tight"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.orders.review.submit')}
            </button>
        </div>
    );
}
