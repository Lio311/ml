"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function AdminInboxCounter({ isAdmin }) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isAdmin) return;

        const fetchUnreadCount = async () => {
            try {
                const res = await fetch('/api/inbox/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.count);
                }
            } catch (err) {
                console.error("Error fetching unread count", err);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [isAdmin]);

    if (!isAdmin) return null;

    return (
        <Link 
            href="/admin/inbox" 
            className="flex items-center justify-center gap-3 text-blue-600 bg-blue-50 py-3 rounded-2xl md:bg-transparent md:py-0 md:rounded-none md:p-1.5 md:relative"
        >
            <MessageSquare className="w-6 h-6 md:w-5 md:h-5 hover:text-blue-800 transition" />
            <span className="md:hidden">תיבת הודעות</span>
            {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] w-5 h-5 md:w-3.5 md:h-3.5 flex items-center justify-center rounded-full font-bold md:absolute md:-top-1 md:-end-1 border border-white">
                    {unreadCount}
                </span>
            )}
        </Link>
    );
}
