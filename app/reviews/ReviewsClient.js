"use client";

import { useState, useMemo } from 'react';
import { Star, Quote, MessageSquare, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ReviewsClient({ initialReviews = [] }) {
    const [reviews] = useState(initialReviews);
    const { t, dir } = useLanguage();

    const stats = useMemo(() => {
        const total = reviews.length;
        if (total === 0) return { avg: 0, count: 0, satisfaction: 0 };

        const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
        const avg = (sum / total).toFixed(1);
        const satisfaction = Math.round((reviews.filter(r => (r.rating || 5) >= 4).length / total) * 100);

        return { avg, count: total, satisfaction };
    }, [reviews]);

    return (
        <div className="min-h-screen bg-[#fafafa] py-16 px-4 md:px-8" dir={dir}>
            {/* Header Section */}
            <div className="max-w-6xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {t('common.customer_reviews_badge')}
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-black mb-6 tracking-tighter">
                    {t('common.reviews_heading')}
                </h1>

                <p className="w-full text-gray-500 text-sm md:text-base leading-relaxed font-medium">
                    {t('common.reviews_subheading')}
                </p>
            </div>

            {/* Stats Section */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                {[
                    { label: t('common.average_rating'), value: `${stats.avg}/5`, icon: Star },
                    { label: t('common.verified_reviews'), value: stats.count.toString(), icon: MessageSquare }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center group">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <stat.icon className={`w-6 h-6 ${i === 1 ? 'text-amber-400 fill-amber-400' : 'text-black'}`} />
                        </div>
                        <div className="text-4xl font-black text-black mb-1">{stat.value}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Reviews Grid */}
            <div className="max-w-6xl mx-auto">
                {reviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">{t('common.no_reviews_yet')}</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="break-inside-avoid bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative"
                            >
                                <Quote className="absolute top-6 left-6 w-8 h-8 text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Rating Stars */}
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={`w-4 h-4 ${s <= (review.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>

                                <p className={`text-gray-800 text-sm md:text-base leading-relaxed mb-8 font-medium italic relative z-10 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    "{review.content}"
                                </p>

                                <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-inner">
                                        {review.user_image ? (
                                            <img src={review.user_image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-lg">
                                                {review.user_name?.[0] || 'L'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-black text-sm text-black uppercase tracking-tight">
                                            {review.user_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">
                                            <Sparkles className="w-3 h-3" />
                                            {t('common.verified_buyer')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Call to Action */}
            <div className="max-w-6xl mx-auto mt-20 text-center">
                <div className="p-12 bg-black rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <h2 className="text-3xl font-black mb-4 relative z-10">{t('common.reviews_cta_title')}</h2>
                    <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto relative z-10">
                        {t('common.reviews_cta_desc')}
                    </p>
                    <div className="flex justify-center gap-4 relative z-10">
                        <div className="flex -space-x-3 rtl:space-x-reverse">
                            {reviews.slice(0, 5).map((r, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                                    {r.user_image ? <img src={r.user_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">L</div>}
                                </div>
                            ))}
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold">{stats.count}+ {t('common.happy_customers')}</div>
                            <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
