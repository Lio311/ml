import pool from "../../lib/db";
import Link from "next/link";

import { redirect } from 'next/navigation';
import ProductCard from "../../components/ProductCard";
import StarRating from "../../components/StarRating";
import WishlistHeart from "../../components/WishlistHeart";
import AddToCartAdvanced from "../../components/ProductCard";
import FragrancePyramid from "../../components/FragrancePyramid";
import ShareButton from "../../components/ShareButton";
import Breadcrumbs from "../../components/Breadcrumbs";
import BrandInsight from "../../components/BrandInsight";


export const revalidate = 3600; // SEO Improvement: Cache for 1 hour

export async function generateMetadata(props) {
    const params = await props.params;
    const { slug } = params;

    const res = await pool.query(`SELECT * FROM products WHERE slug = $1 OR id::text = $1`, [slug]);
    const product = res.rows[0];

    if (!product) {
        return {
            title: "מוצר לא נמצא | ml_tlv",
            description: "הבושם שחיפשת לא נמצא.",
        };
    }

    // SEO: Redirect numeric ID links to Slug links (301)
    // generateMetadata is called before page, so we can't redirect here easily without throwing.
    // We let the Page component handle the redirect. Here we just return canonical.

    const baseUrl = 'https://www.ml-tlv.com';
    const title = `${product.name} | החל מ-${product.price_2ml}₪`;
    const description = product.description ? product.description.substring(0, 160) : `קנו דוגמית של ${product.name} באתר ml_tlv. בשמים מקוריים ומיוחדים.`;
    const imageUrl = product.image_url || `${baseUrl}/logo_v3.png`;

    return {
        title: title,
        description: description,
        alternates: {
            canonical: `${baseUrl}/product/${product.slug || product.id}`,
        },
        openGraph: {
            title: title,
            description: description,
            url: `${baseUrl}/product/${product.slug || product.id}`,
            siteName: 'ml_tlv',
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 800,
                    alt: product.name,
                },
            ],
            locale: 'he_IL',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}

