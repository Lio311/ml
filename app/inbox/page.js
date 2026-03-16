import InboxClient from '../components/Chat/InboxClient';

export const metadata = {
    title: "תיבת הודעות | ml_tlv",
};

export default function InboxPage({ searchParams }) {
    // Next.js 13+ app directory allows reading searchParams in page components directly
    const orderId = searchParams.order_id || null;
    const catalogId = searchParams.catalog_id || null;

    return (
        <div className="container py-12 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">תיבת הודעות</h1>
            <InboxClient role="buyer" initialOrderId={orderId} initialCatalogId={catalogId} />
        </div>
    );
}
