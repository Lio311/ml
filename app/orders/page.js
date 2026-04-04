import { cookies } from "next/headers";
import OrdersClient from "./OrdersClient";

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    
    if (locale === 'he') {
        return {
            title: "ההזמנות שלי | ml_tlv",
            description: "מעקב אחר הזמנות והיסטוריית רכישות.",
        };
    }
    
    return {
        title: "My Orders | ml_tlv",
        description: "Track your orders and purchase history.",
    };
}

export default function OrdersPage() {
    return <OrdersClient />;
}
