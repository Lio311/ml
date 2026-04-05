"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, Package, CreditCard, Inbox, ShoppingBag, Tag, Ticket, Dice5, Library, Map, Store, ClipboardList, LogOut, MessageSquare, Star, History } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default function AdminMobileNav({ role = 'customer' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

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
            title: "פעילות",
            items: [
                { href: "/admin", label: "דשבורד", icon: Home, roles: ['admin', 'deputy'] },
                { href: "/admin/inbox", label: "תיבת דואר", icon: MessageSquare, roles: ['admin', 'deputy'] },
                { href: "/admin/orders", label: "הזמנות", icon: ShoppingBag, roles: ['admin', 'deputy', 'warehouse'] },
                { href: "/admin/users", label: "משתמשים", icon: Users, roles: ['admin', 'deputy'] },
                { href: "/admin/audit-logs", label: "יומן פעולות", icon: History, roles: ['admin'] },
            ]
        },
        {
            title: "מלאי",
            items: [
                { href: "/admin/products", label: "מוצרים", icon: Store, roles: ['admin', 'deputy'] },
                { href: "/admin/inventory", label: "בקבוקונים", icon: Package, roles: ['admin', 'deputy'] },
                { href: "/admin/brands", label: "מותגים", icon: Tag, roles: ['admin', 'deputy'] },
                { href: "/admin/requests", label: "בקשות", icon: Inbox, roles: ['admin', 'deputy'] },
                { href: "/admin/expenses", label: "הוצאות", icon: CreditCard, roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "קטלוגים",
            items: [
                { href: "/admin/catalogs", label: "קטלוגים", icon: Store, roles: ['admin', 'deputy'] },
                { href: "/admin/catalog-orders", label: "הזמנות קטלוגים", icon: ClipboardList, roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "שיווק",
            items: [
                { href: "/admin/coupons", label: "קופונים", icon: Ticket, roles: ['admin', 'deputy'] },
                { href: "/admin/lottery", label: "הגרלות", icon: Dice5, roles: ['admin', 'deputy'] },
                { href: "/admin/reviews", label: "ביקורות", icon: Star, roles: ['admin', 'deputy'] },
            ]
        },
        {
            title: "מערכת",
            items: [
                { href: "/admin/dictionary", label: "מילון", icon: Library, roles: ['admin', 'deputy'] },
                { href: "/admin/menu", label: "תפריט", icon: Map, roles: ['admin', 'deputy'] },
            ]
        }
    ];


    return (
        <div className="md:hidden">
            {/* Top Bar */}
            <div className="bg-black text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <span className="font-bold text-lg tracking-tight">ml_tlv <span className="text-blue-500 font-medium">Admin</span></span>
            </div>

            {/* Menu Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 invisible'}`}>
                <div className="p-6 flex flex-col h-full bg-gray-50">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-bold">ml_tlv</h2>
                            <p className="text-xs text-gray-500">ניהול מערכת</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-4 overflow-y-auto" dir="rtl">
                        {navGroups.map((group, idx) => {
                            const visibleItems = group.items.filter(item => item.roles.includes(role));
                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={idx} className="space-y-1">
                                    <h3 className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive(item.href)
                                                        ? "bg-black text-white shadow-md font-bold"
                                                        : "hover:bg-gray-200 text-gray-700 hover:text-black"
                                                        }`}
                                                >
                                                    <Icon className={`w-5 h-5 ${isActive(item.href) ? 'text-white' : 'text-gray-400'}`} />
                                                    <span className="text-sm">{item.label}</span>
                                                    {item.href.includes('inbox') && unreadCount > 0 && (
                                                        <span className="bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold mr-auto">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <Link 
                            href="/" 
                            className="flex items-center gap-3 p-3 text-gray-600 hover:text-black hover:bg-gray-200 rounded-xl transition-colors mb-2"
                        >
                            <Home className="w-5 h-5" />
                            <span>חזרה לאתר</span>
                        </Link>
                        <SignOutButton>
                            <button className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full text-right" dir="rtl">
                                <LogOut className="w-5 h-5" />
                                <span>התנתק מהמערכת</span>
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
