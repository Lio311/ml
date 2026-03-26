"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../../context/LanguageContext';

export default function MegaMenuBrands({ brands = [], isOpen, onClose }) {
    const [hoveredLetter, setHoveredLetter] = useState(null);
    const { dir } = useLanguage();

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
            className="absolute top-full left-0 w-full glass-dark py-8 min-h-[450px] z-40 animate-fadeIn overflow-hidden flex flex-col"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto px-6 flex flex-col items-center">
                
                {/* Alphabet Selection Grid - Single Row, LTR */}
                <div className="w-full flex justify-center mb-8 border-b border-white/5 pb-6" dir="ltr">
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl">
                        {alphabet.map((letter) => (
                            <button
                                key={letter}
                                onMouseEnter={() => setHoveredLetter(letter)}
                                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-base font-serif transition-all duration-300 border ${
                                    hoveredLetter === letter 
                                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110' 
                                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white hover:scale-105'
                                }`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brands Display Area */}
                <div className="w-full min-h-[200px] transition-all duration-500 relative">
                    {!hoveredLetter ? (
                        <div className="flex flex-col items-center justify-center text-white/20 space-y-3 py-10">
                            <span className="text-2xl font-serif tracking-[0.2em] uppercase opacity-30">בחרו אות</span>
                            <div className="w-12 h-[1px] bg-white/10"></div>
                            <span className="text-[9px] uppercase tracking-[0.3em]">EXPLORE OUR CURATED COLLECTIONS</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fadeInQuick">
                            {hoveredBrands.map((brand) => (
                                <Link 
                                    key={brand.id} 
                                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                                    className="brand-card group flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
                                >
                                    <div className="relative w-full h-8 mb-3 transition-transform duration-700 group-hover:scale-110">
                                        {brand.logo_url ? (
                                            <Image 
                                                src={brand.logo_url} 
                                                alt={brand.name} 
                                                fill 
                                                className="object-contain inverted-logo" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-xl font-serif text-white/20">{brand.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-[0.2em] text-center line-clamp-1">
                                        {brand.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Link */}
                <div className="mt-8 pt-6 w-full text-center border-t border-white/5">
                    <Link 
                        href="/brands" 
                        className="text-white/30 hover:text-white transition-all inline-flex items-center gap-2 group text-[10px] uppercase tracking-[0.3em]"
                    >
                        <span>כל המותגים</span>
                        <span className="group-hover:translate-x-1 group-hover:-translate-x-1 transition-transform duration-500 inline-block">
                            {dir === 'rtl' ? '←' : '→'}
                        </span>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .inverted-logo {
                    filter: brightness(0) invert(1);
                    transition: filter 0.3s ease;
                }
                .brand-card:hover .inverted-logo {
                    filter: none;
                }
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
