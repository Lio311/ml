"use client";
import React, { useState, useEffect } from 'react';
import { Bell, Trash2, BellRing } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setIsSubscribed(true);
                });
            });
        }
    }, []);

    const subscribeToPush = async () => {
        setIsSubscribing(true);
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                throw new Error('Push notifications are not supported.');
            }
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') throw new Error('Permission not granted');

            const registration = await navigator.serviceWorker.ready;
            
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
            const base64 = (vapidPublicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: outputArray
            });

            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, userAgent: navigator.userAgent })
            });

            if (!res.ok) throw new Error('Failed to save subscription');
            setIsSubscribed(true);
            toast.success('התראות פוש הופעלו בהצלחה!');
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בהפעלת התראות פוש');
        } finally {
            setIsSubscribing(false);
        }
    };

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

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const markAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await fetch('/api/admin/notifications/mark-read', { method: 'POST' });
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const handleClearAll = async () => {
        toast((t) => (
            <div className="flex flex-col gap-2 min-w-[200px]" dir="rtl">
                <p className="font-bold text-sm text-gray-900">לנקות את כל ההתראות?</p>
                <div className="flex gap-2 justify-end mt-1">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const res = await fetch('/api/admin/notifications', { method: 'DELETE' });
                                if (res.ok) {
                                    setNotifications([]);
                                    setUnreadCount(0);
                                    toast.success('ההתראות נוקו בהצלחה');
                                }
                            } catch (err) { 
                                console.error(err);
                                toast.error('שגיאה בניקוי ההתראות');
                            }
                        }}
                        className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition shadow-sm"
                    >
                        כן, נקה הכל
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg border font-bold hover:bg-gray-200 transition"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    return (
        <div className="relative z-30">
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
                    <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-500 flex justify-between items-center">
                        <span>התראות אחרונות</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                            נקה הכל
                        </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {(!notifications || notifications.length === 0) ? (
                            <div className="p-4 text-center text-gray-400 text-sm">אין התראות חדשות</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition`}>
                                    <p className="text-sm text-gray-800">{n.message}</p>
                                    <p suppressHydrationWarning className="text-[10px] text-gray-400 mt-1">
                                        {(isMounted && n.created_at) ? new Date(n.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {!isSubscribed && (
                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    subscribeToPush();
                                }}
                                disabled={isSubscribing}
                                className="w-full py-2 px-3 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded transition disabled:opacity-50"
                            >
                                <BellRing size={16} />
                                {isSubscribing ? 'מפעיל התראות...' : 'הפעל התראות פוש במכשיר זה'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
