"use client";

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import FadeIn from './FadeIn';

export default function HomeSEOContent() {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';

    return (
        <section className="pt-4 pb-4 md:pt-8 md:pb-6 bg-stone-50/50 border-t border-gray-100 overflow-hidden" dir={dir}>
            <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    {/* Premium Header */}
                    <div className={`mb-8 text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                        <span className="text-[13px] md:text-xs uppercase tracking-[0.3em] text-gray-400 font-bold mb-4 block">{t('homepage.seo_guide_badge') || 'Premium Fragrance Guide'}</span>
                        <h2 className="text-[clamp(22px,6vw,38px)] lg:text-[36.5px] font-serif font-black text-gray-900 mb-4 leading-tight whitespace-normal md:whitespace-nowrap">
                            {t('common.seo_title')}
                        </h2>
                        <div className={`w-20 h-1.5 bg-black rounded-full mx-auto ${isRTL ? 'md:mx-0' : 'md:ml-0'}`}></div>
                    </div>

                    {/* Content Blocks - Two Columns on Desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 text-gray-700 leading-relaxed text-justify font-light text-lg">
                        <div className="space-y-6">
                            <FadeIn delay={0.1}>
                                <p className="direct-answer-paragraph" dangerouslySetInnerHTML={{ __html: t('common.seo_p1') }} />
                            </FadeIn>
                            <FadeIn delay={0.2}>
                                <p dangerouslySetInnerHTML={{ __html: t('common.seo_p2') }} />
                            </FadeIn>
                            <FadeIn delay={0.3}>
                                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-serif font-bold text-gray-900">{t('common.seo_why_samples')}</h3>
                                    <p className="text-base text-gray-600" dangerouslySetInnerHTML={{ __html: t('common.seo_why_samples_desc') }} />
                                </div>
                            </FadeIn>
                        </div>

                        <div className="space-y-6">
                            <FadeIn delay={0.4}>
                                <p dangerouslySetInnerHTML={{ __html: t('common.seo_p3') }} />
                            </FadeIn>
                            <FadeIn delay={0.5}>
                                <h3 className="text-2xl font-serif font-bold text-gray-900 pt-4">{t('common.seo_niche_title')}</h3>
                                <p dangerouslySetInnerHTML={{ __html: t('common.seo_p4') }} />
                            </FadeIn>
                            <FadeIn delay={0.6}>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Xerjoff • Roja Parfums • Amouage • Creed • Louis Vuitton • Bvlgari • Tom Ford • Maison Francis Kurkdjian • Byredo • Le Labo • Diptyque • Penhaligon's
                                </p>
                            </FadeIn>
                            <FadeIn delay={0.7}>
                                <p dangerouslySetInnerHTML={{ __html: t('common.seo_p5') }} />
                            </FadeIn>
                        </div>
                    </div>

                    {/* Bottom Section - Dark Box */}
                    <FadeIn delay={0.2} direction="up" distance={60}>
                        <div className="mt-20 space-y-16">
                            <div className="p-10 md:p-16 bg-black text-white rounded-[3rem] border border-zinc-900 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>

                                <h3 className={`text-3xl font-serif font-black text-white mb-8 relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('common.seo_experience_title')}
                               </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                    <p className="text-gray-300 text-lg font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: t('common.seo_experience_p1') }} />
                                    <p className="text-gray-400 text-lg font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: t('common.seo_experience_p2') }} />
                                </div>

                                <div className={`mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10`}>
                                    <p className={`text-xl font-bold text-white text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`} dangerouslySetInnerHTML={{ __html: t('common.seo_cta') }} />
                                    <Link href="/catalog" className="px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest hover:bg-gray-200 transition shadow-lg whitespace-nowrap">
                                        {t('common.shop_collection')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}
