import BackInStockClient from "./BackInStockClient";

export const metadata = {
    title: "חזר למלאי Admin",
    robots: "noindex, nofollow",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BackInStockPage() {
    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <BackInStockClient />
            </div>
        </div>
    );
}
