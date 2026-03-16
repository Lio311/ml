"use client";

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderReviewPrompt({ orderId, initialHasSubmitted = false, onSubmitted }) {
    const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("אנא כתבו משהו לפני השליחה");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, content })
            });

            if (res.ok) {
                setHasSubmitted(true);
                toast.success("תודה על הביקורת! היא תפורסם לאחר אישור מנהל.");
                if (onSubmitted) onSubmitted();
            } else {
                toast.error("שגיאה בשליחת הביקורת");
            }
        } catch (error) {
            toast.error("שגיאה בשליחת הביקורת");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (hasSubmitted) return null;

    return (
        <div className="mt-4 p-6 bg-black rounded-2xl shadow-xl transition-all border border-gray-800" dir="rtl">
            <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                נשמח שתכתבו לנו איך הייתה חווית ההזמנה ואם אהבתם את הבשמים!
            </h3>
            
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="כתבו כאן את החוויה שלכם..."
                className="w-full bg-white text-black p-4 rounded-xl text-sm min-h-[100px] outline-none transition-all placeholder:text-gray-400 font-medium"
            />
            
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="mt-4 w-full bg-white text-black font-black py-3 rounded-xl text-sm transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלח ביקורת"}
            </button>
        </div>
    );
}
