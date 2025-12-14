import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

export default async function AdminLayout({ children }) {
    const user = await currentUser();


    // Basic Security Check
    if (!user) {
        redirect("/");
    }
    if (user.emailAddresses[0].emailAddress !== 'lior31197@gmail.com') {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-gray-100 flex" dir="rtl">
            {/* Sidebar */}
            <aside className="w-64 bg-black text-white p-6 flex flex-col hidden md:flex">
                <h2 className="text-2xl font-bold mb-10">ml_tlv Admin</h2>

                <nav className="flex-1 space-y-4">
                    <Link href="/admin" className="block p-2 hover:bg-gray-800 rounded">
                        🏠 דשבורד
                    </Link>
                    <Link href="/admin/orders" className="block p-2 hover:bg-gray-800 rounded">
                        📦 הזמנות
                    </Link>
                    <Link href="/admin/products" className="block p-2 hover:bg-gray-800 rounded">
                        🧴 ניהול מוצרים
                    </Link>
                    <Link href="/admin/brands" className="block p-2 hover:bg-gray-800 rounded">
                        🏷️ ניהול מותגים (לוגואים)
                    </Link>
                    <Link href="/admin/users" className="block p-2 hover:bg-gray-800 rounded">
                        👥 ניהול משתמשים
                    </Link>
                    <Link href="/admin/requests" className="block p-2 hover:bg-gray-800 rounded">
                        🗳️ ניהול בקשות
                    </Link>
                    <Link href="/admin/lottery" className="block p-2 hover:bg-gray-800 rounded">
                        ניהול הגרלות
                    </Link>
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

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                {/* Mobile Header (visible only on small screens) */}
                <header className="md:hidden flex justify-between items-center mb-8 bg-white p-4 rounded shadow">
                    <span className="font-bold">Admin Panel</span>
                    <div className="space-x-4 space-x-reverse">
                        <Link href="/admin/orders">הזמנות</Link>
                        <Link href="/admin/products">מוצרים</Link>
                        <Link href="/admin/users">משתמשים</Link>
                        <Link href="/admin/requests">בקשות</Link>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
