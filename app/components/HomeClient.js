"use client";

import Link from 'next/link';
import Image from "@/app/components/CImage";
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { cleanProductName } from '../lib/productUtils';
import ProductCard from './ProductCard';

export default function HomeClient({ newArrivals, topCatalogs }) {
    const { t, dir, localize, locale } = useLanguage();
    const isRTL = dir === 'rtl';
    const gridRef = useRef(null);
    const [visibleCards, setVisibleCards] = useState(new Set());

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        // root: null = actual window viewport, ignores overflow-x-hidden parents
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    newArrivals.forEach((_, i) => {
                        setTimeout(() => {
                            setVisibleCards(prev => new Set([...prev, i]));
                        }, i * 80);
                    });
                    observer.disconnect();
                }
            },
            { root: null, threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
        );

        observer.observe(grid);
        return () => observer.disconnect();
    }, [newArrivals]);

    return (
        <>
            {/* New Arrivals Section */}
            <section className="py-4 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl tracking-[0.2em] uppercase mb-3 font-bold text-black">{t('common.new_arrivals')}</h2>
                    <div className="w-10 h-0.5 bg-black mx-auto mb-6"></div>

                    <div
                        ref={gridRef}
                        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
                    >
                        {newArrivals.map((product, i) => (
                            <div
                                key={product.id}
                                style={{
                                    opacity: visibleCards.has(i) ? 1 : 0,
                                    transform: visibleCards.has(i) ? 'translateY(0)' : 'translateY(28px)',
                                    transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
                                }}
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>

                    <Link href="/catalog" className="inline-block mt-8 mb-8 bg-black text-white px-8 py-3 rounded-full font-bold tracking-widest uppercase hover:bg-gray-800 transition shadow-md">
                        {t('common.view_all_products')}
                    </Link>
                </div>
            </section>

            {/* Hot Catalogs Section - Hidden if empty */}
            {topCatalogs.length > 0 && (
                <section className="py-12 bg-gray-50 border-t border-b">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl tracking-[0.2em] uppercase mb-3 font-bold text-black">{t('common.hot_catalogs')}</h2>
                        <div className="w-10 h-0.5 bg-yellow-400 mx-auto mb-6"></div>
                        <p className="text-gray-500 mb-10 max-w-2xl mx-auto">{t('common.hot_catalogs_desc')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {topCatalogs.map(cat => (
                                <Link href={`/catalog/${cat.slug}`} key={cat.id} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-yellow-200 to-yellow-400 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform overflow-hidden relative">
                                        {cat.image_url ? (
                                            <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="64px" />
                                        ) : (
                                            "🔥"
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-gray-900">{cat.name}</h3>
                                    {cat.description && <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">{cat.description}</p>}

                                    <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm font-bold">
                                        <span className="text-blue-600 group-hover:text-black transition-colors">
                                            {t('common.enter_store')} {isRTL ? '←' : '→'}
                                        </span>
                                        {cat.order_count > 0 && (
                                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                                                {cat.order_count} {t('common.purchases')}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
