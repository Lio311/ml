"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { 
    ChevronDown, 
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
    Construction,
    Image as ImageIcon, 
    Bookmark, 
    MessageCircle, 
    Megaphone, 
    Type,
    ArrowUpRight,
    Zap,
    Edit3,
    FileSearch,
    Activity,
    AlertOctagon,
    Crown
} from "lucide-react";
import { useBrand } from "../../context/BrandContext";

const navGroups = [
    {
        title: "מכירות וניהול שוטף",
        items: [
            { href: "/admin", label: "דשבורד", icon: LayoutDashboard, roles: ['admin', 'deputy'] },
            { href: "/admin/orders", label: "הזמנות", icon: Package, roles: ['admin', 'deputy', 'warehouse'] },
            { href: "/admin/phone-order", label: "הזמנה טלפונית", icon: Phone, roles: ['admin', 'deputy'] },
            { href: "/admin/expenses", label: "הוצאות", icon: Wallet, roles: ['admin', 'deputy'] },
        ]
    },
    {
        title: "מלאי ורכש",
        items: [
            { href: "/admin/products", label: "מוצרים", icon: FlaskConical, roles: ['admin', 'deputy'] },
            { href: "/admin/brands", label: "מותגים", icon: Tag, roles: ['admin', 'deputy'] },
            { href: "/admin/inventory", label: "בקבוקונים", icon: TestTube, roles: ['admin', 'deputy'] },
            { href: "/admin/discovery-sets", label: "דיסקברי ודוגמיות", icon: Package, roles: ['admin', 'deputy'] },
            { href: "/admin/procurement", label: "רכש", icon: TrendingUp, roles: ['admin', 'deputy'] },
            { href: "/admin/inventory-heatmap", label: "מפת חום", icon: Thermometer, roles: ['admin', 'deputy'] },
        ]
    },
    {
        title: "לקוחות ושירות",
        items: [
            { href: "/admin/inbox", label: "תיבת דואר", icon: MessageSquare, roles: ['admin', 'deputy'] },
            { href: "/admin/users", label: "משתמשים", icon: Users, roles: ['admin', 'deputy'] },
            { href: "/admin/requests", label: "בקשות", icon: Inbox, roles: ['admin', 'deputy'] },
            { href: "/admin/back-in-stock", label: "חזרה למלאי", icon: Bell, roles: ['admin', 'deputy'] },
        ]
    },
    {
        title: "דאטה ואנליטיקה",
        items: [
            { href: "/admin/analytics", label: "אנליטיקה", icon: BarChart3, roles: ['admin'] },
            { href: "/admin/funnel", label: "משפך המרה", icon: Target, roles: ['admin'] },
            { href: "/admin/search-analytics", label: "חיפושים", icon: Search, roles: ['admin'] },
        ]
    },
    {
        title: "שיווק ומבצעים",
        items: [
            { href: "/admin/mailing", label: "דיוור", icon: Send, roles: ['admin', 'deputy'] },
            { href: "/admin/subscribers", label: "מנויי דיוור", icon: Mail, roles: ['admin', 'deputy'] },
            { href: "/admin/coupons", label: "קופונים", icon: Ticket, roles: ['admin', 'deputy'] },
            { href: "/admin/lottery", label: "הגרלות", icon: Dices, roles: ['admin', 'deputy'] },
            { href: "/admin/influencers", label: "משפיענים", icon: Camera, roles: ['admin', 'deputy'] },
            { href: "/admin/inventory/pricing", label: "תמחור חכם", icon: DollarSign, roles: ['admin', 'deputy'] },
        ]
    },
    {
        title: "תוכן, ביקורות והמלצות",
        items: [
            { href: "/admin/reviews", label: "ביקורות", icon: Star, roles: ['admin', 'deputy'] },
            { href: "/admin/recommendations", label: "המלצות", icon: Cpu, roles: ['admin', 'deputy'] },
            { href: "/admin/monthly-recommendation", label: "המלצת החודש", icon: Crown, roles: ['admin', 'deputy'] },
            { href: "/admin/desc-reviews", label: "סקירת תיאורים", icon: FileSearch, roles: ['admin'] },
            { href: "/admin/dictionary", label: "מילון", icon: Book, roles: ['admin', 'deputy'] },
            { href: "/admin/seo-generator", label: "בוט תוכן (SEO)", icon: Edit3, roles: ['admin'] },
        ]
    },
    {
        title: "עיצוב ונראות האתר",
        items: [
            { href: "/admin/menu", label: "תפריט", icon: MapIcon, roles: ['admin', 'deputy'] },
            { href: "/admin/banner", label: "באנר ראשי", icon: ImageIcon, roles: ['admin', 'deputy'] },
            { href: "/admin/announcement-bar", label: "פס עליון", icon: Megaphone, roles: ['admin', 'deputy'] },
            { href: "/admin/popups", label: "פופאפ", icon: MessageCircle, roles: ['admin', 'deputy'] },
            { href: "/admin/logo", label: "לוגו", icon: Bookmark, roles: ['admin', 'deputy'] },
            { href: "/admin/brand", label: "שם מסחרי", icon: Type, roles: ['admin'] },
            { href: "/admin/maintenance", label: "אתר בשיפוצים", icon: Construction, roles: ['admin'] },
        ]
    },
    {
        title: "מערכת ובקרה",
        items: [
            { href: "/admin/automations", label: "אוטומציות", icon: Zap, roles: ['admin'] },
            { href: "/admin/system-status", label: "סטטוס מערכת", icon: Activity, roles: ['admin'] },
            { href: "/admin/error-logs", label: "ניטור שגיאות", icon: AlertOctagon, roles: ['admin'] },
            { href: "/admin/audit-logs", label: "יומן פעולות", icon: History, roles: ['admin'] },
            { href: "/admin/email-logs", label: "יומן מיילים", icon: Mail, roles: ['admin'] },
        ]
    },
    {
        title: "קטלוגים",
        items: [
            { href: "/admin/catalogs", label: "קטלוגים", icon: Store, roles: ['admin', 'deputy'] },
            { href: "/admin/catalog-orders", label: "הזמנות קטלוגים", icon: ClipboardList, roles: ['admin', 'deputy'] },
        ]
    }
];

