'use server';

import { getProducts } from './dbQueries';

export async function fetchMoreCatalogProducts(search, brand, category, minPrice, maxPrice, sort, page, searchParams) {
    const { products } = await getProducts(search, brand, category, minPrice, maxPrice, sort, page, searchParams);
    // getProducts already returns sanitized products
    return products;
}
