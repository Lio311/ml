import Link from "next/link";
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import pool, { withClient } from "../lib/db";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../catalog/FilterSidebar";
import SortSelect from "../catalog/SortSelect";
import { mapHebrewQuery } from "../lib/hebrewMapping";
import { cookies } from 'next/headers';
import { getT } from '../lib/getT';
import { getBrandName, getBrand } from '../lib/brand';
import { sanitizeProductArray } from "../lib/productUtils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brandNameStr = await getBrandName();
    const t = getT(locale, brandNameStr);
    const brand = await getBrand();

    return {
        title: t('common.sales'),
        description: t('common.meta_catalog_desc'),
        alternates: {
            canonical: `https://www.${brand.hyphen}.com/sales`,
        },
    };
}

async function getSalesProducts(search, brand, category, minPrice, maxPrice, sort, page, searchParams) {
    const LIMIT = 25;
    const OFFSET = (page - 1) * LIMIT;

    let query = `
    SELECT p.*, COALESCE(ps.sales_count, 0) as sales_count 
    FROM products p
    LEFT JOIN product_sales ps ON p.id = ps.product_id
    WHERE p.active = true AND p.stock > 0 AND p.discount_percentage > 0
  `;
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (p.name ILIKE $${params.length} 
            OR p.brand ILIKE $${params.length} 
            OR p.model ILIKE $${params.length} 
            OR p.name_he ILIKE $${params.length}
            OR p.brand_he ILIKE $${params.length}
            OR p.model_he ILIKE $${params.length}
        )`;
    }

    if (brand) {
        const brands = Array.isArray(brand) ? brand : [brand];
        if (brands.length > 0) {
            const placeHolders = brands.map((_, i) => `$${params.length + i + 1}`).join(', ');
            query += ` AND p.brand IN (${placeHolders})`;
            params.push(...brands);
        }
    }

    if (category) {
        const categories = Array.isArray(category) ? category : [category];
        if (categories.length > 0) {
            const placeHolders = categories.map((_, i) => `p.category ILIKE $${params.length + i + 1}`).join(' OR ');
            query += ` AND (${placeHolders})`;
            params.push(...categories.map(c => `%${c}%`));
        }
    }

    if (searchParams?.note) {
        const notes = Array.isArray(searchParams.note) ? searchParams.note : [searchParams.note];
        if (notes.length > 0) {
            const conditions = notes.map((_, i) => `(p.top_notes ILIKE $${params.length + i + 1} OR p.middle_notes ILIKE $${params.length + i + 1} OR p.base_notes ILIKE $${params.length + i + 1})`).join(' OR ');
            query += ` AND (${conditions})`;
            params.push(...notes.map(n => `%${n}%`));
        }
    }

    if (searchParams?.concentration) {
        const concentrations = Array.isArray(searchParams.concentration) ? searchParams.concentration : [searchParams.concentration];
        if (concentrations.length > 0) {
            const placeHolders = concentrations.map((_, i) => `$${params.length + i + 1}`).join(', ');
            query += ` AND p.concentration IN (${placeHolders})`;
            params.push(...concentrations);
        }
    }

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;

    let orderBy = 'p.discount_percentage DESC';
    switch (sort) {
        case 'price_asc': orderBy = 'p.price_10ml ASC'; break;
        case 'price_desc': orderBy = 'p.price_10ml DESC'; break;
        case 'newest': orderBy = 'p.id DESC'; break;
        case 'oldest': orderBy = 'p.id ASC'; break;
    }

    query += ` ORDER BY ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;

    return await withClient(async (client) => {
        const countRes = await client.query(countQuery, params);
        const totalProducts = parseInt(countRes.rows[0].count);
        const res = await client.query(query, params);
        return { products: sanitizeProductArray(res.rows), totalProducts, totalPages: Math.ceil(totalProducts / LIMIT) };
    }).catch(error => {
        console.error("SALES DEBUG - DB Error:", error);
        return { products: [], totalProducts: 0, totalPages: 0 };
    });
}

