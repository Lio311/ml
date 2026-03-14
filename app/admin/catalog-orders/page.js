import CatalogOrdersClient from "./CatalogOrdersClient";

export const metadata = {
    title: "הזמנות קטלוגים | Admin | ml_tlv",
    description: "ניהול הזמנות שנכנסו דרך קטלוגים של ספקים ומשתמשים",
};

export default function CatalogOrdersPage() {
    return (
        <div className="container py-8 max-w-7xl mx-auto" dir="rtl">
            <h1 className="text-3xl font-bold mb-6">הזמנות קטלוגים</h1>
            <p className="text-gray-500 mb-8">כאן ניתן לצפות ולנהל את כל ההזמנות שנכנסו דרך קטלוגי המשתמשים השונים.</p>
            <CatalogOrdersClient />
        </div>
    );
}
