"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function DesktopNav({ menu = [], brands = [] }) {
    const pathname = usePathname();
    const [isBrandsDropdownOpen, setIsBrandsDropdownOpen] = useState(false);

    // Group Brands by Letter
    const groupedBrands = brands.reduce((acc, brand) => {
        const letter = brand.name.charAt(0).toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(brand);
        return acc;
    }, {});

    const sortedLetters = Object.keys(groupedBrands).sort();

    return (
        <nav className="flex items-center gap-6 lg:gap-8 relative whitespace-nowrap">
            {menu.filter(item => item.visible).map(item => {
                // Special case: Brands dropdown
                if (item.id === 'brands') {
                    return (
                        <div
                            key={item.id}
                            className="group"
                            onMouseEnter={() => setIsBrandsDropdownOpen(true)}
                            onMouseLeave={() => setIsBrandsDropdownOpen(false)}
                        >
                            <Link
                                href="/brands"
                                className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm whitespace-nowrap ${pathname.startsWith('/brands') ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}
                            >
                                {item.label}
                            </Link>

                            {/* The Mega Menu Dropdown */}
                            {isBrandsDropdownOpen && (
                                <div className="absolute top-full w-[900px] bg-white text-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 rounded-b-xl overflow-hidden z-50 transition-all duration-300 origin-top transform -translate-x-1/2 left-1/2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex flex-col max-h-[60vh]">
                                        <div className="overflow-y-auto p-6 custom-scrollbar text-right">
                                            {brands.length === 0 ? (
                                                <p className="text-center text-gray-400">טוען מותגים...</p>
                                            ) : (
                                                <div className="columns-4 gap-8">
                                                    {sortedLetters.map(letter => (
                                                        <div key={letter} className="break-inside-avoid mb-6">
                                                            <h4 className="font-bold text-black border-b border-gray-200 mb-2 pb-1 text-lg sticky top-0 bg-white/95 backdrop-blur-sm">{letter}</h4>
                                                            <div className="flex flex-col gap-1">
                                                                {groupedBrands[letter].map(brand => (
                                                                    <Link
                                                                        key={brand.name}
                                                                        href={`/brands/${encodeURIComponent(brand.name)}`}
                                                                        className="text-xs text-gray-600 hover:text-black hover:font-bold transition-colors"
                                                                    >
                                                                        {brand.name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-gray-50 border-t text-center">
                                            <Link href="/brands" className="text-sm font-bold underline hover:text-red-600">
                                                לכל המותגים &larr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <Link
                        key={item.id}
                        href={item.path}
                        className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm whitespace-nowrap ${pathname === item.path
                            ? (item.isRed ? 'bg-red-600 text-white' : 'bg-black text-white')
                            : (item.isRed ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-900 hover:bg-black hover:text-white')
                            }`}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
