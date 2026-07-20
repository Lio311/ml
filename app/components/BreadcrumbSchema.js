/**
 * BreadcrumbSchema — Server component that generates BreadcrumbList JSON-LD
 * for SEO. Place this anywhere in a page to add structured breadcrumb data
 * that Google can use in search results.
 *
 * Usage:
 *   <BreadcrumbSchema items={[
 *     { name: "קטלוג", url: "https://www.ml-tlv.com/catalog" },
 *     { name: "Product Name" }  // last item — no url = current page
 *   ]} />
 */
export default function BreadcrumbSchema({ items }) {
    if (!items || items.length === 0) return null;

    const baseUrl = 'https://www.ml-tlv.com';

    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "דף הבית",
                "item": baseUrl,
            },
            ...items.map((item, i) => ({
                "@type": "ListItem",
                "position": i + 2,
                "name": item.name,
                ...(item.url ? { "item": item.url } : {}),
            })),
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
