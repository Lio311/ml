"use client";

import { useState, useEffect } from 'react';
import { Loader2, Star, Quote, MessageSquare, Heart } from 'lucide-react';

export default function ReviewsClient() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch('/api/reviews');
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20 font-sans" dir="rtl">
            {/* Hero Section */}
            <div className="relative pt-24 pb-16 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/[0.03] to-transparent pointer-events-none" />
                <div className="container relative z-10 px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest mb-6 animate-fade-in">
                            <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
                            ביקורת לקוחות
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-black mb-6 tracking-tight leading-tight">
                            החוויות שלכם עם <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-gray-700 to-black">ml_tlv</span>
                        </h1>
                        <p className="text-gray-500 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto">
                            אנחנו גאים לחלוק את המשוב שלכם. כל ביקורת עוזרת לנו להשתפר ולהמשיך להביא לכם את הריחות הכי יוקרתיים שיש.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="container px-4 mb-16">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-black text-black mb-1">{reviews.length}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ביקורות מאומתות</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-black text-black mb-1">4.9/5</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">דירוג ממוצע</div>
                    </div>
                    <div className="hidden md:block bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-black text-black mb-1">100%</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">שביעות רצון</div>
                    </div>
                </div>
            </div>

            {/* Masonry-style Grid */}
            <div className="container px-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                        <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400">עדיין אין ביקורות להצגה. בקרוב!</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {reviews.map((review, idx) => (
                            <div 
                                key={review.id} 
                                className="break-inside-avoid bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative"
                            >
                                <Quote className="absolute top-6 left-6 w-8 h-8 text-black opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />
                                
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {review.user_image ? (
                                            <img src={review.user_image} alt={review.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-sm">
                                                {review.user_name?.[0] || 'L'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm text-black group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                            {review.user_name}
                                        </h3>
                                        <div className="flex items-center gap-0.5 mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    className={`w-2.5 h-2.5 ${i < (review.rating || 5) ? 'fill-yellow-400 stroke-yellow-400' : 'fill-gray-200 stroke-gray-200'}`} 
                                                />
                                            ))}
                                            <span className="text-[9px] text-gray-400 mr-2 font-medium">לקוח/ה מאומת/ת</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium italic">
                                    "{review.content}"
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    <span>
                                        {new Date(review.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-1 group/heart cursor-pointer">
                                        <Heart className="w-3 h-3 group-hover/heart:fill-red-500 group-hover/heart:stroke-red-500 transition-all" />
                                        <span>אהבתי</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <div className="container px-4 mt-24">
                <div className="bg-black rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">רוצים להופיע כאן?</h2>
                        <p className="text-gray-400 text-sm md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                            הזמינו דוגמית בושם עוד היום, ותוכלו להשאיר ביקורת לאחר קבלת המשלוח. אנחנו מחכים לשמוע מכם!
                        </p>
                        <a 
                            href="/catalog" 
                            className="inline-flex items-center justify-center px-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-xl"
                        >
                            לקטלוג הבשמים
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