async function getFilterOptions() {
    try {
        const res = await pool.query(`
            SELECT 
                array_agg(DISTINCT brand) as brands,
                string_agg(category, ',') as all_categories,
                array_agg(DISTINCT country) as countries,
                string_agg(perfumers, ',') as all_perfumers,
                string_agg(top_notes, ',') as top_notes,
                string_agg(middle_notes, ',') as middle_notes,
                string_agg(base_notes, ',') as base_notes,
                array_agg(DISTINCT concentration) as concentrations
            FROM products 
            WHERE active = true AND discount_percentage > 0
        `);
        
        const brands = (res.rows[0].brands || []).filter(Boolean).sort();
        const countries = (res.rows[0].countries || []).filter(c => c && c !== 'Unknown').sort();
        
        const categoriesSet = new Set();
        if (res.rows[0].all_categories) {
            res.rows[0].all_categories.split(',').forEach(c => categoriesSet.add(c.trim()));
        }
        const categories = Array.from(categoriesSet).filter(c => c && c !== 'General').sort();

        const perfumersSet = new Set();
        if (res.rows[0].all_perfumers) {
            res.rows[0].all_perfumers.split(',').forEach(p => perfumersSet.add(p.trim()));
        }
        const perfumers = Array.from(perfumersSet).filter(Boolean).sort();

        const notesSet = new Set();
        ['top_notes', 'middle_notes', 'base_notes'].forEach(field => {
            if (res.rows[0][field]) {
                res.rows[0][field].split(',').forEach(n => notesSet.add(n.trim()));
            }
        });
        const notes = Array.from(notesSet).filter(Boolean).sort();

        const concentrations = (res.rows[0].concentrations || []).filter(Boolean).sort();

        return { brands, categories, countries, perfumers, notes, concentrations };
    } catch (e) {
        return { brands: [], categories: [], countries: [], perfumers: [], notes: [], concentrations: [] };
    }
}

export default async function SalesPage(props) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brandNameStr = await getBrandName();
    const t = getT(locale, brandNameStr);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const searchParams = await props.searchParams;
    const search = searchParams?.q || '';
    const brand = searchParams?.brand || '';
    const category = searchParams?.category || '';
    const minPrice = searchParams?.min || '';
    const maxPrice = searchParams?.max || '';
    const sort = searchParams?.sort || 'newest';
    const page = parseInt(searchParams?.page || '1');

    const mappedSearch = await mapHebrewQuery(search);
    const { products, totalPages } = await getSalesProducts(mappedSearch, brand, category, minPrice, maxPrice, sort, page, searchParams);
    const { brands, categories, countries, perfumers, notes, concentrations } = await getFilterOptions();

    return (
        <div className={`container pt-4 pb-20 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            <Breadcrumbs items={[{ label: t('common.sales') }]} />
            <BreadcrumbSchema items={[{ name: 'מבצעים' }]} />
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-serif font-black mb-4 flex items-center justify-center gap-3">
                    {t('common.sales')}
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    {locale === 'he' 
                        ? 'כל הבשמים הכי שווים במחירים מטורפים. הנחות מיוחדות על גדלים נבחרים.' 
                        : 'The best fragrances at crazy prices. Special discounts on selected sizes.'}
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="hidden md:block">
                    <FilterSidebar
                        allBrands={brands}
                        allCategories={categories}
                        allCountries={countries}
                        allPerfumers={perfumers}
                        allNotes={notes}
                        allConcentrations={concentrations}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        basePath="/sales"
                    />
                </div>

                <div className="flex-1">
                    <div className={`mb-6 flex justify-between items-center bg-green-50 p-4 rounded-2xl border border-green-100 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-green-800 font-bold text-sm md:text-base">
                            {t('common.showing_products').replace('{count}', products.length).replace('{page}', page).replace('{total}', totalPages)}
                        </span>
                        <SortSelect basePath="/sales" />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <span className="text-gray-300 mb-4 block">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M2 12h20" className="opacity-20" />
                                    <path d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6z" />
                                    <path d="M9 3v18M15 3v18" />
                                </svg>
                            </span>
                            <p className="text-xl text-gray-500 font-bold">{t('common.no_products_found')}</p>
                            <Link href="/catalog" className="text-black mt-4 inline-block font-black underline">{t('common.clear_all')}</Link>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex justify-center gap-2 flex-wrap" dir={dir}>
                            {/* Previous Button */}
                            {page > 1 && (
                                <Link
                                    href={{
                                        pathname: '/sales',
                                        query: { ...searchParams, page: page - 1 }
                                    }}
                                    className="px-4 py-2 border-2 rounded hover:bg-gray-100 transition font-bold"
                                >
                                    {t('common.previous')}
                                </Link>
                            )}

                            {/* Page Numbers */}
                            {(() => {
                                let start = Math.max(1, page - 1);
                                let end = Math.min(totalPages, page + 1);

                                // Adjust to always show 3 if possible
                                if (page === 1) end = Math.min(totalPages, 3);
                                if (page === totalPages) start = Math.max(1, totalPages - 2);

                                const pages = [];
                                for (let i = start; i <= end; i++) {
                                    pages.push(i);
                                }
                                return pages.map(p => (
                                    <Link
                                        key={p}
                                        href={{
                                            pathname: '/sales',
                                            query: { ...searchParams, page: p }
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center rounded border-2 transition font-bold ${p === page
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </Link>
                                ));
                            })()}

                            {/* Next Button */}
                            {page < totalPages && (
                                <Link
                                    href={{
                                        pathname: '/sales',
                                        query: { ...searchParams, page: page + 1 }
                                    }}
                                    className="px-4 py-2 border-2 rounded hover:bg-gray-100 transition font-bold"
                                >
                                    {t('common.next')}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
