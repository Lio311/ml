import Link from "next/link";
import pool, { withClient } from "../lib/db";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "./FilterSidebar";
import SortSelect from "./SortSelect";
import { mapHebrewQuery } from "../lib/hebrewMapping";
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

const getT = (locale) => {
    const dict = locale === 'en' ? en : he;
    return (key) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result[k]) result = result[k];
            else return key;
        }
        return result;
    };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    const searchParams = await props.searchParams;
    const { q, brand, category } = searchParams;

    let title = t('common.meta_catalog_title');
    let description = t('common.meta_catalog_desc');

    if (brand) {
        title = t('common.meta_brand_title').replace('{brand}', brand);
        description = t('common.meta_brand_desc').replace('{brand}', brand);
    }
    if (category) {
        const catName = category === 'בוטיק' ? t('common.boutique_perfumes') :
                        category === 'נישה' ? t('common.niche_perfumes') : category;
        title = t('common.meta_category_title').replace('{category}', catName);
        description = t('common.meta_category_desc').replace('{category}', catName);
    }
    if (q) {
        title = t('common.meta_search_title').replace('{q}', q);
        description = t('common.meta_search_desc').replace('{q}', q);
    }

    const baseUrl = 'https://www.ml-tlv.com';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (brand) params.set('brand', brand);
    if (category) params.set('category', category);

    const queryString = params.toString();
    const canonical = queryString ? `${baseUrl}/catalog?${queryString}` : `${baseUrl}/catalog`;

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'ml_tlv',
            type: 'website',
        },
    };
}

