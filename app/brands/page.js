import pool from '../lib/db';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
    title: "המותגים שלנו | ml_tlv",
    description: "גלו את מותגי הנישה והבוטיק המובילים בעולם. כל המותגים במקום אחד.",
};

export const revalidate = 3600; // Cache for 1 hour

export default async function BrandsPage() {
    let brands = [];
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY LOWER(name) ASC');
        brands = res.rows;
        client.release();
    } catch (e) {
        console.error("Failed to fetch brands", e);
    }

    // Group by First Letter for cleaner UI (optional, but requested "ABC list" in dropdown, maybe page should be grid primarily)
    // User asked for: "Logos arranged beautifully on grey background with shadow".

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">המותגים שלנו</h1>
                    <div className="w-16 h-1 bg-black mx-auto"></div>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        אוסף המותגים היוקרתי ביותר של בשמי נישה ובוטיק. לחצו על הלוגו לצפייה בכל הבשמים של המותג.
                    </p>
                </div>

                {brands.length === 0 ? (
                    <p className="text-center text-gray-500">טוען מותגים...</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {brands.map((brand) => (
                            <Link
                                key={brand.name}
                                href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                                className="group block bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center h-40 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Fallback to text if logo fails (handled by alt) but assuming logo exists per query */}
                                    <Image
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        width={120}
                                        height={120}
                                        className="object-contain max-h-24 w-auto filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                </div>
                                <span className="absolute bottom-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                    {brand.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
