import InboxClient from '../components/Chat/InboxClient';

export const metadata = {
    title: "תיבת הודעות",
};

export default async function InboxPage({ searchParams }) {
    // Next.js 13+ app directory requires awaiting searchParams if it's a Promise (especially in v15+)
    const sParams = await searchParams;
    const orderId = sParams.order_id || null;
    const catalogId = sParams.catalog_id || null;

    return (
        <InboxClient role="buyer" initialOrderId={orderId} initialCatalogId={catalogId} />
    );
}
