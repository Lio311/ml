import CatalogClient from "./CatalogClient";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    // We ideally should fetch the catalog name here for SEO, but keeping it simple for now
    return {
        title: `קטלוג אישי | ml_tlv`,
        description: `צפה בקטלוג ובמוצרים של ${slug}`,
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
