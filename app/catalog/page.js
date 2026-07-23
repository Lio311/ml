import Link from "next/link";
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import pool, { withClient } from "../lib/db";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "./FilterSidebar";
import SortSelect from "./SortSelect";
import { mapHebrewQuery } from "../lib/hebrewMapping";
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';
import { sanitizeProductArray } from "../lib/productUtils";
import { unstable_cache } from 'next/cache';
import { getProducts } from './dbQueries';
import CatalogClientGrid from './CatalogClientGrid';
import CatalogSEOContent from '../components/CatalogSEOContent';


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
    const { q, brand, category, page } = searchParams;

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
    if (page && page !== '1') params.set('page', page);

    const queryString = params.toString();
    const isFiltered = !!(q || brand || category);
    const hasMultipleFilters = [!!q, !!brand, !!category].filter(Boolean).length > 1;

    let canonical = `${baseUrl}/catalog`;
    if (queryString) {
        canonical = `${baseUrl}/catalog?${queryString}`;
    }

    // SEO Optimization: If ONLY brand is selected, canonicalize to /brands/ page
    if (brand && !q && !category) {
        const brandSlug = encodeURIComponent(brand);
        canonical = page && page !== '1'
            ? `${baseUrl}/brands/${brandSlug}?page=${page}`
            : `${baseUrl}/brands/${brandSlug}`;
    }

    // Prevent indexing of pages with multiple filters to avoid "Alternative page with proper canonical"
    const robots = hasMultipleFilters ? { index: false, follow: true } : { index: true, follow: true };

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        robots,
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'ml-tlv',
            type: 'website',
        },
    };
}


const getBrands = unstable_cache(async () => {
    try {
        const res = await pool.query('SELECT name FROM brands ORDER BY LOWER(name) ASC');
        return res.rows.map(r => r.name);
    } catch (e) {
        return [];
    }
}, ['catalog-brands'], { revalidate: 3600 });

const getCategories = unstable_cache(async () => {
    try {
        const res = await pool.query('SELECT DISTINCT category FROM products WHERE active = true AND (category IS NULL OR category != \'מארזים\') AND (category_en IS NULL OR category_en != \'bundles\')');
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
}, ['catalog-categories'], { revalidate: 3600 });

const getMetadataOptions = unstable_cache(async () => {
    try {
        const res = await pool.query(`
            SELECT 
                array_agg(DISTINCT country) as countries,
                array_agg(DISTINCT perfumers) as perfumers,
                array_agg(DISTINCT top_notes) as top_notes,
                array_agg(DISTINCT middle_notes) as middle_notes,
                array_agg(DISTINCT base_notes) as base_notes,
                array_agg(DISTINCT concentration) as concentrations
            FROM products 
            WHERE active = true
        `);
        
        const countries = (res.rows[0].countries || []).filter(c => c && c !== 'Unknown').sort();
        
        const perfumersSet = new Set();
        (res.rows[0].perfumers || []).forEach(pStr => {
            if (pStr) pStr.split(',').forEach(p => perfumersSet.add(p.trim()));
        });
        const perfumers = Array.from(perfumersSet).filter(Boolean).sort();

        const notesSet = new Set();
        ['top_notes', 'middle_notes', 'base_notes'].forEach(field => {
            (res.rows[0][field] || []).forEach(nStr => {
                if (nStr) nStr.split(',').forEach(n => notesSet.add(n.trim()));
            });
        });
        const notes = Array.from(notesSet).filter(Boolean).sort();

        const concentrations = (res.rows[0].concentrations || []).filter(Boolean).sort();

        return { countries, perfumers, notes, concentrations };
    } catch (e) {
        console.error("Error fetching metadata options:", e);
        return { countries: [], perfumers: [], notes: [], concentrations: [] };
    }
}, ['catalog-metadata-options'], { revalidate: 3600 });

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
    const sort = searchParams?.sort || 'default';
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

    let { products, totalPages } = await getProducts(mappedSearch, brand, category, minPrice, maxPrice, sort, page, searchParams);

    // FIX: Fallback to original search if mapped search yields no results
    // This handles cases where mapping is too aggressive or translation isn't in the DB
    if (products.length === 0 && search && mappedSearch !== search) {
        const fallback = await getProducts(search, brand, category, minPrice, maxPrice, sort, page, searchParams);
        if (fallback.products.length > 0) {
            products = fallback.products;
            totalPages = fallback.totalPages;
        }
    }
    const allBrands = await getBrands();
    const allCategories = await getCategories();
    const { countries: allCountries, perfumers: allPerfumers, notes: allNotes, concentrations: allConcentrations } = await getMetadataOptions();

    const pageTitle = sort === 'bestsellers' ? t('common.bestsellers') : t('common.full_catalog');

    return (
        <main className={`container pt-4 pb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            <Breadcrumbs items={[{ label: t('common.catalog') }]} />
            <BreadcrumbSchema items={[{ name: 'קטלוג' }]} />
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
                    allNotes={allNotes}
                    allConcentrations={allConcentrations}
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
                                {(Array.isArray(searchParams.note) ? searchParams.note : [searchParams.note]).filter(Boolean).map(n => (
                                    <Link key={n} href={getRemoveLink('note', n)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.notes_filter')}: {n}</span>
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors text-[14px] leading-none pb-0.5">×</span>
                                    </Link>
                                ))}
                                {(Array.isArray(searchParams.concentration) ? searchParams.concentration : [searchParams.concentration]).filter(Boolean).map(c => (
                                    <Link key={c} href={getRemoveLink('concentration', c)} className="bg-black text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors group">
                                        <span className="font-medium">{t('common.concentration_filter')}: {t(`concentrations.${c}`)}</span>
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

                    <CatalogClientGrid 
                        initialProducts={products} 
                        initialTotalPages={totalPages} 
                        searchParams={searchParams} 
                        locale={locale} 
                        dir={dir}
                        tProvider={{
                            no_products_found: t('common.no_products_found'),
                            clear_all: t('common.clear_all'),
                            previous: t('common.previous'),
                            next: t('common.next')
                        }}
                        search={mappedSearch}
                        brand={brand}
                        category={category}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        sort={sort}
                        page={page}
                    />
                </div>

            </div>

            {/* SEO Content Section */}
            <CatalogSEOContent />
        </main>
    );
}