export default function AdminSidebar({ role = 'customer' }) {
    const pathname = usePathname();
    const brand = useBrand();
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [monthlyRecNeedsAction, setMonthlyRecNeedsAction] = useState(false);
    const [openGroups, setOpenGroups] = useState({});

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch('/api/admin/counts');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadInbox || 0);
                    setPendingOrdersCount(data.pendingOrders || 0);
                    setMonthlyRecNeedsAction(data.monthlyRecNeedsAction || false);
                }
            } catch (err) {
                console.error("Sidebar fetch error:", err);
            }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    useEffect(() => {
        let found = false;
        for (let idx = 0; idx < navGroups.length; idx++) {
            if (navGroups[idx].items.some(item => isActive(item.href))) {
                setOpenGroups({ [idx]: true });
                found = true;
                break;
            }
        }
        if (!found) setOpenGroups({});
    }, [pathname]);

    const toggleGroup = (idx) => {
        setOpenGroups(prev => prev[idx] ? {} : { [idx]: true });
    };

    return (
        <aside className="w-64 bg-[#050505] text-white p-4 flex flex-col hidden md:flex h-screen sticky top-0 border-l border-white/[0.06] shadow-2xl z-50">
            <div className="mb-8 px-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-1">
                            <span className="text-white lowercase">{brand.name?.split(' ')[0]}</span>
                            <span className="text-blue-500 text-sm not-italic font-bold tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Admin</span>
                        </h2>
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider">ממשק ניהול מתקדם</span>
                    </div>
                </div>
                
                <Link href="/" className="group flex items-center gap-2 text-[11px] text-gray-500 hover:text-blue-400 font-bold uppercase tracking-[0.2em] transition-all duration-300">
                    <span className="p-1 rounded-md border border-gray-800 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                        <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                    חזרה לאתר
                </Link>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar scroll-smooth px-1" dir="ltr">
                <div dir="rtl" className="space-y-6">
                    {navGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => item.roles.includes(role));
                        if (visibleItems.length === 0) return null;

                        const groupNotifications = visibleItems.reduce((acc, item) => {
                            if (item.href === '/admin/orders') return acc + pendingOrdersCount;
                            if (item.href.includes('inbox')) return acc + unreadCount;
                            if (item.href === '/admin/monthly-recommendation' && monthlyRecNeedsAction) return acc + 1;
                            return acc;
                        }, 0);

                        return (
                            <div key={idx} className="space-y-2">
                                <button 
                                    onClick={() => toggleGroup(idx)}
                                    className="w-full flex items-center justify-between px-3 text-[10px] font-black text-gray-600 uppercase tracking-[0.25em] hover:text-gray-400 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>{group.title}</span>
                                        {groupNotifications > 0 && (
                                            <span className="text-blue-500 font-bold">{groupNotifications}</span>
                                        )}
                                    </div>
                                    <ChevronDown 
                                        size={12} 
                                        className={`transition-transform duration-500 ease-in-out ${openGroups[idx] ? '' : '-rotate-90'}`} 
                                    />
                                </button>
                                
                                <div className={`space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${openGroups[idx] ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex justify-between items-center px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(0,122,255,0.1)]"
                                                    : "hover:bg-white/[0.03] text-gray-400 hover:text-white border border-transparent hover:border-white/5"
                                                    }`}
                                            >
                                                {active && (
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-l-full shadow-[0_0_10px_#007AFF]" />
                                                )}
                                                
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'bg-blue-500/20 text-blue-400' : 'group-hover:bg-white/5 text-gray-500 group-hover:text-blue-400'}`}>
                                                        <Icon size={18} strokeWidth={active ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                                                    </div>
                                                    <span className={`text-[13px] font-medium tracking-tight transition-colors ${active ? 'font-bold' : 'group-hover:text-white'}`}>
                                                        {item.label}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {item.href === '/admin/orders' && pendingOrdersCount > 0 && (
                                                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-black text-white dji-blue-glow">
                                                            {pendingOrdersCount}
                                                        </span>
                                                    )}
                                                    {item.href.includes('inbox') && unreadCount > 0 && (
                                                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                    {item.href === '/admin/monthly-recommendation' && monthlyRecNeedsAction && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                                                            <AlertOctagon size={12} strokeWidth={3} />
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
                </div>
            </nav>

            <div className="mt-auto pt-4 border-t border-white/[0.06]">
                <SignOutButton>
                    <button className="group w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-500/5 text-gray-500 hover:text-red-400 transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                            <span className="text-sm font-bold tracking-tight">התנתק מהמערכת</span>
                        </div>
                    </button>
                </SignOutButton>
            </div>
        </aside>
    );
}
