"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function CheckoutSuccessPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/orders');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" dir={dir}>
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-4">{t('checkout_success.title')}</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md">
                {t('checkout_success.subtitle_p1')}
                <br />
                {t('checkout_success.subtitle_p2')}
            </p>

            <div className="text-sm text-gray-500 mb-8">
                {dir === 'rtl' ? `מעביר לאזור האישי בעוד ${countdown} שניות...` : `Redirecting to personal area in ${countdown} seconds...`}
            </div>

            <Link href="/orders" className="btn btn-primary">
                {dir === 'rtl' ? 'למעבר מיידי לאזור האישי' : 'Go to Personal Area now'}
            </Link>
        </div>
    );
}
