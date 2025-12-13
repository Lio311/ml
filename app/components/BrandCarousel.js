"use client";

import Link from 'next/link';

export default function BrandCarousel({ brands }) {
    if (!brands || brands.length === 0) return null;

    return (
        <div className="w-full bg-neutral-50 py-16 border-t border-gray-200 overflow-hidden">
            <div className="container mx-auto px-4 text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-serif font-medium text-black tracking-widest uppercase">המותגים המובילים</h2>
                <div className="w-12 h-0.5 bg-black mx-auto mt-4"></div>
            </div>

            <div className="relative w-full overflow-hidden group">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none"></div>

                <div className="flex animate-scroll whitespace-nowrap gap-16 md:gap-24 w-max hover:pause items-center">
                    {/* Duplicate the array to create infinite loop effect */}
                    {[...brands, ...brands, ...brands].map((brand, i) => (
                        <Link
                            key={`${brand.name}-${i}`}
                            href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                            className="flex flex-col items-center justify-center min-w-[120px] md:min-w-[160px] opacity-60 hover:opacity-100 transition-all duration-300 transform hover:scale-110 grayscale hover:grayscale-0"
                        >
                            {brand.logo_url ? (
                                <img src={brand.logo_url} alt={brand.name} className="h-20 md:h-28 w-auto object-contain mix-blend-multiply" />
                            ) : (
                                <span className="text-lg md:text-xl font-bold text-gray-400 font-serif">{brand.name}</span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx>{`
            @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(50%); } /* RTL scroll direction */
            }
            .animate-scroll {
                animation: scroll 80s linear infinite;
            }
            .hover\\:pause:hover {
                animation-play-state: paused;
            }
        `}</style>
        </div>
    );
}
