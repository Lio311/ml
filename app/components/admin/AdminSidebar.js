"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

export default function AdminSidebar({ role = 'customer' }) {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    const allNavItems = [
        { href: "/admin", label: "🏠 דשבורד", roles: ['admin', 'deputy'] },
        { href: "/admin/orders", label: "📦 ניהול הזמנות", roles: ['admin', 'deputy', 'warehouse'] },
        { href: "/admin/products", label: "🧴 ניהול מוצרים", roles: ['admin', 'deputy'] },
        { href: "/admin/dictionary", label: "📖 ניהול מילון חיפוש", roles: ['admin', 'deputy'] },
        { href: "/admin/brands", label: "🏷️ ניהול מותגים (לוגואים)", roles: ['admin', 'deputy'] },
        { href: "/admin/users", label: "👥 ניהול משתמשים", roles: ['admin', 'deputy'] },
        { href: "/admin/coupons", label: "🎟️ ניהול קופונים", roles: ['admin', 'deputy'] },
        { href: "/admin/requests", label: "🗳️ ניהול בקשות", roles: ['admin', 'deputy'] },
        { href: "/admin/lottery", label: "🎰 ניהול הגרלות", roles: ['admin', 'deputy'] },
        { href: "/admin/menu", label: "🗺️ ניהול תפריט ראשי", roles: ['admin', 'deputy'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(role));


    return (
        <aside className="w-64 bg-black text-white p-6 flex flex-col hidden md:flex h-screen sticky top-0">
            <h2 className="text-2xl font-bold mb-10">ml_tlv Admin</h2>

            <nav className="flex-1 space-y-4">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`block p-2 rounded transition-colors ${isActive(item.href)
                            ? "bg-white text-black font-bold"
                            : "hover:bg-gray-800 text-gray-300"
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div>
                <Link href="/" className="block p-2 text-gray-400 hover:text-white text-sm mb-4">
                    חזרה לאתר ↗
                </Link>
                <SignOutButton>
                    <button className="text-red-400 text-sm hover:underline text-right w-full">התנתק</button>
                </SignOutButton>
            </div>
        </aside>
    );
}
