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
            className="absolute top-full left-0 w-full glass-dark pt-5 pb-3 z-40 animate-fadeIn overflow-hidden flex flex-col"
            onMouseLeave={onClose}
            style={{ 
                height: 'calc(82vh - var(--header-height, 112px))',
                minHeight: '400px'
            }}
        >
            <div className="container mx-auto px-6 flex flex-col items-center h-full">
                
                {/* Alphabet Selection Grid - Single Row, LTR */}
                <div className="w-full flex justify-center mb-2 border-b border-white/10 pb-1 flex-shrink-0" dir="ltr">
                    <div className="flex flex-nowrap items-center justify-center gap-1 max-w-full overflow-x-auto no-scrollbar px-2 px-md-4 py-4">
                        {alphabet.map((letter) => (
                            <button
                                key={letter}
                                onMouseEnter={() => setHoveredLetter(letter)}
                                className={`flex-shrink-0 w-7 h-7 md:w-9 md:h-9 rounded-md md:rounded-lg flex items-center justify-center text-[10px] md:text-sm font-serif transition-all duration-300 border ${
                                    hoveredLetter === letter 
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-110' 
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:scale-105'
                                }`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brands Display Area */}
                <div className="w-full transition-all duration-500 relative flex-1 overflow-y-auto no-scrollbar pt-2">
                    {!hoveredLetter ? (
                        <div className="flex flex-col items-center justify-center h-full text-white space-y-3 py-4">
                            <span className="text-2xl md:text-3xl font-serif tracking-[0.2em] uppercase opacity-90 drop-shadow-sm">{t('common.choose_letter')}</span>
                            <div className="w-12 h-[1px] bg-white/20"></div>
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
                <div className="mt-2 pt-2 w-full text-center border-t border-white/10 flex-shrink-0">
                    <Link 
                        href="/brands" 
                        className="text-white/50 hover:text-white transition-all inline-flex items-center gap-2 group text-[9px] uppercase tracking-[0.3em]"
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
