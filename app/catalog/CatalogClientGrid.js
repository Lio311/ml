'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { useInView } from 'react-intersection-observer';
import { fetchMoreCatalogProducts } from './actions';
import Link from 'next/link';

export default function CatalogClientGrid({ initialProducts, initialTotalPages, searchParams, locale, tProvider, search, brand, category, minPrice, maxPrice, sort, page: initialPage }) {
    const [products, setProducts] = useState(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [hasMore, setHasMore] = useState(initialTotalPages > initialPage);
    const [isLoading, setIsLoading] = useState(false);
    
    // We need to parse tProvider because we can't pass functions to client components.
    // However, if we just need a few translations, it's better to pass them as strings.
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px', // Fetch when 400px away from bottom
    });

    // Reset state when search parameters change
    useEffect(() => {
        setProducts(initialProducts);
        setPage(initialPage);
        setHasMore(initialTotalPages > initialPage);
    }, [initialProducts, initialTotalPages, initialPage]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const newProducts = await fetchMoreCatalogProducts(
                search, brand, category, minPrice, maxPrice, sort, nextPage, searchParams
            );
            
            if (newProducts.length > 0) {
                setProducts(prev => {
                    // Prevent duplicates just in case
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
    }, [page, hasMore, isLoading, search, brand, category, minPrice, maxPrice, sort, searchParams, initialTotalPages]);

    useEffect(() => {
        if (inView && hasMore) {
            loadMore();
        }
    }, [inView, hasMore, loadMore]);

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

            {hasMore && (
                <div ref={ref} className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                </div>
            )}
        </>
    );
}
