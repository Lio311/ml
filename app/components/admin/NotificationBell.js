"use client";
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Poll for notifications every 30 seconds
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/admin/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await fetch('/api/admin/notifications/mark-read', { method: 'POST' });
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) markAsRead();
                }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-right" dir="rtl">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-500">
                        התראות אחרונות
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {(!notifications || notifications.length === 0) ? (
                            <div className="p-4 text-center text-gray-400 text-sm">אין התראות חדשות</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition border-l-4 ${n.type === 'order' ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                                    <p className="text-sm text-gray-800">{n.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {n.created_at ? new Date(n.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