async function getProducts(search, brand, category, minPrice, maxPrice, sort, page, searchParams) {
    const LIMIT = 16;
    const OFFSET = (page - 1) * LIMIT;

    const joinType = sort === 'bestsellers' ? 'INNER JOIN' : 'LEFT JOIN';

    let query = `
    SELECT p.*, COALESCE(ps.sales_count, 0) as sales_count 
    FROM products p
    ${joinType} product_sales ps ON p.id = ps.product_id
    ${joinType} brands b ON p.brand = b.name
    WHERE p.active = true AND p.stock > 0
  `;
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (p.name ILIKE $${params.length} OR p.brand ILIKE $${params.length} OR p.model ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
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
            const hasSpecialFilter = categories.some(c => c === 'בוטיק' || c === 'נישה');
            const otherCategories = categories.filter(c => c !== 'בוטיק' && c !== 'נישה');
            
            let catCondition = '';
            if (otherCategories.length > 0) {
                const placeHolders = otherCategories.map((_, i) => `p.category ILIKE $${params.length + i + 1}`).join(' OR ');
                catCondition = `(${placeHolders})`;
                params.push(...otherCategories.map(c => `%${c}%`));
            }

            if (hasSpecialFilter) {
                const nicheBoutiqueCondition = "p.category NOT ILIKE '%דיזיינר%'";
                if (catCondition) {
                    query += ` AND (${catCondition} OR ${nicheBoutiqueCondition})`;
                } else {
                    query += ` AND ${nicheBoutiqueCondition}`;
                }
            } else if (catCondition) {
                query += ` AND ${catCondition}`;
            }
        }
    }

    if (minPrice) {
        params.push(minPrice);
        query += ` AND p.price_10ml >= $${params.length}`;
    }

    if (maxPrice) {
        params.push(maxPrice);
        query += ` AND p.price_10ml <= $${params.length}`;
    }

    if (searchParams?.season) {
        const seasons = Array.isArray(searchParams.season) ? searchParams.season : [searchParams.season];
        if (seasons.length > 0) {
            const conditions = seasons.map((_, i) => `p.seasons ILIKE $${params.length + i + 1}`).join(' OR ');
            query += ` AND (${conditions})`;
            params.push(...seasons.map(s => `%${s}%`));
        }
    }

    if (searchParams?.perfumer) {
        const perfumers = Array.isArray(searchParams.perfumer) ? searchParams.perfumer : [searchParams.perfumer];
        if (perfumers.length > 0) {
            const conditions = perfumers.map((_, i) => `p.perfumers ILIKE $${params.length + i + 1}`).join(' OR ');
            query += ` AND (${conditions})`;
            params.push(...perfumers.map(p => `%${p}%`));
        }
    }

    if (searchParams?.country) {
        const countries = Array.isArray(searchParams.country) ? searchParams.country : [searchParams.country];
        if (countries.length > 0) {
            const placeHolders = countries.map((_, i) => `$${params.length + i + 1}`).join(', ');
            query += ` AND p.country IN (${placeHolders})`;
            params.push(...countries);
        }
    }

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;

    let orderBy = 'RANDOM()';
    switch (sort) {
        case 'price_asc':
            orderBy = 'p.price_10ml ASC';
            break;
        case 'price_desc':
            orderBy = 'p.price_10ml DESC';
            break;
        case 'bestsellers':
            orderBy = 'sales_count DESC NULLS LAST, p.name ASC';
            break;
        case 'oldest':
            orderBy = 'p.id ASC';
            break;
        case 'newest':
            orderBy = 'p.id DESC';
            break;
        case 'random':
        default:
            orderBy = 'id DESC';
            break;
    }

    query += ` ORDER BY ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;

    return await withClient(async (client) => {
        const countRes = await client.query(countQuery, params);
        const totalProducts = parseInt(countRes.rows[0].count);

        const res = await client.query(query, params);
        return { products: res.rows, totalProducts, totalPages: Math.ceil(totalProducts / LIMIT) };
    }).catch(error => {
        console.error("DB Error:", error);
        return { products: [], totalProducts: 0, totalPages: 0 };
    });
}

async function getBrands() {
    try {
        const res = await pool.query('SELECT DISTINCT brand FROM products WHERE active = true'); // Direct query is fine here as pool.query handles checkout/release
        const brands = res.rows.map(r => r.brand).filter(b => b && b !== 'Unknown');
        return brands.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    } catch (e) {
        return [];
    }
}

async function getCategories() {
    try {
        const res = await pool.query('SELECT DISTINCT category FROM products WHERE active = true');
        const rawCategories = res.rows.map(r => r.category).filter(c => c && c !== 'General');

        const uniqueCategories = new Set();
        rawCategories.forEach(catStr => {
            catStr.split(',').forEach(c => uniqueCategories.add(c.trim()));
        });

        return Array.from(uniqueCategories).sort();
    } catch (e) {
        console.error("Error fetching categories:", e);
        return [];
    }
}

async function getMetadataOptions() {
    try {
        const res = await pool.query(`
            SELECT 
                array_agg(DISTINCT country) as countries,
                array_agg(DISTINCT perfumers) as perfumers
            FROM products 
            WHERE active = true
        `);
        
        const countries = (res.rows[0].countries || []).filter(c => c && c !== 'Unknown').sort();
        
        const perfumersSet = new Set();
        (res.rows[0].perfumers || []).forEach(pStr => {
            if (pStr) pStr.split(',').forEach(p => perfumersSet.add(p.trim()));
        });
        const perfumers = Array.from(perfumersSet).filter(Boolean).sort();

        return { countries, perfumers };
    } catch (e) {
        console.error("Error fetching metadata options:", e);
        return { countries: [], perfumers: [] };
    }
}

export default async function CatalogPage(props) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
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

    const getRemoveLink = (key, value) => {
        const nextParams = new URLSearchParams();
        
        // Manually build params from the searchParams object (which might have arrays for multi-values)
        Object.entries(searchParams).forEach(([k, v]) => {
            if (Array.isArray(v)) {
                v.forEach(val => {
                    // Only append if it's not the one we're trying to remove
                    if (k !== key || val !== value) {
                        nextParams.append(k, val);
                    }
                });
            } else if (v !== undefined && v !== null && v !== '') {
                // Only append if it's not the one we're trying to remove
                if (k !== key || v !== value) {
                    nextParams.append(k, v);
                }
            }
        });
        
        // Always reset page when changing filters
        nextParams.delete('page');
        const qs = nextParams.toString();
        return `/catalog${qs ? `?${qs}` : ''}`;
    };

    const { products, totalPages } = await getProducts(mappedSearch, brand, category, minPrice, maxPrice, sort, page, searchParams);
    const allBrands = await getBrands();
    const allCategories = await getCategories();
    const { countries: allCountries, perfumers: allPerfumers } = await getMetadataOptions();

    const pageTitle = sort === 'bestsellers' ? t('common.bestsellers') : t('common.full_catalog');

    return (
        <div className={`container py-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            <h1 className="text-3xl font-serif font-bold mb-2 text-center">{pageTitle}</h1>
            <p className="hidden md:block text-sm text-gray-400 text-center mb-10">
                {t('common.showing_products').replace('{count}', products.length).replace('{page}', page).replace('{total}', totalPages)}
            </p>

            <div className="flex flex-col md:flex-row gap-8">

                {/* Filters Sidebar */}
                <FilterSidebar
                    allBrands={allBrands}
                    allCategories={allCategories}
                    allCountries={allCountries}
                    allPerfumers={allPerfumers}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                />

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="mb-4 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">

                            {/* Active Filters Summary */}
                            <div className="flex gap-2 text-xs mt-1 flex-wrap">
                                {(Array.isArray(brand) ? brand : [brand]).filter(Boolean).map(b => (
                                    <Link key={b} href={getRemoveLink('brand', b)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.brand_filter')}: {b}</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                ))}
                                {(Array.isArray(category) ? category : [category]).filter(Boolean).map(c => (
                                    <Link key={c} href={getRemoveLink('category', c)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.category_filter')}: {
                                            c === 'בוטיק' ? t('common.boutique_perfumes') :
                                            c === 'נישה' ? t('common.niche_perfumes') : c
                                        }</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                ))}
                                {searchParams.gender && searchParams.gender !== 'all' && (
                                    <Link href={getRemoveLink('gender', searchParams.gender)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.gender_filter')}: {
                                            searchParams.gender === 'men' ? t('common.men') : 
                                            searchParams.gender === 'women' ? t('common.women') : 
                                            searchParams.gender === 'unisex' ? t('common.unisex') : searchParams.gender
                                        }</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                )}
                                {search && (
                                    <Link href={getRemoveLink('q', search)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.search_filter')}: {search}</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                )}
                                {(Array.isArray(searchParams.season) ? searchParams.season : [searchParams.season]).filter(Boolean).map(s => (
                                    <Link key={s} href={getRemoveLink('season', s)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.season_filter')}: {
                                            s === 'חורף' ? t('common.winter') :
                                            s === 'סתיו' ? t('common.fall') :
                                            s === 'אביב' ? t('common.spring') :
                                            s === 'קיץ' ? t('common.summer') : s
                                        }</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                ))}
                                {(Array.isArray(searchParams.country) ? searchParams.country : [searchParams.country]).filter(Boolean).map(c => (
                                    <Link key={c} href={getRemoveLink('country', c)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.country_filter')}: {c}</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                ))}
                                {(Array.isArray(searchParams.perfumer) ? searchParams.perfumer : [searchParams.perfumer]).filter(Boolean).map(p => (
                                    <Link key={p} href={getRemoveLink('perfumer', p)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.perfumer_filter')}: {p}</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sort Options */}
                        {/* Sort Options */}
                        <div className="flex flex-row justify-center md:justify-end items-center w-full md:w-auto gap-4">
                            <span className="md:hidden text-[11px] text-gray-400 whitespace-nowrap font-medium">
                                {t('common.showing_products').replace('{count}', products.length).replace('{page}', page).replace('{total}', totalPages)}
                            </span>
                            <SortSelect />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-lg">
                            <p className="text-xl text-gray-500">{t('common.no_products_found')}</p>
                            <Link href="/catalog" className="text-blue-600 mt-2 block underline">{t('common.clear_all')}</Link>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex justify-center gap-2 flex-wrap" dir="rtl">
                            {/* Previous Button */}
                            {page > 1 && (
                                <Link
                                    href={{
                                        pathname: '/catalog',
                                        query: { ...searchParams, page: page - 1 }
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-100 transition"
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
                                            pathname: '/catalog',
                                            query: { ...searchParams, page: p }
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center rounded border transition ${p === page
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
                                        pathname: '/catalog',
                                        query: { ...searchParams, page: page + 1 }
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                                >
                                    {t('common.next')}
                                </Link>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* SEO Content Section */}
            <div className="border-t border-gray-100 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-serif font-bold mb-8 text-center text-gray-900 mt-12">
                        {t('common.catalog_seo_title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 text-right pb-12">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                    {/* Perfume Bottle Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v3H9z"/><path d="M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M12 7v14"/><path d="M9 11h6"/><path d="M9 15h6"/></svg>
                                </div>
                                <h3 className={`text-lg font-bold text-black border-black ps-3 leading-none ${dir === 'rtl' ? 'border-r-2' : 'border-l-2'}`}>{t('common.why_samples_title')}</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-600">
                                {t('common.why_samples_desc')}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                    {/* Test Tube / Vial Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v17.5A2.5 2.5 0 0 0 11.5 22h1a2.5 2.5 0 0 0 2.5-2.5V2h-6z"/><path d="M8 2h8"/><path d="M9 7h6"/><path d="M9 12h6"/></svg>
                                </div>
                                <h3 className={`text-lg font-bold text-black border-black ps-3 leading-none ${dir === 'rtl' ? 'border-r-2' : 'border-l-2'}`}>{t('common.what_is_decant_title')}</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-600">
                                {t('common.what_is_decant_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
