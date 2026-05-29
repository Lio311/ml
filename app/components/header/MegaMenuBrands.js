"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from '../CImage';
import { useLanguage } from '../../context/LanguageContext';

export default function MegaMenuBrands({ brands = [], isOpen, onClose }) {
    const [hoveredLetter, setHoveredLetter] = useState(null);
    const { dir, t } = useLanguage();

    // Group brands by first letter
    const brandsByLetter = useMemo(() => {
        const groups = {};
        brands.forEach(brand => {
            const firstLetter = brand.name.charAt(0).toUpperCase();
            if (!groups[firstLetter]) groups[firstLetter] = [];
            groups[firstLetter].push(brand);
        });
        // Sort letters
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
            return acc;
        }, {});
    }, [brands]);

    const alphabet = Object.keys(brandsByLetter);

    if (!isOpen) return null;

    const hoveredBrands = hoveredLetter ? brandsByLetter[hoveredLetter] : [];

    return (
        <div 
            className="absolute top-full left-0 w-full bg-white/85 backdrop-blur-2xl pt-5 pb-3 z-40 animate-fadeIn overflow-hidden flex flex-col border-t border-gray-200 shadow-2xl"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto px-6 flex flex-col items-center">
                
                {/* Alphabet Selection Grid - Single Row, LTR */}
                <div className="w-full flex justify-center mb-3 border-b border-gray-200 pb-3" dir="ltr">
                    <div className="flex flex-nowrap items-center justify-center gap-1 max-w-full overflow-x-auto no-scrollbar px-2 px-md-4">
                        {alphabet.map((letter) => (
                            <button
                                key={letter}
                                onMouseEnter={() => setHoveredLetter(letter)}
                                className={`flex-shrink-0 w-7 h-7 md:w-9 md:h-9 rounded-md md:rounded-lg flex items-center justify-center text-[10px] md:text-sm font-serif transition-all duration-300 border ${
                                    hoveredLetter === letter 
                                    ? 'bg-black text-white border-black shadow-[0_0_15px_rgba(0,0,0,0.15)] scale-110' 
                                    : 'bg-black/5 text-black/60 border-black/10 hover:bg-black/10 hover:text-black hover:scale-105'
                                }`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brands Display Area */}
                <div className="w-full min-h-[180px] transition-all duration-500 relative">
                    {!hoveredLetter ? (
                        <div className="flex flex-col items-center justify-center text-black space-y-3 py-4">
                            <span className="text-2xl md:text-3xl font-serif tracking-[0.2em] uppercase opacity-90 drop-shadow-sm">{t('common.choose_letter')}</span>
                            <div className="w-12 h-[1px] bg-black/20"></div>
                            <span className="text-[9px] uppercase tracking-[0.3em] opacity-60">EXPLORE OUR CURATED COLLECTIONS</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-4 animate-fadeInQuick w-full pb-2">
                            {hoveredBrands.map((brand) => (
                                <Link 
                                    key={brand.id} 
                                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                                    className="brand-card group flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-gray-100 hover:border-gray-300 hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 w-[140px] md:w-[170px] min-h-[100px]"
                                >
                                    <div className="relative w-full h-8 mb-3 transition-transform duration-700 group-hover:scale-110">
                                        {brand.logo_url ? (
                                            <Image 
                                                src={brand.logo_url} 
                                                alt={brand.name} 
                                                fill 
                                                className="object-contain" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-xl font-serif text-black/30">{brand.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-black/70 group-hover:text-black transition-colors uppercase tracking-[0.15em] text-center p-1 break-words w-full">
                                        {brand.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Link */}
                <div className="mt-2 pt-2 w-full text-center border-t border-black/5">
                    <Link 
                        href="/brands" 
                        className="text-black/50 hover:text-black transition-all inline-flex items-center gap-2 group text-[9px] uppercase tracking-[0.3em]"
                    >
                        <span>{t('common.all_brands')}</span>
                        <span className="group-hover:translate-x-1 group-hover:-translate-x-1 transition-transform duration-500 inline-block">
                            {dir === 'rtl' ? '←' : '→'}
                        </span>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .animate-fadeInQuick {
                    animation: fadeInQuick 0.3s ease-out forwards;
                }
                @keyframes fadeInQuick {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
