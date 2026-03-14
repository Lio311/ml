import { CatalogCartProvider } from "./CatalogCartContext";

export default async function CatalogLayout({ children, params }) {
    // Await params if using Next.js 15
    const { slug } = await params;
    
    return (
        <CatalogCartProvider catalogSlug={slug}>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {children}
            </div>
        </CatalogCartProvider>
    );
}
