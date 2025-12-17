import { Suspense } from "react";
import CartClient from "./CartClient";

export const metadata = {
    title: "סל קניות | ml_tlv",
    description: "סל הקניות שלך.",
};

export default function CartPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען עגלה...</div>}>
            <CartClient />
        </Suspense>
    );
}
