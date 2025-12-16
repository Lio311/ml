import OrdersClient from "./OrdersClient";

export const metadata = {
    title: "ההזמנות שלי | ml_tlv",
    description: "מעקב אחר הזמנות והיסטוריית רכישות.",
};

export default function OrdersPage() {
    return <OrdersClient />;
}
