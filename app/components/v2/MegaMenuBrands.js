"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MegaMenuBrands({ brands = [], isOpen, onClose }) {
    const [hoveredLetter, setHoveredLetter] = useState(null);

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
            className="absolute top-full left-0 w-full glass-dark min-h-[500px] z-40 animate-fadeIn overflow-hidden flex flex-col"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto py-10 px-6 flex flex-col h-full">
                
                {/* Alphabet Selection Grid */}
                <div className="flex flex-wrap justify-center gap-3 mb-10 border-b border-white/5 pb-10">
                    {alphabet.map((letter) => (
                        <button
                            key={letter}
                            onMouseEnter={() => setHoveredLetter(letter)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-serif transition-all duration-300 border ${
                                hoveredLetter === letter 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>

                {/* Brands Display Area */}
                <div className="flex-1 min-h-[300px] transition-all duration-500 relative">
                    {!hoveredLetter ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 space-y-4">
                            <span className="text-4xl font-serif tracking-widest uppercase opacity-20">בחרו אות</span>
                            <div className="w-16 h-[1px] bg-white/10"></div>
                            <span className="text-xs uppercase tracking-[0.3em]">SELECT A LETTER TO VIEW BRANDS</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fadeInQuick">
                            {hoveredBrands.map((brand) => (
                                <Link 
                                    key={brand.id} 
                                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                                    className="brand-card flex flex-col items-center justify-center p-4 rounded-xl hover:bg-white/5 group border border-transparent hover:border-white/10 transition-all duration-300"
                                >
                                    {brand.logo_url ? (
                                        <div className="relative w-24 h-12 mb-3 transition-transform duration-500 group-hover:scale-110">
                                            <Image 
                                                src={brand.logo_url} 
                                                alt={brand.name} 
                                                fill 
                                                className="object-contain inverted-logo" 
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors uppercase tracking-widest text-center leading-tight">
                                            {brand.name}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Link */}
                <div className="mt-auto pt-8 text-center border-t border-white/5">
                    <Link 
                        href="/brands" 
                        className="text-white/40 hover:text-white transition-all inline-flex items-center gap-2 group text-[10px] uppercase tracking-[0.3em]"
                    >
                        <span>כל המותגים</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
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
                .animate-fadeInQuick {
                    animation: fadeInQuick 0.4s ease-out forwards;
                }
                @keyframes fadeInQuick {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
