import { Suspense } from "react";
import CartClient from "./CartClient";
import { cookies } from "next/headers";
import { getT } from "../lib/getT";

export async function generateMetadata() {
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);
    
    return {
        title: t('cart.meta_title', { defaultValue: `${t('cart.title')} | ml_tlv` }),
        description: t('cart.meta_desc', { defaultValue: t('cart.title') }),
    };
}

export default async function CartPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען עגלה...</div>}>
            <CartClient />
        </Suspense>
    );
}
