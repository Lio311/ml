import pool from "../../lib/db";
import Link from "next/link";
import Image from "next/image";
import { cookies, headers } from 'next/headers';
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
import ProductFAQ from "../../components/ProductFAQ";
import { sanitizeProduct, sanitizeProductArray } from "../../lib/productUtils";


import AdditionalDetails from "../../components/AdditionalDetails";
import ProductActionsClient from "./ProductActionsClient";
import * as Sentry from "@sentry/nextjs";

const localize = (obj, field, locale) => {
    if (!obj) return '';
    if (locale === 'en') {
        const val = obj[`${field}_en`] || obj[`${field}_EN`] || obj[field];
        return val ? String(val) : '';
    }
    const val = obj[`${field}_he`] || obj[`${field}_HE`] || obj[field];
    return val ? String(val) : '';
};


const translateCategory = (cat, locale) => {
    if (!cat || locale !== 'en') return cat;
    return cat.split(',').map(part => {
        const trimmed = part.trim();
        const dict = en;
        const mapped = dict.category_map?.[trimmed];
        return mapped || trimmed;
    }).join(', ');
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
    try {
        const cookieStore = await cookies();
        const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
        const t = getT(locale);

        const params = await props.params;
        const { slug } = params;
        
        // Lean query for metadata
        const res = await pool.query(`
            SELECT id, slug, brand, brand_he, model, model_he, name, name_he, description, description_he, image_url, category, stock 
            FROM products 
            WHERE slug = $1 OR id::text = $1 
            LIMIT 1
        `, [slug]);
        
        const rawProduct = res.rows[0];
        if (!rawProduct) {
            return {
                title: `${t('common.product_not_found')} | ml-tlv`,
                description: t('common.not_found_desc'),
            };
        }

        const product = sanitizeProduct(rawProduct);

        const headerData = await headers();
        const host = headerData.get('host') || 'www.ml-tlv.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const localizedName = locale === 'he' 
            ? `${product.brand_he || product.brand} ${product.model_he || product.model}` 
            : localize(product, 'name', locale);
        const localizedDesc = localize(product, 'description', locale);
        
        const sampleLabel = locale === 'he' ? 'דוגמית בושם מקורית' : 'Original Perfume Sample';
        const title = `${localizedName} - ${sampleLabel} | ml-tlv`;
        const description = localizedDesc ? localizedDesc.substring(0, 160) : t('common.buy_sample_at').replace('{name}', localizedName);
        const rawImageUrl = product.image_url || `${baseUrl}/logo_v3.png`;
        
        // Ensure image URL is absolute for the OG route to fetch it
        const ogImageUrl = product.image_url 
            ? (product.image_url.startsWith('http') ? product.image_url : `${baseUrl}${product.image_url}`)
            : `${baseUrl}/logo_v5.png`;

        const productSlug = product.slug || product.id;
        const canonicalUrl = `${baseUrl}/product/${productSlug}`;

        return {
            title: title,
            description: description,
            alternates: {
                canonical: canonicalUrl,
                languages: {
                    'he-IL': canonicalUrl,
                    'en-US': `${canonicalUrl}?lang=en`,
                    'x-default': canonicalUrl,
                },
            },
            openGraph: {
                title: title,
                description: description,
                url: canonicalUrl,
                siteName: 'ml-tlv',
                locale: 'he_IL',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: description,
            },
        };
    } catch (metaErr) {
        console.error('[ProductPage] generateMetadata crashed:', metaErr);
        Sentry.captureException(metaErr);
        return { title: 'ml-tlv | Product' };
    }
}

