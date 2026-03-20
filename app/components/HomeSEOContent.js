"use client";

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function HomeSEOContent() {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';

    return (
        <section className="pt-20 pb-0 bg-stone-50/50 border-t border-gray-100 overflow-hidden" dir={dir}>
            <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    {/* Premium Header */}
                    <div className={`mb-16 text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                        <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold mb-3 block">Premium Fragrance Guide</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-black text-gray-900 mb-6 leading-[1.1]">
                            {t('common.seo_title')}
                        </h2>
                        <div className={`w-20 h-1.5 bg-black rounded-full mx-auto ${isRTL ? 'md:mx-0' : 'md:ml-0'}`}></div>
                    </div>

                    {/* Content Blocks - Two Columns on Desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 text-gray-700 leading-relaxed text-justify font-light text-lg">
                        <div className="space-y-6">
                            <p>{t('common.seo_p1')}</p>
                            <p>{t('common.seo_p2')}</p>
                            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                                <h3 className="text-xl font-serif font-bold text-gray-900">{t('common.seo_why_samples')}</h3>
                                <p className="text-base text-gray-600">{t('common.seo_why_samples_desc')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p>{t('common.seo_p3')}</p>
                            <h3 className="text-2xl font-serif font-bold text-gray-900 pt-4">{t('common.seo_niche_title')}</h3>
                            <p>{t('common.seo_p4')}</p>
                            <p>{t('common.seo_p5')}</p>
                        </div>
                    </div>

                    {/* Bottom Section - Dark Box */}
                    <div className="mt-20 space-y-16">
                        <div className="p-10 md:p-16 bg-black text-white rounded-[3rem] border border-zinc-900 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>

                            <h3 className={`text-3xl font-serif font-black text-white mb-8 relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('common.seo_experience_title')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <p className="text-gray-300 text-lg font-light leading-relaxed">{t('common.seo_experience_p1')}</p>
                                <p className="text-gray-400 text-lg font-light leading-relaxed">{t('common.seo_experience_p2')}</p>
                            </div>

                            <div className={`mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10`}>
                                <p className={`text-xl font-bold text-white text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                                    {t('common.seo_cta')}
                                </p>
                                <Link href="/catalog" className="px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest hover:bg-gray-200 transition shadow-lg whitespace-nowrap">
                                    {t('common.shop_collection')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Flush bottom spacer */}
            <div className="h-10 w-full pointer-events-none"></div>
        </section>
    );
}
