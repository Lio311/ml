"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function MegaMenuBrands({ brands = [], isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div 
            className="absolute top-full left-0 w-full glass-dark min-h-[400px] z-40 animate-fadeIn overflow-hidden"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto py-12 px-6">
                <div className="mega-grid">
                    {brands.slice(0, 24).map((brand) => (
                        <Link 
                            key={brand.id} 
                            href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                            className="logo-item flex flex-col items-center justify-center p-4 rounded-xl hover:bg-white/5 group"
                        >
                            {brand.logo_url ? (
                                <div className="relative w-24 h-12 mb-2 transition-transform duration-500 group-hover:scale-110">
                                    <Image 
                                        src={brand.logo_url} 
                                        alt={brand.name} 
                                        fill 
                                        className="object-contain inverted-logo" 
                                    />
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors uppercase tracking-widest">
                                    {brand.name}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
                
                <div className="mt-8 border-t border-white/10 pt-6 text-center">
                    <Link 
                        href="/brands" 
                        className="text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 group text-sm uppercase tracking-[0.2em]"
                    >
                        <span>לכל המותגים</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .inverted-logo {
                    filter: brightness(0) invert(1);
                }
                .logo-item:hover .inverted-logo {
                    filter: none;
                }
            `}</style>
        </div>
    );
}
