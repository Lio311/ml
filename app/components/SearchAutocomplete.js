"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from './CImage';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { cleanProductName } from '../lib/productUtils';

export default function SearchAutocomplete({ fullWidth = false, onSelect }) {
    const { t, locale, dir: contextDir } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    setResults(data.results || []);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSubmit = (e) => {
        e.preventDefault();
        router.push(`/catalog?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
    };

    // Detect Text Direction (Support dynamic switching + character detection)
    const isHebrew = /[\u0590-\u05FF]/.test(query);
    const isEnglish = /^[A-Za-z]/.test(query);
    const textDir = query.length > 0 ? (isEnglish && !isHebrew ? 'ltr' : 'rtl') : contextDir;
    const isTextRTL = textDir === 'rtl';
    const isLayoutRTL = contextDir === 'rtl';

    return (

        <div className={`relative group ${fullWidth ? 'flex-1' : 'w-20'}`} ref={wrapperRef}>
            <form onSubmit={handleSubmit} className="relative flex items-center w-full h-[28px]">

                <input
                    type="text"
                    placeholder={t('common.search')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2 && results.length > 0) setIsOpen(true);
                    }}
                    className={`absolute top-0 h-full border-b border-gray-300 text-sm focus:outline-none focus:border-black transition-all bg-transparent focus:bg-white z-20 placeholder-gray-400 
                        ${fullWidth ? 'w-full left-0' : `w-20 focus:w-48 ${isLayoutRTL ? 'left-0' : 'right-0'} ${isTextRTL ? 'text-right pe-8 ps-0' : 'text-left pr-8 pl-0'}`}`}
                    dir={textDir}
                />

                {/* Search Icon (Always at the END - Right for English, Left for Hebrew) */}
                <button
                    type="submit"
                    className={`absolute top-1/2 -translate-y-1/2 text-black hover:opacity-70 p-1 z-30 ${isTextRTL ? 'left-0' : 'right-0'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>


                {isLoading && (
                    <div className={`absolute top-1/2 -translate-y-1/2 z-30 ${isTextRTL ? 'left-6' : 'right-6'}`}>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-1.5 border-black/50"></div>
                    </div>
                )}
            </form>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className={`absolute top-full w-[calc(100vw-2rem)] md:w-80 bg-white shadow-xl border border-gray-100 rounded-lg mt-2 overflow-hidden z-50 ${isRTL ? 'left-0 md:left-0' : 'right-0 md:right-0'}`}>
                    <div className="p-2 max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
                        {results.map((product) => (
                                <Link
                                    key={product.id}
                                    href={product.slug ? `/product/${product.slug}` : (product.id ? `/product/${product.id}` : '#')}
                                    onClick={(e) => {
                                        if (!product.slug && !product.id) {
                                            e.preventDefault();
                                            return;
                                        }
                                        setIsOpen(false);
                                        if (onSelect) onSelect();
                                    }}
                                    className={`flex items-center gap-4 p-3 hover:bg-gray-50 transition group/item ${(!product.slug && !product.id) ? 'pointer-events-none opacity-50' : ''}`}
                                    dir={direction}
                                >
                                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-contain group-hover/item:scale-105 transition duration-500"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate group-hover/item:text-blue-600 transition">
                                        {cleanProductName(product.name, product.brand)}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{product.brand}</div>
                                </div>
                                <div className="text-sm font-bold whitespace-nowrap flex flex-col items-end">
                                    {product.price < product.original_min_price ? (
                                        <>
                                            <span className="text-[10px] text-gray-400 line-through leading-none">₪{product.original_min_price}</span>
                                            <span className="text-green-600 font-black">₪{product.price}</span>
                                        </>
                                    ) : (
                                        <span className="text-black">₪{product.price}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link
                        href={`/catalog?q=${encodeURIComponent(query)}`}
                        onClick={() => {
                            setIsOpen(false);
                            if (onSelect) onSelect();
                        }}
                        className="block bg-gray-50 p-3 text-center text-xs font-bold text-blue-600 hover:underline border-t"
                    >
                        {t('common.view_all_results')} ({results.length}+)
                    </Link>

                </div>
            )}
        </div>
    );
}
