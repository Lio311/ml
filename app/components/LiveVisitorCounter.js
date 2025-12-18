"use client";

import { useState, useEffect } from 'react';

export default function LiveVisitorCounter() {
    const [count, setCount] = useState(1);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Initial random count between 18 and 32
        setCount(Math.floor(Math.random() * (32 - 18 + 1)) + 18);

        const interval = setInterval(() => {
            // Randomly fluctuate by -2 to +3
            setCount(prev => {
                const change = Math.floor(Math.random() * 6) - 2;
                const newCount = prev + change;
                // Keep within realistic bounds for a niche site
                if (newCount < 12) return 12;
                if (newCount > 45) return 45;
                return newCount;
            });
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    if (!isClient) return null;

    return (
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm animate-fade-in mx-2">
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-700 tabular-nums">
                {count} צופים כרגע
            </span>
        </div>
    );
}
