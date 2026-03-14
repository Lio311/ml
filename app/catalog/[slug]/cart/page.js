import { Suspense } from "react";
import CatalogCartClient from "./CatalogCartClient";

export const metadata = {
    title: "סל קניות קטלוג אישי | ml_tlv",
    description: "סל הקניות של הרכישה מהקטלוג האישי שלך.",
};

export default async function CatalogCartPage({ params }) {
    const { slug } = await params;
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען עגלה...</div>}>
            <CatalogCartClient slug={slug} />
        </Suspense>
    );
}
