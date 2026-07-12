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
    Construction,
    Image as ImageIcon, 
    Bookmark, 
    MessageCircle, 
    Megaphone, 
    Type,
    ArrowUpRight,
    ChevronDown,
    Zap,
    Edit3,
    FileSearch,
    Activity,
    AlertOctagon,
    Calendar,
    Crown
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
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
            { href: "/admin/bundles-inventory", label: "חבילות", icon: Package, roles: ['admin', 'deputy'] },
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
            { href: "/admin/checkout-errors", label: "שגיאות קופה", icon: AlertOctagon, roles: ['admin'] },
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

export default function AdminMobileNav({ role = 'customer' }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const brand = useBrand();
    
    // Notifications state
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [monthlyRecNeedsAction, setMonthlyRecNeedsAction] = useState(false);
    const [pendingRecommendationsCount, setPendingRecommendationsCount] = useState(0);
    const [hiddenReviewsCount, setHiddenReviewsCount] = useState(0);
    const [pendingCheckoutErrorsCount, setPendingCheckoutErrorsCount] = useState(0);
    const [missingBundleItems, setMissingBundleItems] = useState(false);
    const [openGroups, setOpenGroups] = useState({});

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch('/api/admin/counts');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadInbox || 0);
                    setPendingOrdersCount(data.pendingOrders || 0);
                    setMonthlyRecNeedsAction(data.monthlyRecNeedsAction || false);
                    setPendingRecommendationsCount(data.pendingRecommendations || 0);
                    setHiddenReviewsCount(data.hiddenReviews || 0);
                    setPendingCheckoutErrorsCount(data.pendingCheckoutErrors || 0);
                    setMissingBundleItems(data.missingBundleItems || false);
                }
            } catch (err) {
                console.error("Mobile Nav fetch error:", err);
            }
        };

        if (isOpen) {
            fetchCounts();
        }
    }, [isOpen]);

    const isActive = (path) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    useEffect(() => {
        if (!isOpen) return;
        
        let found = false;
        for (let idx = 0; idx < navGroups.length; idx++) {
            if (navGroups[idx].items.some(item => isActive(item.href))) {
                setOpenGroups({ [idx]: true });
                found = true;
                break;
            }
        }
        if (!found) setOpenGroups({});
    }, [pathname, isOpen]);

    const toggleGroup = (idx) => {
        setOpenGroups(prev => prev[idx] ? {} : { [idx]: true });
    };

    const hasAnyNotification = unreadCount > 0 || pendingOrdersCount > 0 || monthlyRecNeedsAction || pendingRecommendationsCount > 0 || hiddenReviewsCount > 0 || pendingCheckoutErrorsCount > 0 || missingBundleItems;

    return (
        <div className="md:hidden">
            {/* Header / Hamburger */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#050505] border-b border-white/[0.06] z-[60] flex flex-row-reverse items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Link href="/" className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.2em] px-2 py-1.5 rounded-md border border-gray-800 bg-white/5 active:bg-white/10 transition-colors flex items-center gap-1">
                        לאתר <ArrowUpRight size={12} />
                    </Link>
                    <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-1 text-white">
                        <span className="lowercase">{brand.name?.split(' ')[0]}</span>
                        <span className="text-blue-500 text-sm not-italic font-bold tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Admin</span>
                    </h2>
                </div>

                <div className="flex items-center">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-white p-2 rounded-xl border border-white/10 bg-white/5 relative"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                        {!isOpen && hasAnyNotification && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Menu */}
            <div className={`fixed top-16 bottom-0 right-0 w-[280px] bg-[#050505] border-l border-white/[0.06] z-[55] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6" dir="ltr">
                    <div dir="rtl" className="space-y-6">
                        {navGroups.map((group, idx) => {
                            const visibleItems = group.items.filter(item => item.roles.includes(role));
                            if (visibleItems.length === 0) return null;

                            const groupNotifications = visibleItems.reduce((acc, item) => {
                                if (item.href === '/admin/orders') return acc + pendingOrdersCount;
                                if (item.href.includes('inbox')) return acc + unreadCount;
                                if (item.href === '/admin/monthly-recommendation' && monthlyRecNeedsAction) return acc + 1;
                                if (item.href === '/admin/recommendations') return acc + pendingRecommendationsCount;
                                if (item.href === '/admin/reviews') return acc + hiddenReviewsCount;
                                if (item.href === '/admin/checkout-errors') return acc + pendingCheckoutErrorsCount;
                                if (item.href === '/admin/bundles-inventory' && missingBundleItems) return acc + 1;
                                return acc;
                            }, 0);

                            return (
                                <div key={idx} className="space-y-2">
                                    <button 
                                        onClick={() => toggleGroup(idx)}
                                        className="w-full flex items-center justify-between px-3 text-[10px] font-black text-gray-600 uppercase tracking-[0.25em]"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>{group.title}</span>
                                            {groupNotifications > 0 && (
                                                <span className="text-blue-500 font-bold">{groupNotifications}</span>
                                            )}
                                        </div>
                                        <ChevronDown 
                                            size={12} 
                                            className={`transition-transform duration-300 ${openGroups[idx] ? '' : '-rotate-90'}`} 
                                        />
                                    </button>
                                    
                                    <div className={`space-y-1 overflow-hidden transition-all duration-300 ${openGroups[idx] ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex justify-between items-center px-4 py-3 rounded-xl transition-all ${active
                                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                        : "text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}`}>
                                                            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                                        </div>
                                                        <span className={`text-[14px] ${active ? 'font-bold' : 'font-medium'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
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
                                                        {item.href === '/admin/monthly-recommendation' && monthlyRecNeedsAction && (
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                                                                <AlertOctagon size={12} strokeWidth={3} />
                                                            </span>
                                                        )}
                                                        {item.href === '/admin/recommendations' && pendingRecommendationsCount > 0 && (
                                                            <span className="flex h-5 min-w-[20px] gap-1 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white">
                                                                <AlertOctagon size={10} strokeWidth={3} />
                                                                {pendingRecommendationsCount}
                                                            </span>
                                                        )}
                                                        {item.href === '/admin/reviews' && hiddenReviewsCount > 0 && (
                                                            <span className="flex h-5 min-w-[20px] gap-1 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-black text-white">
                                                                <AlertOctagon size={10} strokeWidth={3} />
                                                                {hiddenReviewsCount}
                                                            </span>
                                                        )}
                                                        {item.href === '/admin/checkout-errors' && pendingCheckoutErrorsCount > 0 && (
                                                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white animate-pulse">
                                                                {pendingCheckoutErrorsCount}
                                                            </span>
                                                        )}
                                                        {item.href === '/admin/bundles-inventory' && missingBundleItems && (
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
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

                <div className="p-4 border-t border-white/[0.06] bg-[#050505]">
                    <SignOutButton>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors border border-white/10 hover:border-red-500/20">
                            <LogOut size={18} />
                            <span className="text-sm font-bold tracking-tight">התנתק מהמערכת</span>
                        </button>
                    </SignOutButton>
                </div>
            </div>
        </div>
    );
}
