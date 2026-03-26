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
            className="absolute top-full left-0 w-full glass-dark py-12 min-h-[550px] z-40 animate-fadeIn overflow-hidden flex flex-col"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto px-6 flex flex-col items-center">
                
                {/* Alphabet Selection Grid - 2 Rows, LTR */}
                <div className="w-full flex justify-center mb-12 border-b border-white/5 pb-10" dir="ltr">
                    <div className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto no-scrollbar pb-2 max-w-full">
                        {alphabet.map((letter) => (
                            <button
                                key={letter}
                                onMouseEnter={() => setHoveredLetter(letter)}
                                className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg md:text-xl font-serif transition-all duration-500 border ${
                                    hoveredLetter === letter 
                                    ? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] scale-110' 
                                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white hover:scale-105'
                                }`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brands Display Area */}
                <div className="w-full min-h-[250px] transition-all duration-500 relative">
                    {!hoveredLetter ? (
                        <div className="flex flex-col items-center justify-center text-white/20 space-y-4 py-16">
                            <span className="text-3xl font-serif tracking-[0.3em] uppercase opacity-30">בחרו אות</span>
                            <div className="w-20 h-[1px] bg-white/10"></div>
                            <span className="text-[10px] uppercase tracking-[0.4em]">EXPLOERE OUR CURATED COLLECTIONS</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fadeInQuick">
                            {hoveredBrands.map((brand) => (
                                <Link 
                                    key={brand.id} 
                                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                                    className="brand-card group flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
                                >
                                    <div className="relative w-full h-16 mb-6 transition-transform duration-700 group-hover:scale-110">
                                        {brand.logo_url ? (
                                            <Image 
                                                src={brand.logo_url} 
                                                alt={brand.name} 
                                                fill 
                                                className="object-contain inverted-logo" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl font-serif text-white/20">{brand.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-bold text-white/50 group-hover:text-white transition-colors uppercase tracking-[0.25em] text-center line-clamp-1">
                                        {brand.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Link */}
                <div className="mt-12 pt-8 w-full text-center border-t border-white/5">
                    <Link 
                        href="/brands" 
                        className="text-white/30 hover:text-white transition-all inline-flex items-center gap-3 group text-[11px] uppercase tracking-[0.4em]"
                    >
                        <span>כל המותגים</span>
                        <span className="group-hover:translate-x-2 group-hover:-translate-x-2 transition-transform duration-500 inline-block">
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
