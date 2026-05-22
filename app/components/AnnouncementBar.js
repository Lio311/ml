"use client";

import { useState, useEffect } from 'react';

export default function AnnouncementBar() {
    const [bar, setBar] = useState(null);

    useEffect(() => {
        const fetchBar = async () => {
            try {
                const res = await fetch('/api/admin/announcement-bar');
                const data = await res.json();
                if (data.bar && data.bar.enabled) {
                    setBar(data.bar);
                }
            } catch (e) { /* silent */ }
        };
        fetchBar();
    }, []);

    if (!bar) return null;

    return (
        <div
            className="w-screen text-center py-2 px-4 text-xs sm:text-sm font-semibold tracking-wide"
            style={{ backgroundColor: bar.bgColor || '#000', color: bar.textColor || '#fff' }}
        >
            {bar.text}
        </div>
    );
}
