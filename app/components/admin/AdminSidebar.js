"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { ChevronDown, ChevronLeft, LogOut, ArrowRight } from "lucide-react";
import { useBrand } from "../../context/BrandContext";

export default function AdminSidebar({ role = 'customer' }) {
    const pathname = usePathname();
    const brand = useBrand();
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingRecsCount, setPendingRecsCount] = useState(0);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch('/api/admin/counts');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadInbox || 0);
                    setPendingRecsCount(data.pendingRecommendations || 0);
                    setPendingOrdersCount(data.pendingOrders || 0);
                }
            } catch (err) {
                console.error("Sidebar fetch error:", err);
            }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path) => pathname === path;

    const [openGroups, setOpenGroups] = useState({});

    // Automatically open the group that contains the active link
    useEffect(() => {
        const initialOpen = {};
        navGroups.forEach((group, idx) => {
            if (group.items.some(item => pathname === item.href)) {
                initialOpen[idx] = true;
            }
        });
        setOpenGroups(prev => ({ ...prev, ...initialOpen }));
    }, [pathname]);

    const toggleGroup = (idx) => {
        setOpenGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const navGroups = [
        {
            title: "פעילות",
            items: [
                { href: "/admin", label: "דשבורד", icon: "🏠", roles: ['admin', 'deputy'] },
                { href: "/admin/inbox", label: "תיבת דואר", icon: "💬", roles: ['admin', 'deputy'] },
                { href: "/admin/orders", label: "הזמנות", icon: "📦", roles: ['admin', 'deputy', 'warehouse'] },
                { href: "/admin/phone-order", label: "הזמנה טלפונית", icon: "📞", roles: ['admin', 'deputy'] },
                { href: "/admin/users", label: "משתמשים", icon: "👥", roles: ['admin', 'deputy'] },
                { href: "/admin/audit-logs", label: "יומן פעולות", icon: "📜", roles: ['admin'] },
                { href: "/admin/email-logs", label: "יומן מיילים", icon: "📧", roles: ['admin'] },
            ]
        },
        {
            title: "מלאי",
            items: [
                { href: "/admin/products", label: "מוצרים", icon: "🧴", roles: ['admin', 'deputy'] },
                { href: "/admin/procurement", label: "רכש", icon: "📈", roles: ['admin', 'deputy'] },
                { href: "/admin/back-in-stock", label: "חזרה למלאי", icon: "🔔", roles: ['admin', 'deputy'] },
                { href: "/admin/inventory", label: "בקבוקונים", icon: "🧪", roles: ['admin', 'deputy'] },
                { href: "/admin/inventory/pricing", label: "תמחור חכם", icon: "💰", roles: ['admin', 'deputy'] },
                { href: "/admin/inventory-heatmap", label: "מפת חום", icon: "🌡️", roles: ['admin', 'deputy'] },
                { href: "/admin/brands", label: "מותגים", icon: "🏷️", roles: ['admin', 'deputy'] },
                { href: "/admin/requests", label: "בקשות", icon: "🗳️", roles: ['admin', 'deputy'] },
                { href: "/admin/expenses", label: "הוצאות", icon: "💸", roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "קטלוגים",
            items: [
                { href: "/admin/catalogs", label: "קטלוגים", icon: "🏪", roles: ['admin', 'deputy'] },
                { href: "/admin/catalog-orders", label: "הזמנות קטלוגים", icon: "📋", roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "שיווק",
            items: [
                { href: "/admin/coupons", label: "קופונים", icon: "🎟️", roles: ['admin', 'deputy'] },
                { href: "/admin/influencers", label: "משפיענים", icon: "🤳", roles: ['admin', 'deputy'] },
                { href: "/admin/mailing", label: "דיוור", icon: "📧", roles: ['admin', 'deputy'] },
                { href: "/admin/lottery", label: "הגרלות", icon: "🎰", roles: ['admin', 'deputy'] },
                { href: "/admin/reviews", label: "ביקורות", icon: "⭐", roles: ['admin', 'deputy'] },
                { href: "/admin/recommendations", label: "המלצות", icon: "🤖", roles: ['admin', 'deputy'] },
                { href: "/admin/analytics", label: "אנליטיקה", icon: "📈", roles: ['admin'] },
                { href: "/admin/search-analytics", label: "חיפושים", icon: "🔍", roles: ['admin'] },
                { href: "/admin/funnel", label: "משפך המרה", icon: "🎯", roles: ['admin'] },
            ]
        },
        {
            title: "מערכת",
            items: [
                { href: "/admin/dictionary", label: "מילון", icon: "📖", roles: ['admin', 'deputy'] },
                { href: "/admin/menu", label: "תפריט", icon: "🗺️", roles: ['admin', 'deputy'] },
                { href: "/admin/banner", label: "באנר ראשי", icon: "🖼️", roles: ['admin', 'deputy'] },
                { href: "/admin/logo", label: "לוגו", icon: "🔖", roles: ['admin', 'deputy'] },
                { href: "/admin/popups", label: "פופאפ", icon: "💬", roles: ['admin', 'deputy'] },
                { href: "/admin/announcement-bar", label: "פס עליון", icon: "📢", roles: ['admin', 'deputy'] },
                { href: "/admin/brand", label: "שם מסחרי", icon: "✏️", roles: ['admin'] },
            ]
        }
    ];



    return (
        <aside className="w-60 bg-[#0a0a0a] text-white p-4 flex flex-col hidden md:flex h-screen sticky top-0 border-l border-gray-800/50 shadow-2xl">
            <div className="mb-4 px-2">
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold tracking-tight">{brand.name} <span className="text-blue-500 font-medium text-lg">Admin</span></h2>
                </div>
                <Link href="/" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                    חזרה לאתר <span>←</span>
                </Link>
            </div>

            <nav 
                className="flex-1 space-y-4 overflow-y-auto no-scrollbar scroll-smooth" 
                dir="ltr"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div dir="rtl" className="space-y-4">
                    {navGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => item.roles.includes(role));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-1">
                                <button 
                                    onClick={() => toggleGroup(idx)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-white hover:bg-gray-800/30 rounded-lg transition-all"
                                >
                                    <span>{group.title}</span>
                                    <ChevronDown 
                                        size={14} 
                                        className={`transition-transform duration-300 ${openGroups[idx] ? '' : 'rotate-90'}`} 
                                    />
                                </button>
                                
                                <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out px-1 ${openGroups[idx] ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    {visibleItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex justify-between items-center px-3 py-2 rounded-lg transition-all group ${isActive(item.href)
                                                ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold shadow-md border-l-2 border-blue-500"
                                                : "hover:bg-gray-800/40 text-gray-400 hover:text-white"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={`text-sm opacity-80 group-hover:scale-110 transition-transform ${isActive(item.href) ? 'opacity-100' : ''}`}>
                                                    {item.icon}
                                                </span>
                                                <span className="text-[13px] tracking-tight">{item.label}</span>
                                            </div>
                                            {item.href === '/admin/orders' && pendingOrdersCount > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-md ${isActive(item.href) ? 'bg-blue-500' : 'bg-blue-600'}`}>
                                                    {pendingOrdersCount}
                                                </span>
                                            )}
                                            {item.href.includes('inbox') && unreadCount > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-md ${isActive(item.href) ? 'bg-red-500' : 'bg-red-600'}`}>
                                                    {unreadCount}
                                                </span>
                                            )}
                                            {item.href === '/admin/recommendations' && pendingRecsCount > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-md ${isActive(item.href) ? 'bg-blue-500' : 'bg-indigo-600'}`}>
                                                    {pendingRecsCount}
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
                    <button className="text-gray-400 hover:text-red-400 text-sm w-full text-right flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/30 transition-all font-bold">
                        <LogOut size={16} />
                        <span>התנתק</span>
                    </button>
                </SignOutButton>
            </div>
        </aside>
    );
}
