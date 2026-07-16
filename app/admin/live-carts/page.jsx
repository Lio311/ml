"use client";

import React, { useEffect, useState } from "react";
import { LiveCartCard } from "../../components/admin/LiveCartCard";
import { useLanguage } from "@/app/context/LanguageContext";

export default function LiveCartsDashboard() {
    const { t } = useLanguage();
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchCarts = async () => {
        try {
            const res = await fetch("/api/admin/live-carts");
            if (!res.ok) throw new Error("Failed to fetch live carts");
            const data = await res.json();
            
            // To animate only new ones, we could compare previous state, 
            // but for simplicity the LiveCartCard uses its own internal state to pulse on update.
            setCarts(data.carts || []);
            setLastRefresh(new Date());
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load live carts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchCarts();

        // Polling every 60 seconds
        const interval = setInterval(() => {
            fetchCarts();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const activeCount = carts.length;
    const registeredCount = carts.filter(c => c.email).length;
    const anonymousCount = activeCount - registeredCount;

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Dashboard Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">לוח בקרת עגלות חיות</h1>
                        <p className="text-gray-500 mt-1">מעקב בזמן אמת אחר עגלות של מבקרים פעילים באתר.</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm bg-white p-3 rounded-lg shadow-sm border border-gray-100" dir="rtl">
                        <div className="flex flex-col items-center px-4 border-l border-gray-200">
                            <span className="text-gray-500 font-medium">סה״כ</span>
                            <span className="text-xl font-bold text-gray-900">{activeCount}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-l border-gray-200">
                            <span className="text-gray-500 font-medium">רשומים</span>
                            <span className="text-xl font-bold text-emerald-600">{registeredCount}</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                            <span className="text-gray-500 font-medium">אנונימיים</span>
                            <span className="text-xl font-bold text-blue-600">{anonymousCount}</span>
                        </div>
                    </div>
                </header>

                <div className="flex justify-between items-center text-sm text-gray-500" dir="rtl">
                    <p>מתרענן אוטומטית בכל 60 שניות.</p>
                    <p>עודכן לאחרונה: {lastRefresh.toLocaleTimeString()}</p>
                </div>

                {/* Dashboard Grid */}
                {loading && carts.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-pulse flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500">טוען עגלות פעילות...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                        {error}
                    </div>
                ) : carts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                        <p className="text-gray-500 text-lg">לא נמצאו עגלות פעילות ב-24 השעות האחרונות.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {carts.map(cart => (
                            <LiveCartCard key={cart.session_id} cart={cart} isNew={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
