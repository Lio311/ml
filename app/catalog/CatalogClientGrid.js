'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { useInView } from 'react-intersection-observer';
import { fetchMoreCatalogProducts } from './actions';
import Link from 'next/link';

export default function CatalogClientGrid({ initialProducts, initialTotalPages, searchParams, locale, dir, tProvider, search, brand, category, minPrice, maxPrice, sort, page: initialPage }) {
    const [products, setProducts] = useState(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [hasMore, setHasMore] = useState(initialTotalPages > initialPage);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
        skip: !isMobile || !hasMore // Don't observe if on desktop or no more items
    });

    // Reset state when search parameters change
    useEffect(() => {
        setProducts(initialProducts);
        setPage(initialPage);
        setHasMore(initialTotalPages > initialPage);
    }, [initialProducts, initialTotalPages, initialPage]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore || !isMobile) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const newProducts = await fetchMoreCatalogProducts(
                search, brand, category, minPrice, maxPrice, sort, nextPage, searchParams
            );
            
            if (newProducts.length > 0) {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                setPage(nextPage);
                if (nextPage >= initialTotalPages) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more products", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, hasMore, isLoading, isMobile, search, brand, category, minPrice, maxPrice, sort, searchParams, initialTotalPages]);

    useEffect(() => {
        if (inView && hasMore && isMobile) {
            loadMore();
        }
    }, [inView, hasMore, isMobile, loadMore]);

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product, idx) => (
                    <ProductCard key={`${product.id}-${idx}`} product={product} />
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-xl text-gray-500">{tProvider.no_products_found}</p>
                    <Link href="/catalog" className="text-blue-600 mt-2 block underline">{tProvider.clear_all}</Link>
                </div>
            )}

            {/* Mobile Infinite Scroll Loader */}
            {isMobile && hasMore && (
                <div ref={ref} className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                </div>
            )}

            {/* Desktop Classic Pagination */}
            {!isMobile && initialTotalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2 flex-wrap" dir={dir}>
                    {/* Previous Button */}
                    {initialPage > 1 && (
                        <Link
                            href={{
                                pathname: '/catalog',
                                query: { ...searchParams, page: initialPage - 1 }
                            }}
                            className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                        >
                            {tProvider.previous}
                        </Link>
                    )}

                    {/* Page Numbers */}
                    {(() => {
                        let start = Math.max(1, initialPage - 1);
                        let end = Math.min(initialTotalPages, initialPage + 1);

                        if (initialPage === 1) end = Math.min(initialTotalPages, 3);
                        if (initialPage === initialTotalPages) start = Math.max(1, initialTotalPages - 2);

                        const pages = [];
                        for (let i = start; i <= end; i++) {
                            pages.push(i);
                        }
                        return pages.map(p => (
                            <Link
                                key={p}
                                href={{
                                    pathname: '/catalog',
                                    query: { ...searchParams, page: p }
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded border transition ${p === initialPage
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                {p}
                            </Link>
                        ));
                    })()}

                    {/* Next Button */}
                    {initialPage < initialTotalPages && (
                        <Link
                            href={{
                                pathname: '/catalog',
                                query: { ...searchParams, page: initialPage + 1 }
                            }}
                            className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                        >
                            {tProvider.next}
                        </Link>
                    )}
                </div>
            )}
        </>
    );
}
