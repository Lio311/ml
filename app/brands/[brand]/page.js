import pool from '../../../lib/db';
import ProductCard from '../../../components/ProductCard';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(props) {
    const params = await props.params;
    const { brand } = params;
    const brandName = decodeURIComponent(brand);

    return {
        title: `${brandName} - דוגמיות בשמים | ml_tlv`,
        description: `קולקציית בשמי ${brandName} באתר ml_tlv. הזמינו דוגמיות של ${brandName} במשלוח מהיר.`,
        openGraph: {
            title: `${brandName} - דוגמיות בשמים`,
            description: `קולקציית בשמי ${brandName} המלאה.`,
        }
    };
}

export default async function BrandPage(props) {
    const params = await props.params;
    const { brand } = params;
    const brandName = decodeURIComponent(brand);

    const client = await pool.connect();
    let products = [];
    let brandData = null;

    try {
        // Fetch Brand Data (Logo)
        const brandRes = await client.query('SELECT * FROM brands WHERE name ILIKE $1', [brandName]);
        brandData = brandRes.rows[0];

        // Fetch Products
        // Note: We use case-insensitive matching for brand name to ensure we catch everything
        const res = await client.query(`
            SELECT p.*, s.sales_count 
            FROM products p 
            LEFT JOIN product_sales s ON p.id = s.product_id
            WHERE p.active = true AND p.brand ILIKE $1
            ORDER BY p.stock > 0 DESC, s.sales_count DESC NULLS LAST
        `, [brandName]);

        products = res.rows;
    } finally {
        client.release();
    }

    return (
        <div className="container py-12 min-h-screen">
            {/* Breadcrumbs */}
            <div className="text-sm text-gray-500 mb-8 flex gap-2">
                <Link href="/" className="hover:underline">בית</Link> /
                <Link href="/brands" className="hover:underline">מותגים</Link> /
                <span className="font-bold text-black">{brandData?.name || brandName}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center mb-12 text-center">
                {brandData?.logo_url ? (
                    <div className="w-32 h-32 relative mb-6 p-4 border rounded-full bg-white shadow-sm flex items-center justify-center">
                        <img
                            src={brandData.logo_url}
                            alt={brandData.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4">
                        ✨
                    </div>
                )}

                <h1 className="text-4xl font-serif font-bold mb-4">{brandData?.name || brandName}</h1>
                <p className="max-w-2xl text-gray-600">
                    כל הבשמים של {brandData?.name || brandName} זמינים עכשיו כדוגמיות בגדלים שונים.
                    בחרו את הריח הבא שלכם מהקולקציה היוקרתית שלנו.
                </p>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-xl text-gray-500">לא נמצאו מוצרים למותג זה כרגע.</p>
                    <Link href="/brands" className="text-blue-600 font-bold mt-4 inline-block">
                        לחזרה לכל המותגים
                    </Link>
                </div>
            )}
        </div>
    );
}