export default async function ProductPage(props) {
    const params = await props.params;
    const { slug } = params;

    const res = await pool.query(`
        SELECT p.*, b.logo_url,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
        FROM products p 
        LEFT JOIN brands b ON p.brand = b.name 
        WHERE p.slug = $1 OR p.id::text = $1
    `, [slug]);
    const product = res.rows[0];

    if (!product) {
        return <div className="p-20 text-center">מוצר לא נמצא</div>;
    }

    // SEO Redirect: If accessed via ID (or wrong slug case), redirect to canonical slug
    if (product.slug && product.slug !== slug) {
        redirect(`/product/${product.slug}`);
    }

    // Data for similarity - fetch all products to calculate score
    // Optimally validation should happen in DB, but for ~200 items doing it in memory is fast and flexible for "Jaccard-like" similarity on text tags.
    let related = [];
    try {
        const allProductsRes = await pool.query('SELECT id, slug, name, brand, image_url, price_10ml, is_limited, stock, top_notes, middle_notes, base_notes, category FROM products WHERE id != $1 AND active = true', [product.id]);
        const allProducts = allProductsRes.rows;

        const currentNotes = new Set([
            ...(product.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
            ...(product.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
            ...(product.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
        ]);

        related = allProducts.map(p => {
            const pNotes = new Set([
                ...(p.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                ...(p.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                ...(p.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
            ]);

            // Intersection count
            let intersection = 0;
            pNotes.forEach(note => {
                if (currentNotes.has(note)) intersection++;
            });

            // Jaccard Index = (Intersection) / (Union)
            const union = new Set([...currentNotes, ...pNotes]).size;
            const score = union === 0 ? 0 : intersection / union;

            // Boost if same category
            const categoryBonus = (p.category && product.category && p.category.includes(product.category)) ? 0.1 : 0;

            return { ...p, similarity: score + categoryBonus };
        });

        // Filter products with actual similarity
        let matches = related.filter(p => p.similarity > 0);

        let finalSelection = [];

        if (matches.length >= 4) {
            // Case 1: Enough matches. 
            // Strategy: Take top 8 matches (to ensure relevance) and randomly select 4 from them.
            matches.sort((a, b) => b.similarity - a.similarity);
            const topPool = matches.slice(0, 8);
            finalSelection = topPool.sort(() => 0.5 - Math.random()).slice(0, 4);
        } else {
            // Case 2: Not enough matches (< 4).
            // Strategy: Take all matches, and fill the rest with random products.
            finalSelection = [...matches];

            const countNeeded = 4 - finalSelection.length;
            const alreadySelectedIds = new Set(finalSelection.map(p => p.id));

            // Get candidate pool for filling (everything else)
            // We shuffle the "non-matching" products and take what we need
            const fillPool = allProducts
                .filter(p => !alreadySelectedIds.has(p.id))
                .sort(() => 0.5 - Math.random()) // Shuffle
                .slice(0, countNeeded);

            finalSelection = [...finalSelection, ...fillPool];
        }

        related = finalSelection;

    } catch (e) {
        console.error("Related products error (falling back to category):", e);
        try {
            // Fallback: Simple category match if advanced logic fails
            const fallbackRes = await pool.query('SELECT * FROM products WHERE category = $1 AND id != $2 LIMIT 4', [product.category, product.id]);
            related = fallbackRes.rows;

            // If still not enough (e.g. category has few items), fill with random active products
            if (related.length < 4) {
                const randomRes = await pool.query('SELECT * FROM products WHERE id != $1 AND active = true ORDER BY RANDOM() LIMIT 4', [product.id]);
                // Combine and dedup
                const combined = [...related, ...randomRes.rows].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
                related = combined.slice(0, 4);
            }
        } catch (err2) {
            console.error("Fallback related failed:", err2);
        }
    }

    // Format dates for Schema
    const nextYear = new Date().getFullYear() + 1;
    const priceValidUntil = `${nextYear}-12-31`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image_url,
        "description": product.description || `Buy ${product.name} sample - Original Niche Perfume`,
        "brand": {
            "@type": "Brand",
            "name": product.brand
        },
        "offers": {
            "@type": "Offer",
            "url": `https://www.ml-tlv.com/product/${product.slug || product.id}`,
            "priceCurrency": "ILS",
            "price": product.price_10ml || product.price_5ml || product.price_2ml,
            "availability": (product.stock && product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition",
            "priceValidUntil": priceValidUntil,
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": 30,
                    "currency": "ILS"
                },
                "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "handlingTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 1,
                        "maxValue": 2,
                        "unitCode": "DAY"
                    },
                    "transitTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 3,
                        "maxValue": 5,
                        "unitCode": "DAY"
                    }
                }
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "IL",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 14,
                "returnMethod": "https://schema.org/ReturnByMail"
            }
        }
    };

    // Add AggregateRating only if there are reviews
    if (parseInt(product.review_count) > 0) {
        jsonLd.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": parseFloat(product.average_rating || 0).toFixed(1),
            "reviewCount": product.review_count
        };
    }

    // Prepare breadcrumbs
    const breadcrumbItems = [
        { label: 'חנות', href: '/catalog' },
        { label: product.category || 'בשמים', href: `/catalog?category=${encodeURIComponent(product.category || '')}` },
        { label: product.brand, href: `/brands/${encodeURIComponent(product.brand)}` },
        { label: product.name }
    ];

    return (
        <div className="container py-8 max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-6">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                {/* Image */}
                <div className="w-full md:w-1/2 aspect-square bg-white rounded-xl flex items-center justify-center relative overflow-hidden shadow-sm p-8 md:p-12 group">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={`${product.name} ${product.name_he ? ' - ' + product.name_he : ''}`}
                            className="w-full h-full object-contain p-8 md:p-12 hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="text-6xl text-gray-300">🧴</div>
                    )}

                    <div className="absolute top-4 left-4 z-10">
                        <WishlistHeart productId={product.id} />
                    </div>

                    <div className="absolute top-4 right-4 z-10">
                        <ShareButton name={product.name} />
                    </div>

                    {product.is_limited && (
                        <span className="absolute top-16 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse z-10 shadow-sm border border-red-500">
                            מלאי מוגבל
                        </span>
                    )}
                </div>


                {/* Details */}
                <div className="w-full md:w-1/2 space-y-8">
                    <div>
                        <div className="text-gray-500 mb-2">{product.category}</div>
                        <h1 className="text-4xl font-bold mb-2">{product.name}</h1>

                        <div className="mb-4">
                            <StarRating productId={product.id} />
                        </div>

                        {/* SEO: Structured Data */}
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{
                                __html: JSON.stringify(jsonLd)
                            }}
                        />
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{
                                __html: JSON.stringify({
                                    "@context": "https://schema.org",
                                    "@type": "BreadcrumbList",
                                    "itemListElement": [
                                        {
                                            "@type": "ListItem",
                                            "position": 1,
                                            "name": "בית",
                                            "item": "https://www.ml-tlv.com"
                                        },
                                        {
                                            "@type": "ListItem",
                                            "position": 2,
                                            "name": "קטלוג",
                                            "item": "https://ml-tlv.com/catalog"
                                        },
                                        {
                                            "@type": "ListItem",
                                            "position": 3,
                                            "name": product.category || "כללי",
                                            "item": `https://www.ml-tlv.com/catalog?category=${encodeURIComponent(product.category || '')}`
                                        },
                                        {
                                            "@type": "ListItem",
                                            "position": 4,
                                            "name": product.name,
                                            "item": `https://www.ml-tlv.com/product/${product.slug || product.id}`
                                        }
                                    ]
                                })
                            }}
                        />

                        {
                            product.logo_url && (
                                <div className="mb-6 w-32 h-16 flex items-center justify-start"> {/* Fixed container */}
                                    <Link href={`/brands/${encodeURIComponent(product.brand)}`} className="block w-full h-full relative">
                                        <img
                                            src={product.logo_url}
                                            alt={product.brand}
                                            className="w-full h-full object-contain hover:opacity-80 transition-opacity"
                                        />
                                    </Link>
                                </div>
                            )
                        }

                        <div className="text-lg text-gray-600 leading-relaxed">
                            {product.description || `תיאור מוצר מורחב יבוא כאן... ריחות של ${product.category} בשילוב תווים ייחודיים.`}
                        </div>

                        {/* Fragrance Pyramid Visualization removed from here */}
                    </div >

                    <div className="space-y-6">
                        <h3 className="font-bold mb-4">בחר גודל והוסף לסל:</h3>
                        {/* Reusing ProductCard purely for logic is hacky, but consistent with requested "simple" flow. 
                            Ideally would be refactored, but for now we put a "Card" style adder or just the buttons.
                            To save creating a new component file right now, I will render a specialized client component inline if needed,
                            but actually I'll just use the existing ProductCard logic but hidden? No.
                            
                            Let's just use ProductCard for now as a "mini card" or just let the user use the card below.
                            Wait, the user wants "AddToCart".
                            I'll use a Client Component Wrapper for AddToCart buttons.
                        */}
                        <ProductActionsClient product={product} />

                        {/* Fragrance Pyramid Accordion */}
                        <FragrancePyramid
                            top={product.top_notes}
                            middle={product.middle_notes}
                            base={product.base_notes}
                        />
                    </div>
                </div >
            </div >

            {/* Related Products */}
            {related.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-8 text-right">אולי תאהבו גם</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {related.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            )}

            {/* Brand Insight Section (SEO) */}
            <BrandInsight brand={product.brand} />
        </div >
    );
}

// Simple Client Component for Actions
import ProductActionsClient from "./ProductActionsClient";
