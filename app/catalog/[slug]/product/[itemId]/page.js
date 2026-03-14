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

    // Parse category tags - may be comma-separated
    const categoryTags = (item.category || '').split(',').map(c => c.trim()).filter(Boolean);

    return (
        <div className="container py-12">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 justify-end" dir="rtl">
                <Link href="/" className="hover:text-black">בית</Link>
                <span>/</span>
                <Link href={`/catalog/${slug}`} className="hover:text-black">{item.catalog_name}</Link>
                <span>/</span>
                <span className="font-bold text-black truncate">{item.brand} {item.fragrance_name}</span>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-12 mb-20">

                {/* LEFT: Product Info */}
                <div className="w-full md:w-1/2 space-y-8">
                    <div>
                        {/* Category tags */}
                        {categoryTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 justify-end" dir="rtl">
                                {item.gender && (
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{item.gender}</span>
                                )}
                                {categoryTags.map(cat => (
                                    <span key={cat} className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{cat}</span>
                                ))}
                            </div>
                        )}

                        {/* Brand + Name */}
                        <div className="text-right">
                            <h1 className="text-4xl font-bold mb-4">
                                {item.brand} {item.fragrance_name}
                            </h1>
                        </div>

                        {/* Description */}
                        {item.description && (
                            <div className="text-lg text-gray-600 leading-relaxed text-right">
                                {item.description}
                            </div>
                        )}
                    </div>

                    {/* Price + Add to Cart */}
                    <div className="bg-white p-6 rounded-xl">
                        <CatalogProductActions item={item} slug={slug} />

                        {/* Fragrance Pyramid */}
                        <FragrancePyramid
                            top={item.top_notes}
                            middle={item.middle_notes}
                            base={item.base_notes}
                        />
                    </div>
                </div>

                {/* RIGHT: Product Image */}
                <div className="w-full md:w-1/2 aspect-square bg-white rounded-xl flex items-center justify-center relative overflow-hidden shadow-sm p-24 group">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={`${item.brand} ${item.fragrance_name}`}
                            className="w-full h-full object-contain p-8 md:p-12 hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="text-6xl text-gray-300">🧴</div>
                    )}
                </div>
            </div>

            {/* Back to Catalog */}
            <div className="mt-8 text-center border-t pt-8">
                <Link href={`/catalog/${slug}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold">
                    <span>&rarr;</span>
                    חזרה לקטלוג המלא
                </Link>
            </div>
        </div>
    );
}
