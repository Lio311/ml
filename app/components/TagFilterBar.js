'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

export default function TagFilterBar({ allTags = [], activeTag = null, locale = 'he', dir = 'rtl' }) {
    const containerRef = useRef(null);
    const [canScrollStart, setCanScrollStart] = useState(false);
    const [canScrollEnd, setCanScrollEnd] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isRtl = dir === 'rtl';

    // Calculate scroll limits and show/hide arrows
    const checkScrollLimits = () => {
        const el = containerRef.current;
        if (!el) return;

        const { scrollWidth, clientWidth, scrollLeft } = el;
        
        // Browser compatibility for RTL scrollLeft:
        // In standard RTL, scrollLeft is 0 at the far right, and decreases (becomes negative) as you scroll left.
        // Some older browsers might have positive scrollLeft starting from the left.
        const scrollLeftAbs = Math.abs(scrollLeft);
        
        let showStart = false; // Right side in RTL, Left side in LTR
        let showEnd = false;   // Left side in RTL, Right side in LTR

        if (isRtl) {
            // Start is right (scrollLeft is 0)
            // If we scroll left, scrollLeft becomes negative, meaning we can scroll back right (Start)
            showStart = scrollLeft < -8;
            // End is left
            showEnd = scrollLeftAbs + clientWidth < scrollWidth - 8;
        } else {
            // Start is left (scrollLeft is 0)
            showStart = scrollLeft > 8;
            // End is right
            showEnd = scrollLeft + clientWidth < scrollWidth - 8;
        }

        setCanScrollStart(showStart);
        setCanScrollEnd(showEnd);
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Check initially and on resize
        checkScrollLimits();
        window.addEventListener('resize', checkScrollLimits);
        
        // Also check scroll limits after some delay to let layout settle
        const timer = setTimeout(checkScrollLimits, 200);

        return () => {
            window.removeEventListener('resize', checkScrollLimits);
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allTags]);

    const scroll = (direction) => {
        const el = containerRef.current;
        if (!el) return;

        const scrollAmount = 240;
        // In RTL, to scroll to the left (towards end/more tags), we need a negative value.
        // To scroll to the right (towards start/All), we need a positive value.
        let amount = direction === 'end' ? scrollAmount : -scrollAmount;
        if (isRtl) {
            amount = direction === 'end' ? -scrollAmount : scrollAmount;
        }

        el.scrollBy({
            left: amount,
            behavior: 'smooth'
        });
    };

    return (
        <div 
            className="relative w-full md:max-w-[70%] flex items-center group/bar"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Start Arrow (Right in RTL, Left in LTR) */}
            <button
                type="button"
                onClick={() => scroll('start')}
                className={`absolute z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-md hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300 ${
                    isRtl ? 'right-2' : 'left-2'
                } ${
                    canScrollStart && (isHovered || window.innerWidth < 768)
                        ? 'opacity-100 scale-100 pointer-events-auto' 
                        : 'opacity-0 scale-90 pointer-events-none'
                }`}
                aria-label={isRtl ? 'גלול ימינה' : 'Scroll left'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d={isRtl ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
                </svg>
            </button>

            {/* End Arrow (Left in RTL, Right in LTR) */}
            <button
                type="button"
                onClick={() => scroll('end')}
                className={`absolute z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-md hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300 ${
                    isRtl ? 'left-2' : 'right-2'
                } ${
                    canScrollEnd && (isHovered || window.innerWidth < 768)
                        ? 'opacity-100 scale-100 pointer-events-auto' 
                        : 'opacity-0 scale-90 pointer-events-none'
                }`}
                aria-label={isRtl ? 'גלול שמאלה' : 'Scroll right'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d={isRtl ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
                </svg>
            </button>

            {/* Edge Fade Gradients */}
            {canScrollStart && (
                <div 
                    className={`absolute top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300 ${
                        isRtl 
                            ? 'right-0 bg-gradient-to-l from-[#fafafa] via-[#fafafa]/80 to-transparent' 
                            : 'left-0 bg-gradient-to-r from-[#fafafa] via-[#fafafa]/80 to-transparent'
                    }`}
                />
            )}
            {canScrollEnd && (
                <div 
                    className={`absolute top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300 ${
                        isRtl 
                            ? 'left-0 bg-gradient-to-r from-[#fafafa] via-[#fafafa]/80 to-transparent' 
                            : 'right-0 bg-gradient-to-l from-[#fafafa] via-[#fafafa]/80 to-transparent'
                    }`}
                />
            )}

            {/* Scrollable container */}
            <div
                ref={containerRef}
                onScroll={checkScrollLimits}
                className="w-full flex gap-2 overflow-x-auto py-1 px-1 no-scrollbar scroll-smooth relative"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <Link
                    href="/blog"
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                        !activeTag 
                            ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                    }`}
                >
                    {locale === 'he' ? 'הכל' : 'All Articles'}
                </Link>
                {allTags.map((tag) => (
                    <Link
                        key={tag}
                        href={`/blog?tag=${tag}`}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                            activeTag === tag 
                                ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                        }`}
                    >
                        {tag}
                    </Link>
                ))}
            </div>
        </div>
    );
}
