import AdminCatalogItemsClient from "./AdminCatalogItemsClient";

export default async function AdminCatalogPage({ params }) {
    const { id } = await params;
    
    return (
        <div className="container py-8">
            <AdminCatalogItemsClient catalogId={id} />
        </div>
    );
}
