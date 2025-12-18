"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SearchAutocomplete({ fullWidth = false, onSelect }) {
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

    // Detect Text Direction (Default RTL)
    const isHebrew = /[\u0590-\u05FF]/.test(query);
    const isEnglish = /^[A-Za-z]/.test(query);
    const direction = isEnglish && !isHebrew ? 'ltr' : 'rtl';
    const isRTL = direction === 'rtl';

    return (

        <div className={`relative group ${fullWidth ? 'flex-1' : 'inline-block'}`} ref={wrapperRef}>
            <form onSubmit={handleSubmit} className="relative flex items-center w-full">

                <input
                    type="text"
                    placeholder="חיפוש..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2 && results.length > 0) setIsOpen(true);
                    }}
                    className={`border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-black transition-all bg-transparent placeholder-gray-400 
                        ${fullWidth ? 'w-full' : 'w-20 focus:w-48'}
                        ${isRTL ? 'text-right pl-8 pr-2' : 'text-left pr-8 pl-2'}`}

                    dir={direction}
                />

                {/* Search Icon (Always at "End" of input) */}
                <button
                    type="submit"
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black hover:text-black p-1 ${isRTL ? 'left-0' : 'right-0'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>


                {isLoading && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-6' : 'right-6'}`}>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black"></div>
                    </div>
                )}
            </form>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full right-0 w-80 bg-white shadow-xl border border-gray-100 rounded-lg mt-2 overflow-hidden z-50">
                    <div className="p-2 max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
                        {results.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug || product.id}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    if (onSelect) onSelect();
                                }}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 transition group/item text-right"
                                dir="rtl"
                            >
                                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-contain group-hover/item:scale-105 transition duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate group-hover/item:text-blue-600 transition">
                                        {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{product.brand}</div>
                                </div>
                                <div className="text-sm font-bold text-black whitespace-nowrap">
                                    ₪{product.price}
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
                        צפה בכל התוצאות ({results.length}+)
                    </Link>

                </div>
            )}
        </div>
    );
}
