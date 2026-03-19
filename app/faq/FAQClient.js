"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function FAQClient({ 
    categories, 
    sidebarTitle = "קטגוריות", 
    footerTitle = "לא מצאתם תשובה?", 
    footerSubtitle = "הצוות שלנו כאן כדי לעזור לכם למצוא את הריח המושלם או לענות על כל שאלה טכנית" 
}) {
    const [activeCategory, setActiveCategory] = useState(0);
    const observer = useRef(null);

    useEffect(() => {
        // Intersection Observer to detect which section is in view
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    const index = parseInt(id.replace('cat-', ''));
                    if (!isNaN(index)) {
                        setActiveCategory(index);
                    }
                }
            });
        }, {
            // Root margin to trigger slightly before/after the section hits the middle
            rootMargin: '-20% 0% -60% 0%',
            threshold: 0
        });

        // Observe all category sections
        categories.forEach((_, idx) => {
            const el = document.getElementById(`cat-${idx}`);
            if (el) observer.current.observe(el);
        });

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [categories]);

    return (
        <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar navigation for desktop */}
                <aside className="hidden md:block sticky top-36 z-30 self-start space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 px-3">{sidebarTitle}</h2>
                    {categories.map((cat, idx) => (
                        <a 
                            key={idx} 
                            href={`#cat-${idx}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(`cat-${idx}`);
                                if (el) {
                                    window.scrollTo({
                                        top: el.offsetTop - 200,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                            className={`block px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl ${
                                activeCategory === idx 
                                ? 'bg-black text-white shadow-lg transform translate-x-[-4px]' 
                                : 'text-gray-500 hover:text-black hover:bg-white'
                            }`}
                        >
                            {cat.title}
                        </a>
                    ))}
                </aside>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-16">
                    {categories.map((cat, idx) => (
                        <section key={idx} id={`cat-${idx}`} className="scroll-mt-52">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-black rounded-full" />
                                {cat.title}
                            </h2>
                            <div className="space-y-6">
                                {cat.items.map((item, i) => (
                                    <div key={i} className="group bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <h3 className="font-bold text-lg mb-4 text-gray-900 leading-tight">
                                            {item.q}
                                        </h3>
                                        <div className="w-full h-px bg-gray-50 mb-4 group-hover:bg-gray-100 transition-colors" />
                                        <p className="text-gray-600 leading-relaxed text-base">
                                            {item.a}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    {/* Direct Contact Footer */}
                    <div className="bg-black text-white p-10 rounded-[2rem] mt-12 text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50" />
                        <div className="relative z-10">
                            <div className="inline-block p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">{footerTitle}</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">{footerSubtitle}</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link href="/contact" className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-xl">
                                    צרו קשר עכשיו
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
