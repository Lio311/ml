"use client";

import { useEffect, useState } from "react";

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
        <span>
            {prefix}{count.toLocaleString()}
        </span>
    );
}

export default function LiveStats({ stats }) {
    return (
        <section className="bg-black text-white py-8 border-t border-gray-800 relative z-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-800 rtl:divide-x-reverse">
                    <div className="flex flex-col items-center">
                        <span className="text-3xl md:text-4xl font-bold font-serif">
                            <Counter end={stats.brands} />
                        </span>
                        <span className="text-xs md:text-sm uppercase tracking-widest text-gray-400 mt-1">
                            מותגים
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-3xl md:text-4xl font-bold font-serif">
                            <Counter end={stats.products} />
                        </span>
                        <span className="text-xs md:text-sm uppercase tracking-widest text-gray-400 mt-1">
                            בשמים באתר
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-3xl md:text-4xl font-bold font-serif">
                            <Counter end={stats.samples} prefix="+" />
                        </span>
                        <span className="text-xs md:text-sm uppercase tracking-widest text-gray-400 mt-1">
                            דוגמיות שנמכרו
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
