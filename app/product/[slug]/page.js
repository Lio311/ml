import pool from "../../lib/db";
import Link from "next/link";
import Image from "next/image";
import { cookies } from 'next/headers';
import he from '../../data/locales/he.json';
import en from '../../data/locales/en.json';
import { redirect } from 'next/navigation';
import ProductCard from "../../components/ProductCard";
import StarRating from "../../components/StarRating";
import WishlistHeart from "../../components/WishlistHeart";
import FragrancePyramid from "../../components/FragrancePyramid";
import ShareButton from "../../components/ShareButton";
import Breadcrumbs from "../../components/Breadcrumbs";
import BrandInsight from "../../components/BrandInsight";
import AdditionalDetails from "../../components/AdditionalDetails";
import ProductActionsClient from "./ProductActionsClient";
import * as Sentry from "@sentry/nextjs";

const localize = (obj, field, locale) => {
    if (!obj) return '';
    if (locale === 'en') {
        return obj[`${field}_en`] || obj[`${field}_EN`] || obj[field] || '';
    }
    return obj[`${field}_he`] || obj[`${field}_HE`] || obj[field] || '';
};

const getT = (locale) => {
    const dict = locale === 'en' ? en : he;
    return (key) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result[k]) result = result[k];
            else return key;
        }
        return result;
    };
};

export const revalidate = 3600; // SEO Improvement: Cache for 1 hour

