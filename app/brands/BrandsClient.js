"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BrandsClient({ brands }) {
    const [selectedLetter, setSelectedLetter] = useState(null);

    // Alphabet for filter
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    // Filter Logic
    const filteredBrands = selectedLetter
        ? brands.filter(brand => brand.name.trim().toLowerCase().startsWith(selectedLetter.toLowerCase()))
        : brands;

    return (
        <div>
            {/* A-Z Filter Controls */}
            <div className="flex flex-wrap justify-center gap-2 mb-12 direction-ltr">
                <button
                    onClick={() => setSelectedLetter(null)}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${selectedLetter === null
                        ? 'bg-black text-white shadow-lg scale-110'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    הכל
                </button>
                {alphabet.map(letter => (
                    <button
                        key={letter}
                        onClick={() => setSelectedLetter(letter)}
                        className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${selectedLetter === letter
                            ? 'bg-black text-white shadow-lg scale-110'
                            : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* Results Grid */}
            {filteredBrands.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-2xl text-gray-400 font-light">לא נמצאו מותגים באות {selectedLetter}</p>
                    <button
                        onClick={() => setSelectedLetter(null)}
                        className="mt-4 text-black underline font-bold"
                    >
                        חזרה לכל המותגים
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {filteredBrands.map((brand) => (
                        <Link
                            key={brand.name}
                            href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                            className="group block bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center h-40 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    width={120}
                                    height={120}
                                    className="object-contain max-h-24 w-auto filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <span className="absolute bottom-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                {brand.name}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
