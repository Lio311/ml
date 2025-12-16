"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SearchAutocomplete() {
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

    return (
        <div className="relative group w-full" ref={wrapperRef}>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    placeholder="חיפוש..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2 && results.length > 0) setIsOpen(true);
                    }}
                    className={`border-b border-gray-300 py-1 px-8 text-sm focus:outline-none focus:border-black transition-all bg-transparent w-24 focus:w-64 placeholder-gray-400 text-right`}
                    dir="rtl"
                />

                {/* Search Icon (Absolute Left to match Hebrew layout visually if needed, but usually right in RTL inputs. 
                    However, original code had icon absolute left. 
                    Let's stick to standard RTL: text starts right, icon usually on edge.
                    I'll place icon on the Right for RTL input context, or keep it left as 'submit' button.
                    Let's keep it Left as in original design for consistency, but user asked for RTL.
                    If input is RTL, text is on right. Icon should probably be on Left (end of line) or Right (start of line).
                    Let's place icon on the Right (Start) for aesthetic, or Left (End).
                    Original had it absolute left.
                */}
                <button type="submit" className="absolute left-1 top-1 text-gray-400 group-focus-within:text-black hover:text-black">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>

                {isLoading && (
                    <div className="absolute right-0 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
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
                                href={`/product/${product.id}`}
                                onClick={() => setIsOpen(false)}
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
                        onClick={() => setIsOpen(false)}
                        className="block bg-gray-50 p-3 text-center text-xs font-bold text-blue-600 hover:underline border-t"
                    >
                        צפה בכל התוצאות ({results.length}+)
                    </Link>
                </div>
            )}
        </div>
    );
}
