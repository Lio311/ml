import { cookies } from "next/headers";
import OrdersClient from "./OrdersClient";

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    
    if (locale === 'he') {
        return {
            title: "ההזמנות שלי",
            description: "מעקב אחר הזמנות והיסטוריית רכישות.",
        };
    }
    
    return {
        title: "My Orders",
        description: "Track your orders and purchase history.",
    };
}

import { Suspense } from 'react';

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
            <OrdersClient />
        </Suspense>
    );
}
