"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
export default function AdminSidebar({ role = 'customer' }) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/inbox/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.count);
                }
            } catch (err) {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path) => pathname === path;

    const navGroups = [
        {
            title: "פעילות שוטפת",
            items: [
                { href: "/admin", label: "דשבורד", icon: "🏠", roles: ['admin', 'deputy'] },
                { href: "/admin/inbox", label: "תיבת דואר", icon: "💬", roles: ['admin', 'deputy'] },
                { href: "/admin/orders", label: "הזמנות", icon: "📦", roles: ['admin', 'deputy', 'warehouse'] },
                { href: "/admin/users", label: "משתמשים", icon: "👥", roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "מוצרים ומלאי",
            items: [
                { href: "/admin/products", label: "מוצרים", icon: "🧴", roles: ['admin', 'deputy'] },
                { href: "/admin/inventory", label: "בקבוקונים", icon: "🧪", roles: ['admin', 'deputy'] },
                { href: "/admin/brands", label: "מותגים (לוגואים)", icon: "🏷️", roles: ['admin', 'deputy'] },
                { href: "/admin/requests", label: "בקשות", icon: "🗳️", roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "קטלוגים וצד ג'",
            items: [
                { href: "/admin/catalogs", label: "קטלוגים", icon: "🏪", roles: ['admin', 'deputy'] },
                { href: "/admin/catalog-orders", label: "הזמנות קטלוגים", icon: "📋", roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "שיווק ותוכן",
            items: [
                { href: "/admin/coupons", label: "קופונים", icon: "🎟️", roles: ['admin', 'deputy'] },
                { href: "/admin/lottery", label: "הגרלות", icon: "🎰", roles: ['admin', 'deputy'] },
                { href: "/admin/reviews", label: "ביקורות", icon: "⭐", roles: ['admin', 'deputy'] },
                { href: "/admin/expenses", label: "הוצאות", icon: "💸", roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "הגדרות מערכת",
            items: [
                { href: "/admin/dictionary", label: "מילון חיפוש", icon: "📖", roles: ['admin', 'deputy'] },
                { href: "/admin/menu", label: "תפריט ראשי", icon: "🗺️", roles: ['admin', 'deputy'] },
            ]
        }
    ];



    return (
        <aside className="w-60 bg-[#0a0a0a] text-white p-4 flex flex-col hidden md:flex h-screen sticky top-0 border-l border-gray-800/50 shadow-2xl">
            <div className="mb-4 px-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <h2 className="text-lg font-black tracking-tight">ML_TLV <span className="text-blue-500">ADMIN</span></h2>
                </div>
                <Link href="/" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                    חזרה לאתר <span>←</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto no-scrollbar scroll-smooth" dir="ltr">
                <div dir="rtl" className="space-y-4">
                    {navGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => item.roles.includes(role));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-1">
                                <h3 className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">
                                    {group.title}
                                </h3>
                                <div className="space-y-0.5">
                                    {visibleItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex justify-between items-center px-3 py-1.5 rounded-lg transition-all group ${isActive(item.href)
                                                ? "bg-white text-black font-black shadow-[0_4px_12px_rgba(255,255,255,0.1)] scale-[1.02]"
                                                : "hover:bg-gray-800/50 text-gray-400 hover:text-white"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={`text-sm opacity-80 group-hover:scale-110 transition-transform ${isActive(item.href) ? 'opacity-100' : ''}`}>
                                                    {item.icon}
                                                </span>
                                                <span className="text-[13px] tracking-tight">{item.label}</span>
                                            </div>
                                            {item.href.includes('inbox') && unreadCount > 0 && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive(item.href) ? 'bg-black text-white' : 'bg-red-600 text-white shadow-lg shadow-red-900/20'}`}>
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </nav>

            <div className="pt-4 border-t border-gray-800">
                <SignOutButton>
                    <button className="text-red-400 text-sm hover:underline w-full text-right flex items-center gap-2">
                        <span>התנתק</span>
                    </button>
                </SignOutButton>
            </div>
        </aside>
    );
}
