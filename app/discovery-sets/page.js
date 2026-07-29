import pool from '../lib/db';
import ProductCard from '../components/ProductCard';
import { cookies } from 'next/headers';
import { sanitizeProductArray } from '../lib/productUtils';
import DiscoveryTimer from './components/DiscoveryTimer';
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { getBrandName, buildVariants } from '../lib/brand';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    
    const brandName = await getBrandName();
    const brand = buildVariants(brandName);
    
    const title = locale === 'he' ? `דיסקברי סט ודוגמיות רשמיות | ${brand.hyphen}` : `Discovery Sets & Official Samples | ${brand.hyphen}`;
    const description = locale === 'he' 
        ? 'מגוון מארזי התנסות ודוגמיות רשמיות של מותגי יוקרה. הדרך המושלמת להכיר את הניחוחות הבאים שלכם.'
        : 'A variety of discovery sets and official samples from luxury brands. The perfect way to explore your next signature scent.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://www.${brand.hyphen}.com/discovery-sets`,
        },
    };
}

export const dynamic = 'force-dynamic';

export default async function DiscoverySetsPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const dir = locale === 'he' ? 'rtl' : 'ltr';
    const title = locale === 'he' ? 'דיסקברי סט ודוגמיות רשמיות' : 'Discovery Sets & Official Samples';
    const subtitle = locale === 'he' 
        ? 'הדרך המושלמת לגלות ניחוחות חדשים לפני שמתחייבים לבקבוק מלא. המארזים והדוגמיות המקוריות הישירות מבתי הבושם המובילים בעולם.'
        : 'The perfect way to discover new scents before committing to a full bottle. Original sets and samples directly from top perfume houses.';

    let products = [];
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT id, slug, name, brand, brand_he, model, model_he, image_url, price_2ml, price_5ml, price_10ml, stock, category, created_at,
                   discount_percentage, discount_sizes, discount_end_date, is_discovery_set, single_price, volume_label
            FROM products 
            WHERE active = true AND is_discovery_set = true AND (category != 'מארזים' OR category IS NULL) AND stock > 0
            ORDER BY created_at DESC
        `);
        products = sanitizeProductArray(res.rows);
        client.release();
    } catch (e) {
        console.error("Failed to fetch discovery sets", e);
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-4 pb-12" dir={dir}>
            <div className="container mx-auto px-4">
                <Breadcrumbs items={[{ label: title }]} />
                <BreadcrumbSchema items={[{ name: title }]} />
                <div className="text-center mb-12">
                    <h1 className="text-[22px] min-[390px]:text-2xl sm:text-3xl md:text-5xl font-black mb-4 tracking-tight whitespace-nowrap md:whitespace-normal">{title}</h1>
                    <div className="w-16 h-1 bg-black mx-auto"></div>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                <DiscoveryTimer />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    
                    {products.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <span className="text-6xl mb-4 block">📦</span>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">
                                {locale === 'he' ? 'בקרוב יעלו מארזים חדשים!' : 'New sets coming soon!'}
                            </h3>
                            <p className="text-gray-500">
                                {locale === 'he' ? 'אנחנו עובדים על מלאי חדש ומרגש.' : 'We are working on exciting new stock.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