export default async function ProductPage(props) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const params = await props.params;
    const { slug } = params;

    let rawProduct;
    try {
        const res = await pool.query(`
            SELECT p.id, p.slug, p.brand, p.brand_he, p.model, p.model_he, p.name, p.name_he, p.description, p.description_he, p.image_url, p.category, p.stock, p.top_notes, p.middle_notes, p.base_notes, p.price_2ml, p.price_5ml, p.price_10ml, p.seasons, p.country, p.perfumers, b.logo_url,
            (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as average_rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
            FROM products p 
            LEFT JOIN brands b ON p.brand = b.name 
            WHERE p.slug = $1 OR p.id::text = $1
            LIMIT 1
        `, [slug]);
        rawProduct = res.rows[0];
    } catch (dbErr) {
        console.error('[ProductPage] Main query crashed:', dbErr);
        Sentry.captureException(dbErr);
        return <div className="p-20 text-center text-red-600">שגיאה בטעינת המוצר. אנא נסו שוב מאוחר יותר.</div>;
    }

    if (!rawProduct) {
        return <div className="p-20 text-center">{t('common.product_not_found')}</div>;
    }

    const product = sanitizeProduct(rawProduct);

    // SEO Redirect: If accessed via ID (or wrong slug case), redirect to canonical slug
    if (product.slug && product.slug !== slug) {
        redirect(`/product/${product.slug}`);
    }

    // GEO: Fetch top reviews for Schema.org Review markup (AI citability signals)
    let topReviews = [];
    try {
        const reviewsRes = await pool.query(`
            SELECT rating, content, created_at
            FROM reviews
            WHERE product_id = $1 AND content IS NOT NULL AND content != '' AND rating >= 4
            ORDER BY rating DESC, created_at DESC
            LIMIT 3
        `, [product.id]);
        topReviews = sanitizeProductArray(reviewsRes.rows);
    } catch(e) {
        // Non-critical: reviews fetch failed, schema will just omit Review nodes
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
            SELECT id, slug, name, brand, brand_he, model, model_he, image_url, price_2ml, price_5ml, price_10ml, stock, category, created_at
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
        
        related = sanitizeProductArray(relatedRes.rows);

        // If still not enough, fill with random items
        if (related.length < 4) {
            const excludeIds = [product.id, ...related.map(r => r.id)];
            const fillRes = await pool.query(`
            SELECT id, slug, name, brand, brand_he, model, model_he, image_url, price_2ml, price_5ml, price_10ml, stock, category, created_at
            FROM products 
            WHERE active = true AND id != ALL($1)
            ORDER BY RANDOM()
            LIMIT $2
        `, [excludeIds, 4 - related.length]);
            related = [...related, ...sanitizeProductArray(fillRes.rows)];
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

    const localizedName_val = locale === 'he'
        ? `${product.brand_he || product.brand} ${product.model_he || product.model}`
        : localize(product, 'name', locale);
    const localizedDesc_val = localize(product, 'description', locale);
    const localizedCategory = translateCategory(localize(product, 'category', locale), locale);

    const headerData = await headers();
    const host = headerData.get('host') || 'www.ml-tlv.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // GEO: Shared shipping & return details (reused across all per-size offers)
    const shippingDetails = {
        "@type": "OfferShippingDetails",
        "shippingRate": { "@type": "MonetaryAmount", "value": 30, "currency": "ILS" },
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "IL" },
        "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
            "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY" }
        }
    };
    const returnPolicy = {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IL",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
    };
    const inStock = (product.stock && product.stock > 0);
    const availability = inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;

    const buildOffer = (size, price) => ({
        "@type": "Offer",
        "name": `${localizedName_val} - ${size}ml`,
        "sku": `ML${product.id}-${size}ML`,
        "price": price,
        "priceCurrency": "ILS",
        "availability": availability,
        "itemCondition": "https://schema.org/NewCondition",
        "priceValidUntil": priceValidUntil,
        "url": productUrl,
        "shippingDetails": shippingDetails,
        "hasMerchantReturnPolicy": returnPolicy
    });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": localizedName_val,
        "image": product.image_url,
        "description": localizedDesc_val || `${localizedName_val} - Original Niche Perfume Sample | ml-tlv`,
        "sku": `ML${product.id}`,
        "mpn": `ML${product.id}`,
        "brand": { "@type": "Brand", "name": product.brand },
        "offers": [
            ...(product.price_2ml ? [buildOffer(2, product.price_2ml)] : []),
            ...(product.price_5ml ? [buildOffer(5, product.price_5ml)] : []),
            ...(product.price_10ml ? [buildOffer(10, product.price_10ml)] : []),
        ].filter(Boolean),
    };

    // GEO: AggregateRating — required for star rich snippets in Google SERPs
    if (parseInt(product.review_count) > 0) {
        jsonLd.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": parseFloat(product.average_rating || 0).toFixed(1),
            "reviewCount": parseInt(product.review_count),
            "bestRating": 5,
            "worstRating": 1
        };
    }

    // GEO: Inject Review nodes — signals to AI engines (Perplexity, ChatGPT) for citation quality
    if (topReviews.length > 0) {
        jsonLd.review = topReviews
            .filter(r => r.content && r.content.trim().length > 10)
            .map(r => {
                const reviewDate = r.created_at ? new Date(r.created_at) : new Date();
                const isoDate = !isNaN(reviewDate.getTime()) ? reviewDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                
                return {
                    "@type": "Review",
                    "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5, "worstRating": 1 },
                    "author": { "@type": "Person", "name": locale === 'he' ? 'לקוח מאומת' : 'Verified Customer' },
                    "reviewBody": String(r.content || '').trim(),
                    "datePublished": isoDate
                };
            });
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
                            alt={locale === 'he' ? `דוגמית בושם ${localizedName_val} בנפח 2-10 מ"ל, בקבוקון זכוכית עם מתז - ml-tlv` : `${localizedName_val} perfume sample decant 2-10ml glass atomizer - ml-tlv`}
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
                    <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <div className="text-gray-500 mb-2">{localizedCategory}</div>
                        <h1 className="text-4xl font-bold mb-6">{localizedName_val}</h1>

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

                        {/* GEO: FAQPage Schema per-product — enables Google rich FAQ snippets per product URL */}
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{
                                __html: JSON.stringify({
                                    "@context": "https://schema.org",
                                    "@type": "FAQPage",
                                    "mainEntity": [
                                        {
                                            "@type": "Question",
                                            "name": locale === 'he' ? `האם ה${localizedName_val} מקורי ב-100%?` : `Is the ${localizedName_val} 100% original?`,
                                            "acceptedAnswer": {
                                                "@type": "Answer",
                                                "text": locale === 'he'
                                                    ? 'כן. כל הבשמים נרכשים מהיבואנים הרשמיים בלבד. אנחנו לא מתעסקים עם חיקויים או בשמי טסטר ממקורות לא ידועים.'
                                                    : 'Yes. All perfumes are purchased exclusively from official importers. We do not deal with imitations or testers from unknown sources.'
                                            }
                                        },
                                        {
                                            "@type": "Question",
                                            "name": locale === 'he' ? 'כמה התזות יש בכל גודל?' : 'How many sprays are in each size?',
                                            "acceptedAnswer": {
                                                "@type": "Answer",
                                                "text": locale === 'he'
                                                    ? 'דוגמית 2 מ"ל: כ-25–30 התזות. 5 מ"ל: כ-75 התזות. 10 מ"ל: כ-150 התזות — מה שמספיק לשבועות של שימוש יומיומי.'
                                                    : '2ml sample: ~25–30 sprays. 5ml: ~75 sprays. 10ml: ~150 sprays — enough for weeks of daily use.'
                                            }
                                        },
                                        {
                                            "@type": "Question",
                                            "name": locale === 'he' ? 'איך מתבצע תהליך המילוי?' : 'How is the decanting process done?',
                                            "acceptedAnswer": {
                                                "@type": "Answer",
                                                "text": locale === 'he'
                                                    ? 'המילוי מתבצע בסביבה סטרילית עם מזרקים חד-פעמיים, ישירות מהבקבוק המקורי ללא מגע יד אדם.'
                                                    : 'Filling is done in a sterile environment using disposable syringes directly from the original bottle, with no human contact.'
                                            }
                                        },
                                        {
                                            "@type": "Question",
                                            "name": locale === 'he' ? 'כמה זמן לוקח המשלוח?' : 'How long does shipping take?',
                                            "acceptedAnswer": {
                                                "@type": "Answer",
                                                "text": locale === 'he'
                                                    ? 'משלוח עד 7 ימי עסקים לפי תקנון UPS. ניתן גם לאסוף בחינם מצפון תל אביב.'
                                                    : 'Up to 7 business days via UPS policy. Free pickup available from North Tel Aviv.'
                                            }
                                        }
                                    ]
                                })
                            }}
                        />

                        {
                            product.logo_url && (
                                <div className={`mb-4 flex`} dir={dir}>
                                    <div className="w-32 h-16 relative">
                                        <Link href={`/brands/${encodeURIComponent(product.brand)}`} className="block w-full h-full">
                                            <Image
                                                src={product.logo_url}
                                                alt={product.brand}
                                                fill
                                                className="object-contain hover:opacity-80 transition-opacity"
                                                sizes="128px"
                                            />
                                        </Link>
                                    </div>
                                </div>
                            )
                        }

                        <div className="mb-6">
                            <StarRating productId={product.id} />
                        </div>

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

            {/* GEO: Why Buy From Us — full-width icon grid (Trust signals for users & AI engines) */}
            <div className="mt-16 py-12 border-t border-gray-100" dir={dir}>
                <h2 className="text-2xl font-bold text-center mb-10">
                    {locale === 'he' ? 'למה לקנות אצלנו' : 'Why Buy From Us'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        {
                            label: locale === 'he' ? 'בשמים מקוריים באחריות' : '100% Original Perfumes',
                            sub: locale === 'he' ? 'נרכשים מיבואנים רשמיים בלבד' : 'From official importers only',
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <polyline points="9 12 11 14 15 10" />
                                </svg>
                            )
                        },
                        {
                            label: locale === 'he' ? 'מילוי סטרילי ומקצועי' : 'Sterile & Professional Filling',
                            sub: locale === 'he' ? 'מזרקים חד-פעמיים, ללא מגע יד' : 'Disposable syringes, no hand contact',
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m18 2 4 4"/>
                                    <path d="m17 7 3-3"/>
                                    <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
                                    <path d="m9 11 4 4"/>
                                    <path d="m5 19-3 3"/>
                                    <path d="m14 4 6 6"/>
                                </svg>
                            )
                        },
                        {
                            label: locale === 'he' ? 'משלוח עד הבית' : 'Fast Home Delivery',
                            sub: locale === 'he' ? 'עד 7 ימי עסקים | פיקאפ חינם' : 'Up to 7 business days | Free pickup',
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="3" width="15" height="13" rx="1" />
                                    <path d="M16 8h4l3 5v3h-7V8z" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                            )
                        },
                        {
                            label: locale === 'he' ? 'שירות לקוחות מעולה' : 'Excellent Customer Service',
                            sub: locale === 'he' ? 'זמינים בוואטסאפ ובמייל' : 'Available via WhatsApp & email',
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    <line x1="9" y1="10" x2="15" y2="10" />
                                    <line x1="12" y1="7" x2="12" y2="13" />
                                </svg>
                            )
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-3">
                            <div className="text-gray-700">{item.icon}</div>
                            <div>
                                <p className="font-bold text-sm text-gray-900 leading-snug">{item.label}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* GEO: Embedded Product FAQ — structured Q&A for AI snippet & rich-result extraction */}
            <div className="mt-12 pb-8" dir={dir}>
                <h2 className={`text-2xl font-bold mb-8 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {locale === 'he' ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
                </h2>
                <ProductFAQ
                    dir={dir}
                    items={locale === 'he' ? [
                        { q: 'האם הבושם מקורי ב-100%?', a: 'כן. כל הבשמים נרכשים מהיבואנים הרשמיים בלבד. אנחנו לא מתעסקים עם חיקויים או בשמי טסטר ממקורות לא ידועים.' },
                        { q: 'כמה התזות יש בכל גודל?', a: 'דוגמית 2 מ"ל: כ-25–30 התזות. 5 מ"ל: כ-75 התזות. 10 מ"ל: כ-150 התזות — מה שמספיק לשבועות של שימוש יומיומי.' },
                        { q: 'איך מתבצע תהליך המילוי?', a: 'המילוי מתבצע בסביבה סטרילית עם מזרקים חד-פעמיים, ישירות מהבקבוק המקורי ללא מגע יד אדם.' },
                        { q: 'כמה זמן לוקח המשלוח?', a: 'משלוח עד 7 ימי עסקים לפי תקנון UPS. ניתן גם לאסוף בחינם מצפון תל אביב.' },
                    ] : [
                        { q: 'Are the perfumes 100% original?', a: 'Yes. All perfumes are purchased exclusively from official importers. We do not deal with imitations or testers from unknown sources.' },
                        { q: 'How many sprays per size?', a: '2ml sample: ~25–30 sprays. 5ml: ~75 sprays. 10ml: ~150 sprays — enough for weeks of daily use.' },
                        { q: 'How is the decanting process done?', a: 'Filling is done in a sterile environment using disposable syringes directly from the original bottle, with no human contact. The perfume is 100% identical to the original.' },
                        { q: 'How long does shipping take?', a: '3–5 business days on average. Free pickup is also available from 19 Washington St, Tel Aviv.' },
                    ]}
                />
            </div>

            {/* Brand Insight Section (SEO) */}
            <BrandInsight brand={product.brand} />
        </div >
    );
}
