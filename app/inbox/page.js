import InboxClient from '../components/Chat/InboxClient';

export const metadata = {
    title: "תיבת הודעות | ml_tlv",
};

export default async function InboxPage({ searchParams }) {
    // Next.js 13+ app directory requires awaiting searchParams if it's a Promise (especially in v15+)
    const sParams = await searchParams;
    const orderId = sParams.order_id || null;
    const catalogId = sParams.catalog_id || null;

    return (
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-12 max-w-5xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8">תיבת הודעות</h1>
            <InboxClient role="buyer" initialOrderId={orderId} initialCatalogId={catalogId} />
        </div>
    );
}