export async function generateMetadata(props) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    const params = await props.params;
    const { slug } = params;

    const res = await pool.query(`SELECT * FROM products WHERE slug = $1 OR id::text = $1`, [slug]);
    const product = res.rows[0];

    if (!product) {
        return {
            title: `${t('common.product_not_found')} | ml_tlv`,
            description: t('common.not_found_desc'),
        };
    }

    // SEO: Redirect numeric ID links to Slug links (301)
    // generateMetadata is called before page, so we can't redirect here easily without throwing.
    // We let the Page component handle the redirect. Here we just return canonical.

    const baseUrl = 'https://www.ml-tlv.com';
    const localizedName = localize(product, 'name', locale);
    const localizedDesc = localize(product, 'description', locale);
    
    const title = `${localizedName} | ${t('common.from')}${product.price_2ml}₪`;
    const description = localizedDesc ? localizedDesc.substring(0, 160) : t('common.buy_sample_at').replace('{name}', localizedName);
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
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

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
        return <div className="p-20 text-center">{t('common.product_not_found')}</div>;
    }

    // SEO Redirect: If accessed via ID (or wrong slug case), redirect to canonical slug
    if (product.slug && product.slug !== slug) {
        redirect(`/product/${product.slug}`);
    }

    // Efficient Related Products Fetch (SQL-based similarity)
    let related = [];
    try {
        const notesArray = [
            ...(product.top_notes || '').split(','),
            ...(product.middle_notes || '').split(','),
            ...(product.base_notes || '').split(',')
        ]
        .map(n => n.trim())
        .filter(n => n.length > 2) // Avoid tiny notes
        .slice(0, 6); // Take top 6 notes for search

        const searchPatterns = notesArray.length > 0 ? notesArray.map(n => `%${n}%`) : ['%NONE%'];

        const relatedRes = await pool.query(`
            SELECT id, slug, name, brand, image_url, price_10ml, stock, category
            FROM products 
            WHERE active = true AND id != $1
            AND (
                category = $2 
                OR brand = $3
                OR top_notes ILIKE ANY($4)
                OR middle_notes ILIKE ANY($4)
                OR base_notes ILIKE ANY($4)
            )
            ORDER BY 
                (CASE WHEN brand = $3 THEN 2 ELSE 0 END) + 
                (CASE WHEN category = $2 THEN 1 ELSE 0 END) DESC,
                RANDOM()
            LIMIT 4
        `, [product.id, product.category, product.brand, searchPatterns]);
        
        related = relatedRes.rows;

        // If still not enough, fill with random items
        if (related.length < 4) {
            const excludeIds = [product.id, ...related.map(r => r.id)];
            const fillRes = await pool.query(`
                SELECT id, slug, name, brand, image_url, price_10ml, stock, category
                FROM products 
                WHERE active = true AND id != ALL($1)
                ORDER BY RANDOM()
                LIMIT $2
            `, [excludeIds, 4 - related.length]);
            related = [...related, ...fillRes.rows];
        }

    } catch (e) {
        Sentry.captureException(e);
        console.error("Related products fetch error:", e);
        // Minimum fallback to avoid page crash
        related = [];
    }

    // Format dates for Schema
    const nextYear = new Date().getFullYear() + 1;
    const priceValidUntil = `${nextYear}-12-31`;

    const localizedName_val = localize(product, 'name', locale);
    const localizedDesc_val = localize(product, 'description', locale);
    const localizedCategory = localize(product, 'category', locale);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": localizedName_val,
        "image": product.image_url,
        "description": localizedDesc_val || `Buy ${localizedName_val} sample - Original Niche Perfume`,
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
        { label: t('common.shop'), href: '/catalog' },
        { label: localizedCategory || t('common.perfumes'), href: `/catalog?category=${encodeURIComponent(product.category || '')}` },
        { label: product.brand, href: `/brands/${encodeURIComponent(product.brand)}` },
        { label: localizedName_val }
    ];

    return (
        <div className="container py-8 max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-6">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                {/* Image */}
                <div className="w-full md:w-1/2 aspect-square bg-white rounded-xl flex items-center justify-center relative shadow-sm p-8 md:p-12 group">
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={`${localizedName_val}`}
                            fill
                            priority
                            className="object-contain p-8 md:p-12 hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    ) : (
                        <div className="text-6xl text-gray-300">🧴</div>
                    )}

                    <div className="absolute top-4 start-4 z-10">
                        <WishlistHeart productId={product.id} />
                    </div>

                    <div className="absolute top-4 end-4 z-10">
                        <ShareButton name={product.name} />
                    </div>

                    {product.stock > 0 && product.stock <= 20 && (
                        <span className="absolute top-16 end-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse z-10 shadow-sm border border-red-500">
                            {t('common.limited_stock')}
                        </span>
                    )}
                </div>


                {/* Details */}
                <div className="w-full md:w-1/2 space-y-8">
                    <div>
                        <div className="text-gray-500 mb-2">{localizedCategory}</div>
                        <h1 className="text-4xl font-bold mb-2">{localizedName_val}</h1>

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
                                            "name": t('common.home'),
                                            "item": "https://www.ml-tlv.com"
                                        },
                                        {
                                            "@type": "ListItem",
                                            "position": 2,
                                            "name": t('common.catalog'),
                                            "item": "https://ml-tlv.com/catalog"
                                        },
                                        {
                                            "@type": "ListItem",
                                            "position": 3,
                                            "name": localizedCategory || t('common.perfumes'),
                                            "item": `https://www.ml-tlv.com/catalog?category=${encodeURIComponent(product.category || '')}`
                                        },
                                        {
                                            "@type": "ListItem",
                                            "position": 4,
                                            "name": localizedName_val,
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
                                        <Image
                                            src={product.logo_url}
                                            alt={product.brand}
                                            fill
                                            className="object-contain hover:opacity-80 transition-opacity"
                                            sizes="128px"
                                        />
                                    </Link>
                                </div>
                            )
                        }

                        <div className={`text-lg text-gray-600 leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            {localizedDesc_val || t('common.product_desc_fallback').replace('{category}', localizedCategory)}
                        </div>

                        {/* Fragrance Pyramid Visualization removed from here */}
                    </div >

                    <div className="space-y-6">
                        <h3 className="font-bold mb-4">{t('common.select_size_add_to_cart')}</h3>
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
                            top={localize(product, 'top_notes', locale)}
                            middle={localize(product, 'middle_notes', locale)}
                            base={localize(product, 'base_notes', locale)}
                        />

                        {/* Additional Metadata */}
                        <AdditionalDetails 
                            seasons={localize(product, 'seasons', locale)}
                            country={localize(product, 'country', locale)}
                            perfumers={localize(product, 'perfumers', locale)}
                        />
                    </div>
                </div >
            </div >

            {/* Related Products */}
            {related.length > 0 && (
                <div className="mt-12">
                    <h2 className={`text-2xl font-bold mb-8 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('common.you_might_also_like')}</h2>
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
