import Link from "next/link";
import pool from "../lib/db";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "./FilterSidebar";
import SortSelect from "./SortSelect";
import { mapHebrewQuery } from "../lib/hebrewMapping";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props) {
    const searchParams = await props.searchParams;
    const { q, brand, category } = searchParams;

    let title = "קטלוג דוגמיות בשמים ודיקאנטים | ml_tlv";
    let description = "כל דוגמיות הבשמים, הדיקאנטים ודוגמיות היוקרה שלנו במקום אחד. מצאו את הריח הבא שלכם.";

    if (brand) {
        title = `${brand} - דוגמיות בשמים ודיקאנטים | ml_tlv`;
        description = `קולקציית דוגמיות הבשמים של מותג ${brand}. הזמינו עכשיו דיקאנטים מקוריים של ${brand}.`;
    }
    if (category) {
        title = `${category} - דוגמיות בשמים ודיקאנטים | ml_tlv`;
        description = `מגוון דוגמיות בשמים מקטגוריית ${category}. בשמי בוטיק ונישה בריחות ${category} מובחרים.`;
    }
    if (q) {
        title = `חיפוש: ${q} | ml_tlv`;
        description = `תוצאות חיפוש עבור ${q} בקטלוג דוגמיות הבשמים של ml_tlv.`;
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
// ...
// ... I need to replace the component body to map the query.

async function getProducts(search, brand, category, minPrice, maxPrice, sort, page) {
    const LIMIT = 16;
    const OFFSET = (page - 1) * LIMIT;

    // Use INNER JOIN for bestsellers to only show items that have sales
    // Use LEFT JOIN for others to show all products
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
            const catConditions = categories.map((_, i) => `p.category ILIKE $${params.length + i + 1}`).join(' OR ');
            query += ` AND (${catConditions})`;
            params.push(...categories.map(c => `%${c}%`));
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

    // Get Total Count for Pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;

    // Sorting Logic
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

    try {
        const client = await pool.connect();
        try {
            const countRes = await client.query(countQuery, params);
            const totalProducts = parseInt(countRes.rows[0].count);

            const res = await client.query(query, params);
            return { products: res.rows, totalProducts, totalPages: Math.ceil(totalProducts / LIMIT) };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("DB Error:", error);
        return { products: [], totalProducts: 0, totalPages: 0 };
    }
}

async function getBrands() {
    try {
        const res = await pool.query('SELECT DISTINCT brand FROM products WHERE active = true'); // Fetch unsorted
        const brands = res.rows.map(r => r.brand).filter(b => b && b !== 'Unknown');
        // Sort case-insensitive in JS
        return brands.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    } catch (e) {
        return [];
    }
}

async function getCategories() {
    try {
        const res = await pool.query('SELECT DISTINCT category FROM products WHERE active = true');
        const rawCategories = res.rows.map(r => r.category).filter(c => c && c !== 'General');

        // Split comma-separated values, trim, and deduplicate
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

export default async function CatalogPage(props) {
    const searchParams = await props.searchParams;
    const search = searchParams?.q || '';
    const brand = searchParams?.brand || '';
    const category = searchParams?.category || '';
    const minPrice = searchParams?.min || '';
    const maxPrice = searchParams?.max || '';
    const sort = searchParams?.sort || 'newest';
    const page = parseInt(searchParams?.page || '1');

    const mappedSearch = await mapHebrewQuery(search);

    const { products, totalPages } = await getProducts(mappedSearch, brand, category, minPrice, maxPrice, sort, page);
    const allBrands = await getBrands();
    const allCategories = await getCategories();

    const pageTitle = sort === 'bestsellers' ? 'הנמכרים ביותר' : 'הקטלוג המלא';

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-serif font-bold mb-8 text-center">{pageTitle}</h1>

            <div className="flex flex-col md:flex-row gap-8">

                {/* Filters Sidebar */}
                <FilterSidebar
                    allBrands={allBrands}
                    allCategories={allCategories}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                />

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="mb-4 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <span>מציג {products.length} מוצרים (עמוד {page} מתוך {totalPages})</span>

                            {/* Active Filters Summary */}
                            <div className="flex gap-2 text-xs mt-1 flex-wrap">
                                {(Array.isArray(brand) ? brand : [brand]).filter(Boolean).map(b => (
                                    <span key={b} className="bg-black text-white px-2 py-1 rounded">מותג: {b}</span>
                                ))}
                                {(Array.isArray(category) ? category : [category]).filter(Boolean).map(c => (
                                    <span key={c} className="bg-black text-white px-2 py-1 rounded">קטגוריה: {c}</span>
                                ))}
                                {search && <span className="bg-black text-white px-2 py-1 rounded">חיפוש: {search}</span>}
                            </div>
                        </div>

                        {/* Sort Options */}
                        <SortSelect />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-lg">
                            <p className="text-xl text-gray-500">לא נמצאו מוצרים תואמים.</p>
                            <Link href="/catalog" className="text-blue-600 mt-2 block underline">נקה הכל</Link>
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
                                    הקודם
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
                                    הבא
                                </Link>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* SEO Content Section */}
            <div className="mt-16 border-t border-gray-100 pt-12 pb-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-serif font-bold mb-8 text-center text-gray-900">
                        מדריך דוגמיות בשמים ודיקאנטים
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 text-right">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-black border-r-2 border-black pr-3 leading-none">למה דוגמיות?</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-600">
                                עולם הבישום הוא רחב ומורכב. דוגמיות בשמים (Perfume Samples) מאפשרות לכם להתנסות בריחות יוקרה, נישה ובוטיק מבלי להתחייב לבקבוק מלא. זו הדרך החכמה ביותר למצוא את הריח המדויק עבורכם במינימום סיכון ומקסימום חוויה.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v10"/><path d="M3 7v10"/><path d="M12 3v18"/><path d="M7 12h10"/><path d="m7 7 10 10"/><path d="m17 7-10 10"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-black border-r-2 border-black pr-3 leading-none">מהו דיקאנט?</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-600">
                                דיקאנט הוא בושם מקורי שהועבר לבקבוקון קטן (2, 5 או 10 מ"ל). זוהי חלופה נהדרת המאפשרת לקחת את הריח האהוב לכל מקום, או לנסות מותגי נישה במחיר נגיש. כל התמציות אצלנו מקוריות לחלוטין ונארזות בקפידה.
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <span className="text-sm font-serif italic text-gray-400">ml_tlv - יוקרה בחתיכות קטנות</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
