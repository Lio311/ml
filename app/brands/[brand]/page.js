import pool from '../../lib/db';
import Image from "@/app/components/CImage";
import ProductCard from '../../components/ProductCard';
import Link from 'next/link';
import { cookies } from 'next/headers';
import he from '../../data/locales/he.json';
import en from '../../data/locales/en.json';
import { sanitizeProductArray, sanitizeProduct } from "../../lib/productUtils";


export const revalidate = 3600; // Cache for 1 hour

const getT = (locale) => {
    const dict = locale === 'en' ? en : he;
    return (key, vars = {}) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result[k]) result = result[k];
            else return key;
        }
        if (typeof result === 'string' && vars) {
            return Object.entries(vars).reduce((str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v), result);
        }
        return result;
    };
};

export async function generateMetadata(props) {
    const params = await props.params;
    const { brand } = params;
    const brandName = decodeURIComponent(brand);
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    return {
        title: t('brands_page.meta_title', { brand: brandName }),
        description: t('brands_page.meta_desc', { brand: brandName }),
        alternates: {
            canonical: `https://www.ml-tlv.com/brands/${brand}`,
        },
        openGraph: {
            title: t('brands_page.og_title', { brand: brandName }),
            description: t('brands_page.og_desc', { brand: brandName }),
        }
    };
}

export default async function BrandPage(props) {
    const params = await props.params;
    const { brand } = params;
    const brandName = decodeURIComponent(brand);
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    const client = await pool.connect();
    let products = [];
    let brandData = null;

    try {
        // Fetch Brand Data (Logo)
        const brandRes = await client.query('SELECT id, name, logo_url FROM brands WHERE name ILIKE $1', [brandName]);
        brandData = sanitizeProduct(brandRes.rows[0]);

        // Fetch Products
        const res = await client.query(`
            SELECT p.id, p.brand, p.model, p.price_2ml, p.price_5ml, p.price_10ml, p.image_url, p.category, p.category_en, p.in_lottery, p.slug, p.description, p.description_en, p.stock, p.brand_he, p.model_he, p.name_en, p.name_he, p.original_size, p.created_at, 
                   p.discount_percentage, p.discount_sizes, p.discount_end_date, p.is_discovery_set, p.is_preorder, p.single_price, p.volume_label, p.volume_label_en, s.sales_count 
            FROM products p 
            LEFT JOIN product_sales s ON p.id = s.product_id
            WHERE p.active = true AND p.brand ILIKE $1
            ORDER BY p.stock > 0 DESC, s.sales_count DESC NULLS LAST
        `, [brandName]);

        products = sanitizeProductArray(res.rows);
    } finally {
        client.release();
    }

    const displayName = brandData?.name || brandName;

    return (
        <div className="container py-12 min-h-screen">
            {/* Breadcrumbs */}
            <div className="text-sm text-gray-500 mb-8 flex gap-2">
                <Link href="/" className="hover:underline">{t('brands_page.home')}</Link> /
                <Link href="/brands" className="hover:underline">{t('brands_page.brands')}</Link> /
                <span className="font-bold text-black">{displayName}</span>
            </div>

            {/* Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                position: 1,
                                "name": t('brands_page.home'),
                                "item": "https://www.ml-tlv.com"
                            },
                            {
                                "@type": "ListItem",
                                position: 2,
                                "name": t('brands_page.brands'),
                                "item": "https://www.ml-tlv.com/brands"
                            },
                            {
                                "@type": "ListItem",
                                position: 3,
                                "name": displayName,
                                "item": `https://www.ml-tlv.com/brands/${brand}`
                            }
                        ]
                    })
                }}
            />

            {/* Header */}
            {brandData?.title ? (
                <div className="flex flex-col-reverse md:flex-row gap-8 mb-16 items-start justify-between">
                    {/* Text Section */}
                    <div className="w-full md:w-2/3 flex flex-col justify-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 leading-tight">
                            {brandData.title}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            {brandData.description}
                        </p>
                        
                        {(brandData.highlights || brandData.perfumer) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {brandData.perfumer && (
                                    <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-center">
                                        <h3 className="text-sm font-bold text-gray-400 mb-2">האף שמאחורי הקלעים</h3>
                                        <p className="text-gray-800 font-medium">{brandData.perfumer}</p>
                                    </div>
                                )}
                                {brandData.highlights && (
                                    <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-center">
                                        <h3 className="text-sm font-bold text-gray-400 mb-2">החתימה של המותג</h3>
                                        <p className="text-gray-800 font-medium">{brandData.highlights}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Logo Section */}
                    <div className="w-full md:w-1/3 flex justify-center md:justify-end">
                        {brandData.logo_url && (
                            <div className="w-64 h-64 relative border border-gray-100 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                <Image
                                    src={brandData.logo_url}
                                    alt={brandData.name}
                                    fill
                                    className="object-contain p-8"
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center mb-12 text-center">
                    {brandData?.logo_url ? (
                        <div className="w-32 h-32 relative mb-6 p-4 border rounded-full bg-white shadow-sm flex items-center justify-center">
                            <Image
                                src={brandData.logo_url}
                                alt={brandData.name}
                                fill
                                className="object-contain p-4"
                            />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4">
                            ✨
                        </div>
                    )}

                    <h1 className="text-4xl font-serif font-bold mb-4">{displayName}</h1>
                    <p className="max-w-4xl text-gray-600">
                        {t('brands_page.description', { brand: displayName })}
                    </p>
                </div>
            )}

            {/* Products Grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-xl text-gray-500">{t('brands_page.no_products')}</p>
                    <Link href="/brands" className="text-blue-600 font-bold mt-4 inline-block">
                        {t('brands_page.back_to_brands')}
                    </Link>
                </div>
            )}
        </div>
    );
}
