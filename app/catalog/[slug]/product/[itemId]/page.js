import pool from "../../../../lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import FragrancePyramid from "../../../../components/FragrancePyramid";
import CatalogProductActions from "./CatalogProductActions";

export async function generateMetadata({ params }) {
    const { slug, itemId } = await params;

    const res = await pool.query(`
        SELECT i.*, c.name as catalog_name 
        FROM user_catalog_items i
        JOIN user_catalogs c ON i.catalog_id = c.id
        WHERE i.id = $1 AND c.slug = $2
    `, [itemId, slug]);
    
    const item = res.rows[0];
    if (!item) return { title: "מוצר לא נמצא" };

    return {
        title: `${item.name} | ${item.catalog_name}`,
        description: item.description || `קנו את ${item.name} בקטלוג של ${item.catalog_name}`,
    };
}

export default async function CatalogProductPage({ params }) {
    const { slug, itemId } = await params;

    const res = await pool.query(`
        SELECT i.*, c.name as catalog_name, c.slug as catalog_slug, c.image_url as catalog_image
        FROM user_catalog_items i
        JOIN user_catalogs c ON i.catalog_id = c.id
        WHERE i.id = $1 AND c.slug = $2
    `, [itemId, slug]);

    const item = res.rows[0];

    if (!item) {
        notFound();
    }

    return (
        <div className="container py-8 md:py-12 max-w-6xl mx-auto px-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 border-b pb-4">
                <Link href="/" className="hover:text-black">בית</Link>
                <span>/</span>
                <Link href={`/catalog/${slug}`} className="hover:text-black">{item.catalog_name}</Link>
                <span>/</span>
                <span className="font-bold text-black truncate">{item.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
                {/* Product Image */}
                <div className="w-full md:w-1/2 aspect-square bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center p-8 md:p-12 relative overflow-hidden group">
                    {item.image_url ? (
                        <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                        />
                    ) : (
                        <div className="text-9xl opacity-10">🛍️</div>
                    )}
                    
                    {item.gender && (
                        <div className="absolute top-6 left-6 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                            {item.gender}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="w-full md:w-1/2 flex flex-col">
                    <div className="mb-6">
                        <div className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">{item.brand}</div>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">{item.fragrance_name}</h1>
                        <div className="bg-gray-100 inline-block px-3 py-1 rounded-lg text-sm text-gray-600 font-medium mb-6">
                            {item.category}
                        </div>
                        
                        {item.description && (
                            <div className="text-gray-600 leading-relaxed mb-8 text-lg">
                                {item.description}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 md:p-8 mt-auto shadow-sm">
                        <CatalogProductActions item={item} slug={slug} />
                        
                        {/* Fragrance Pyramid */}
                        {(item.top_notes || item.middle_notes || item.base_notes) && (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                                    </svg>
                                    פירמידת הניחוח
                                </h3>
                                <FragrancePyramid 
                                    top={item.top_notes}
                                    middle={item.middle_notes}
                                    base={item.base_notes}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Back to Catalog */}
            <div className="mt-12 text-center">
                <Link href={`/catalog/${slug}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold">
                    <span>&rarr;</span>
                    חזרה לקטלוג המלא
                </Link>
            </div>
        </div>
    );
}
