"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from './context/LanguageContext';

export default function NotFound() {
    const { t } = useLanguage();

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-assistant bg-black">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/404-bg.png" 
                    alt="Luxury Perfume" 
                    fill 
                    className="object-cover opacity-90"
                    priority
                    quality={100}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            </div>

            {/* Glassmorphic Content Card */}
            <div className="relative z-10 w-full max-w-2xl mx-4 p-6 md:p-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-center text-white">
                <div className="mb-4 inline-block">
                    <span className="text-xs tracking-[0.4em] uppercase opacity-60 mb-1 block">{t('not_found.error_code')}</span>
                    <h1 className="text-6xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30 drop-shadow-lg">
                        404
                    </h1>
                </div>

                <h2 className="text-lg md:text-2xl lg:text-[1.75rem] font-light mb-6 md:whitespace-nowrap">
                    {t('not_found.title').split(t('not_found.evaporated')).map((part, i, arr) => (
                        <span key={i}>
                            {part}
                            {i < arr.length - 1 && <span className="font-bold underline decoration-amber-400/50">{t('not_found.evaporated')}</span>}
                        </span>
                    ))}
                </h2>

                <p className="text-base md:text-lg opacity-80 mb-8 leading-relaxed max-w-md mx-auto line-clamp-2 md:line-clamp-3">
                    {t('not_found.desc')}
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-8">
                    <Link 
                        href="/" 
                        className="w-full md:w-auto px-8 py-3 bg-white text-black rounded-full font-bold text-base shadow-xl hover:bg-gray-100 hover:scale-105 transition-all duration-300"
                    >
                        {t('not_found.back_home')}
                    </Link>
                    <Link 
                        href="/catalog" 
                        className="w-full md:w-auto px-8 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-full font-bold text-base hover:bg-white/20 hover:scale-105 transition-all duration-300"
                    >
                        {t('not_found.full_catalog')}
                    </Link>
                </div>

                {/* Discovery Quick Links */}
                <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest opacity-40 mb-4">{t('not_found.discover_collections')}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Link href="/catalog?category=נישה" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-colors uppercase">{t('not_found.niche')}</Link>
                        <Link href="/catalog?category=בוטיק" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-colors uppercase">{t('not_found.boutique')}</Link>
                        <Link href="/brands" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-colors uppercase">{t('not_found.all_brands')}</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
