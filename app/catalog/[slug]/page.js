import CatalogClient from "./CatalogClient";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const baseUrl = 'https://www.ml-tlv.com';
    return {
        title: `קטלוג אישי`,
        description: `צפה בקטלוג ובמוצרים של ${slug}`,
        alternates: {
            canonical: `${baseUrl}/catalog/${slug}`,
        },
    };
}

export default async function CatalogPage({ params }) {
    const { slug } = await params;

    return (
        <div className="container py-8">
            <CatalogClient slug={slug} />
        </div>
    );
}
