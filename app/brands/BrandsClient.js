"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../context/LanguageContext';


export default function BrandsClient({ brands }) {
    const [selectedLetter, setSelectedLetter] = useState(null);
    const { t } = useLanguage();

    // Alphabet and Available Letters Logic
    const fullAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    // Get unique first letters from brands
    const availableLetters = new Set(
        brands.map(b => b.name.trim().charAt(0).toUpperCase())
    );

    // Filter Alphabet
    const visibleLetters = fullAlphabet.filter(letter => availableLetters.has(letter));

    // Filter Logic
    const filteredBrands = selectedLetter
        ? brands.filter(brand => brand.name.trim().toLowerCase().startsWith(selectedLetter.toLowerCase()))
        : brands;

    return (
        <div>
            {/* A-Z Filter Controls */}
            <div className="flex flex-wrap justify-center gap-2 mb-12" dir="ltr">
                {visibleLetters.map(letter => (
                    <button
                        key={letter}
                        onClick={() => setSelectedLetter(letter)}
                        className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center transition-all ${selectedLetter === letter
                            ? 'bg-black text-white shadow-lg scale-110'
                            : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                    >
                        {letter}
                    </button>
                ))}
                <button
                    onClick={() => setSelectedLetter(null)}
                    className={`h-8 px-3 text-xs font-bold rounded flex items-center justify-center transition-all ${selectedLetter === null
                        ? 'bg-black text-white shadow-lg scale-110'
                        : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                >
                    {t('common.all')}
                </button>
            </div>

            {/* Results Grid */}
            {filteredBrands.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-2xl text-gray-400 font-light">{t('common.no_brands_for_letter')} {selectedLetter}</p>
                    <button
                        onClick={() => setSelectedLetter(null)}
                        className="mt-4 text-black underline font-bold"
                    >
                        {t('common.back_to_all_brands')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {filteredBrands.map((brand) => (
                        <Link
                            key={brand.name}
                            href={`/brands/${encodeURIComponent(brand.name)}`}
                            className="group block bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center h-40 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <div className="relative w-full h-full flex items-center justify-center p-4 text-center">
                                {brand.logo_url ? (
                                    <Image
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        fill
                                        className="object-contain p-4 filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                        sizes="(max-width: 768px) 50vw, 16vw"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wider group-hover:text-black transition-colors">
                                        {brand.name}
                                    </span>
                                )}
                            </div>
                            {brand.logo_url && (
                                <span className="absolute bottom-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                    {brand.name}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
