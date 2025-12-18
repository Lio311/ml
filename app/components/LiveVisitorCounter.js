"use client";

import { useState, useEffect } from 'react';

export default function LiveVisitorCounter() {
    const [count, setCount] = useState(null);

    useEffect(() => {
        // 1. Get or Create Visitor ID
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('visitor_id', visitorId);
        }

        const fetchCount = async () => {
            try {
                const res = await fetch('/api/visitors/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visitorId })
                });
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                }
            } catch (error) {
                console.error("Visitor count error", error);
            }
        };

        // Initial fetch
        fetchCount();

        // Poll every 10 seconds
        const interval = setInterval(fetchCount, 10000);

        return () => clearInterval(interval);
    }, []);

    if (!count) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full animate-fade-in mx-2 bg-white/90 shadow-sm">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] mobile:text-[10px] font-bold text-gray-900 tabular-nums tracking-wide">
                {count} צופים כרגע
            </span>
        </div>
    );
}
