export default async function CatalogLayout({ children, params }) {
    const { slug } = await params;
    
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {children}
        </div>
    );
}
