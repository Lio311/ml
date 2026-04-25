"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Menu, 
    X, 
    LogOut, 
    LayoutDashboard, 
    MessageSquare, 
    Package, 
    Phone, 
    Users, 
    History, 
    Mail, 
    FlaskConical, 
    TrendingUp, 
    Bell, 
    TestTube, 
    DollarSign, 
    Thermometer, 
    Tag, 
    Inbox, 
    Wallet, 
    Store, 
    ClipboardList, 
    Ticket, 
    Camera, 
    Send, 
    Dices, 
    Star, 
    Cpu, 
    BarChart3, 
    Search, 
    Target, 
    Book, 
    Map as MapIcon, 
    Image as ImageIcon, 
    Bookmark, 
    MessageCircle, 
    Megaphone, 
    Type,
    ArrowUpRight,
    ChevronDown,
    Zap
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useBrand } from "../../context/BrandContext";

export default function AdminMobileNav({ role = 'customer' }) {
    const [isOpen, setIsOpen] = useState(false);
    const brand = useBrand();
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingRecsCount, setPendingRecsCount] = useState(0);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const pathname = usePathname();
    const [openGroups, setOpenGroups] = useState({});

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
                console.error("Mobile Nav fetch error:", err);
            }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path) => pathname === path;

    const navGroups = [
        {
            title: "פעילות",
            items: [
                { href: "/admin", label: "דשבורד", icon: LayoutDashboard, roles: ['admin', 'deputy'] },
                { href: "/admin/automations", label: "אוטומציות", icon: Zap, roles: ['admin'] },
                { href: "/admin/inbox", label: "תיבת דואר", icon: MessageSquare, roles: ['admin', 'deputy'] },
                { href: "/admin/orders", label: "הזמנות", icon: Package, roles: ['admin', 'deputy', 'warehouse'] },
                { href: "/admin/phone-order", label: "הזמנה טלפונית", icon: Phone, roles: ['admin', 'deputy'] },
                { href: "/admin/users", label: "משתמשים", icon: Users, roles: ['admin', 'deputy'] },
                { href: "/admin/audit-logs", label: "יומן פעולות", icon: History, roles: ['admin'] },
                { href: "/admin/email-logs", label: "יומן מיילים", icon: Mail, roles: ['admin'] },
            ]
        },
        {
            title: "מלאי",
            items: [
                { href: "/admin/products", label: "מוצרים", icon: FlaskConical, roles: ['admin', 'deputy'] },
                { href: "/admin/procurement", label: "רכש", icon: TrendingUp, roles: ['admin', 'deputy'] },
                { href: "/admin/back-in-stock", label: "חזרה למלאי", icon: Bell, roles: ['admin', 'deputy'] },
                { href: "/admin/inventory", label: "בקבוקונים", icon: TestTube, roles: ['admin', 'deputy'] },
                { href: "/admin/inventory/pricing", label: "תמחור חכם", icon: DollarSign, roles: ['admin', 'deputy'] },
                { href: "/admin/inventory-heatmap", label: "מפת חום", icon: Thermometer, roles: ['admin', 'deputy'] },
                { href: "/admin/brands", label: "מותגים", icon: Tag, roles: ['admin', 'deputy'] },
                { href: "/admin/requests", label: "בקשות", icon: Inbox, roles: ['admin', 'deputy'] },
                { href: "/admin/expenses", label: "הוצאות", icon: Wallet, roles: ['admin', 'deputy'] },
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
                { href: "/admin/mailing", label: "דיוור", icon: Send, roles: ['admin', 'deputy'] },
                { href: "/admin/lottery", label: "הגרלות", icon: Dices, roles: ['admin', 'deputy'] },
                { href: "/admin/reviews", label: "ביקורות", icon: Star, roles: ['admin', 'deputy'] },
                { href: "/admin/recommendations", label: "המלצות", icon: Cpu, roles: ['admin', 'deputy'] },
                { href: "/admin/analytics", label: "אנליטיקה", icon: BarChart3, roles: ['admin'] },
                { href: "/admin/search-analytics", label: "חיפושים", icon: Search, roles: ['admin'] },
                { href: "/admin/funnel", label: "משפך המרה", icon: Target, roles: ['admin'] },
            ]
        },
        {
            title: "מערכת",
            items: [
                { href: "/admin/dictionary", label: "מילון", icon: Book, roles: ['admin', 'deputy'] },
                { href: "/admin/menu", label: "תפריט", icon: MapIcon, roles: ['admin', 'deputy'] },
                { href: "/admin/banner", label: "באנר ראשי", icon: ImageIcon, roles: ['admin', 'deputy'] },
                { href: "/admin/logo", label: "לוגו", icon: Bookmark, roles: ['admin', 'deputy'] },
                { href: "/admin/popups", label: "פופאפ", icon: MessageCircle, roles: ['admin', 'deputy'] },
                { href: "/admin/announcement-bar", label: "פס עליון", icon: Megaphone, roles: ['admin', 'deputy'] },
                { href: "/admin/brand", label: "שם מסחרי", icon: Type, roles: ['admin'] },
            ]
        }
    ];

    return (
        <div className="md:hidden">
            <div className="bg-[#050505] text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50 border-b border-white/[0.06]">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <span className="font-black text-lg tracking-tighter uppercase flex items-center gap-1">
                    <span className="lowercase">{brand.name?.split(' ')[0]}</span> <span className="text-blue-500 not-italic text-xs bg-blue-500/10 px-1 rounded border border-blue-500/20">Admin</span>
                </span>
            </div>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed top-0 right-0 h-full w-72 bg-[#0a0a0a] z-50 transform transition-transform duration-500 ease-in-out shadow-2xl border-l border-white/[0.06] ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 invisible'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white lowercase">{brand.name}</h2>
                            <p className="text-[10px] text-gray-500 font-bold tracking-wider">ממשק ניהול מתקדם</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar" dir="rtl">
                        {navGroups.map((group, idx) => {
                            const visibleItems = group.items.filter(item => item.roles.includes(role));
                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={idx} className="space-y-2">
                                    <button 
                                        onClick={() => toggleGroup(idx)}
                                        className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]"
                                    >
                                        <span>{group.title}</span>
                                        <ChevronDown 
                                            size={12} 
                                            className={`transition-transform duration-300 ${openGroups[idx] ? '' : '-rotate-90'}`} 
                                        />
                                    </button>
                                    <div className={`space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${openGroups[idx] ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${active
                                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(0,122,255,0.1)]"
                                                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                                                        }`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}`}>
                                                        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                                    </div>
                                                    <span className={`text-sm tracking-tight ${active ? 'font-bold' : ''}`}>{item.label}</span>
                                                    
                                                    <div className="mr-auto flex items-center gap-2">
                                                        {item.href === '/admin/orders' && pendingOrdersCount > 0 && (
                                                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-black text-white">
                                                                {pendingOrdersCount}
                                                            </span>
                                                        )}
                                                        {item.href.includes('inbox') && unreadCount > 0 && (
                                                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                                                                {unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <Link 
                            href="/" 
                            className="flex items-center gap-3 p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-2"
                        >
                            <ArrowUpRight className="w-5 h-5" />
                            <span className="text-sm font-bold tracking-tight uppercase tracking-widest">חזרה לאתר</span>
                        </Link>
                        <SignOutButton>
                            <button className="flex items-center gap-3 p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all w-full text-right" dir="rtl">
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm font-bold tracking-tight">התנתק מהמערכת</span>
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
