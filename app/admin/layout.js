import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import AdminSidebar from "../components/admin/AdminSidebar";

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
            <AdminSidebar />

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
