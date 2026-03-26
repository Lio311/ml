"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function Counter({ end, duration = 2000, prefix = "" }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth stop
            const easeOutQuad = (t) => t * (2 - t);

            setCount(Math.floor(easeOutQuad(progress) * end));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [end, duration]);

    return (
        <span dir="ltr">
            {prefix}{count.toLocaleString()}
        </span>
    );
}

export default function LiveStats({ stats }) {
    const { t } = useLanguage();
    return (
        <section className="bg-black text-white pt-3 pb-1 md:py-1.5 border-t border-gray-800 relative z-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-1 text-center divide-x divide-gray-800 rtl:divide-x-reverse">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-3xl md:text-4xl font-bold font-serif leading-none">
                            <Counter end={stats.brands} />
                        </span>
                        <span className="text-[10px] md:text-sm uppercase tracking-widest text-gray-400 whitespace-nowrap">
                            {t('common.brands')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-3xl md:text-4xl font-bold font-serif leading-none">
                            <Counter end={stats.products} />
                        </span>
                        <span className="text-[10px] md:text-sm uppercase tracking-widest text-gray-400 whitespace-nowrap">
                            {t('common.products_on_site') || t('common.full_catalog')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-3xl md:text-4xl font-bold font-serif leading-none">
                            <Counter end={stats.samples} prefix="+" />
                        </span>
                        <span className="text-[10px] md:text-sm uppercase tracking-widest text-gray-400 whitespace-nowrap">
                            {t('common.samples_sold')}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
