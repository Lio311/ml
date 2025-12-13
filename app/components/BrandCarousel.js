"use client";

import Link from 'next/link';

export default function BrandCarousel({ brands }) {
    if (!brands || brands.length === 0) return null;

    return (
        <div className="w-full bg-white py-12 border-t border-gray-100 overflow-hidden">
            <h2 className="text-3xl font-bold mb-8 text-center text-black">המותגים המובילים</h2>

            <div className="relative w-full overflow-hidden group">
                <div className="flex animate-scroll whitespace-nowrap gap-12 w-max hover:pause">
                    {/* Duplicate the array to create infinite loop effect */}
                    {[...brands, ...brands, ...brands].map((brand, i) => (
                        <Link
                            key={`${brand.name}-${i}`}
                            href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                            className="flex flex-col items-center justify-center min-w-[150px] opacity-70 hover:opacity-100 transition-opacity"
                        >
                            {brand.logo_url ? (
                                <img src={brand.logo_url} alt={brand.name} className="h-24 w-auto object-contain" />
                            ) : (
                                <span className="text-xl font-bold text-gray-400">{brand.name}</span>
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
                animation: scroll 60s linear infinite;
            }
            .hover\\:pause:hover {
                animation-play-state: paused;
            }
        `}</style>
        </div>
    );
}
