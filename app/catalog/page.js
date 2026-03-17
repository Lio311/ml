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
            <div className="mt-24 border-t border-gray-100 pt-16 pb-12 bg-gray-50/50 rounded-3xl px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-serif font-bold mb-10 text-center text-gray-900 relative">
                        דוגמיות בשמים ודיקאנטים - כל מה שצריך לדעת
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-black rounded-full"></span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-12 text-right">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 text-xl">✨</div>
                            <h3 className="text-xl font-bold text-black mb-4">למה כדאי לקנות דוגמיות בשמים?</h3>
                            <p className="leading-relaxed text-gray-600">
                                עולם הבישום הוא רחב ומורכב, ובחירת בושם חדש יכולה להיות משימה מאתגרת. דוגמיות בשמים (Perfume Samples) מאפשרות לכם להתנסות בריחות יוקרה, נישה ובוטיק מבלי להתחייב לבקבוק מלא ויקר. אצלנו ב-ml_tlv תוכלו למצוא מגוון רחב של דוגמיות בשמים מקוריים בקונספט ייחודי המאפשר לחוות את הריח לאורך זמן.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 text-xl">⚱️</div>
                            <h3 className="text-xl font-bold text-black mb-4">מה זה דיקאנט (Decant)?</h3>
                            <p className="leading-relaxed text-gray-600">
                                דיקאנטים הם בשמים שהועברו מהבקבוק המקורי לבקבוקונים קטנים ונוחים לשימוש (בד"כ 2, 5 או 10 מ"ל). זו הדרך הטובה ביותר לקחת את הריח האהוב עליכם לכל מקום, או פשוט לנסות בושם נישה יקר במחיר נגיש לכל כיס. כל הדיקאנטים שלנו מיוצרים תחת בקרה קפדנית ומהבשמים המקוריים ביותר.
                            </p>
                        </div>
                    </div>
                    <div className="mt-12 text-center">
                        <div className="inline-block bg-black text-white px-8 py-3 rounded-full font-serif italic text-lg shadow-lg">
                            ml_tlv - יוקרה בחתיכות קטנות
                        </div>
                        <p className="mt-6 text-gray-400 text-sm max-w-xl mx-auto">
                            מחפשים דוגמיות יוקרה או דיקאנטים של בשמי נישה מהמותגים המובילים בעולם? הגעתם למקום הנכון. אצלנו תהנו ממשלוח מהיר ושירות אישי.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
