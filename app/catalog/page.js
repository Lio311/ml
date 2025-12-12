import Link from "next/link";
import pool from "../lib/db";
import ProductCard from "../components/ProductCard";
import PriceFilter from "./PriceFilter";
import SortSelect from "./SortSelect";

// Server Component - Fetch data directly
async function getProducts(search, brand, category, minPrice, maxPrice, sort, page = 1) {
    const LIMIT = 16;
    const OFFSET = (page - 1) * LIMIT;

    let query = `
    SELECT * FROM products 
    WHERE active = true
  `;
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        query += ` AND name ILIKE $${params.length}`;
    }

    if (brand) {
        params.push(brand);
        query += ` AND brand = $${params.length}`;
    }

    if (category) {
        params.push(`%${category}%`);
        query += ` AND category ILIKE $${params.length}`;
    }

    if (minPrice) {
        params.push(minPrice);
        query += ` AND price_10ml >= $${params.length}`;
    }

    if (maxPrice) {
        params.push(maxPrice);
        query += ` AND price_10ml <= $${params.length}`;
    }

    // Get Total Count for Pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;

    // Sorting Logic
    let orderBy = 'RANDOM()'; // Default: Random
    switch (sort) {
        case 'price_asc':
            orderBy = 'price_10ml ASC';
            break;
        case 'price_desc':
            orderBy = 'price_10ml DESC';
            break;
        case 'oldest':
            orderBy = 'id ASC';
            break;
        case 'newest':
            orderBy = 'id DESC';
            break;
        case 'random':
        default:
            orderBy = 'RANDOM()';
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
    const sort = searchParams?.sort || 'random';
    const page = parseInt(searchParams?.page || '1');

    const { products, totalPages } = await getProducts(search, brand, category, minPrice, maxPrice, sort, page);
    const allBrands = await getBrands();
    const allCategories = await getCategories();

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-serif font-bold mb-8 text-center">הקטלוג המלא</h1>

            <div className="flex flex-col md:flex-row gap-8">

                {/* Filters Sidebar */}
                <aside className="w-full md:w-64 space-y-6">

                    {/* Search */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-bold mb-4 border-b pb-2">חיפוש</h3>
                        <form action="/catalog" method="get">
                            {brand && <input key="brand" type="hidden" name="brand" value={brand} />}
                            {category && <input key="category" type="hidden" name="category" value={category} />}
                            {maxPrice && <input key="max" type="hidden" name="max" value={maxPrice} />}
                            {sort && <input key="sort" type="hidden" name="sort" value={sort} />}
                            <input
                                type="text"
                                name="q"
                                defaultValue={search}
                                placeholder="חפש בושם..."
                                className="w-full p-2 border rounded text-sm bg-white"
                            />
                        </form>
                    </div>

                    {/* Category Filter */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-bold mb-4 border-b pb-2">קטגוריות ({allCategories.length})</h3>
                        <div className="space-y-2 text-sm max-h-[160px] overflow-y-auto custom-scrollbar pl-2">
                            <Link
                                href={{ pathname: '/catalog', query: { ...searchParams, category: '', page: 1 } }}
                                className={`block ${!category ? 'font-bold underline' : ''}`}
                            >
                                הכל
                            </Link>
                            {allCategories.map(cat => (
                                <Link
                                    key={cat}
                                    href={{
                                        pathname: '/catalog',
                                        query: { ...searchParams, category: cat, page: 1 }
                                    }}
                                    className={`block hover:text-black hover:underline ${category === cat ? 'font-bold text-black' : 'text-gray-600'}`}
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-bold mb-4 border-b pb-2">מותגים ({allBrands.length})</h3>
                        <div className="space-y-2 text-sm max-h-[160px] overflow-y-auto custom-scrollbar pl-2">
                            <Link
                                href={{ pathname: '/catalog', query: { ...searchParams, brand: '', page: 1 } }}
                                className={`block ${!brand ? 'font-bold underline' : ''}`}
                            >
                                כל המותגים
                            </Link>
                            {allBrands.map(b => (
                                <Link
                                    key={b}
                                    href={{
                                        pathname: '/catalog',
                                        query: { ...searchParams, brand: b, page: 1 }
                                    }}
                                    className={`block hover:text-black hover:underline ${brand === b ? 'font-bold text-black' : 'text-gray-600'}`}
                                >
                                    {b}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Price Filter Slider */}
                    <PriceFilter />

                </aside>

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="mb-4 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <span>מציג {products.length} מוצרים (עמוד {page} מתוך {totalPages})</span>

                            {/* Active Filters Summary */}
                            <div className="flex gap-2 text-xs mt-1 flex-wrap">
                                {brand && <span className="bg-black text-white px-2 py-1 rounded">מותג: {brand}</span>}
                                {category && <span className="bg-black text-white px-2 py-1 rounded">קטגוריה: {category}</span>}
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
                        <div className="mt-12 flex justify-center gap-2">
                            {page > 1 && (
                                <Link
                                    href={{
                                        pathname: '/catalog',
                                        query: { ...searchParams, page: page - 1 }
                                    }}
                                    className="btn btn-outline"
                                >
                                    הקודם
                                </Link>
                            )}

                            <span className="flex items-center px-4 font-bold">
                                {page} / {totalPages}
                            </span>

                            {page < totalPages && (
                                <Link
                                    href={{
                                        pathname: '/catalog',
                                        query: { ...searchParams, page: page + 1 }
                                    }}
                                    className="btn btn-outline"
                                >
                                    הבא
                                </Link>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
