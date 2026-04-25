import AdminCatalogItemsClient from "./AdminCatalogItemsClient";

export const metadata = {
    title: "עריכת קטלוג Admin",
    robots: "noindex, nofollow",
};

export default async function AdminCatalogPage({ params }) {
    const { id } = await params;
    
    return (
        <div className="container py-8">
            <AdminCatalogItemsClient catalogId={id} />
        </div>
    );
}
