import CatalogClient from "./CatalogClient";
import { getBrandName, buildVariants } from "../../lib/brand";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const brandName = await getBrandName();
    const brand = buildVariants(brandName);
    const baseUrl = brand.url;
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
