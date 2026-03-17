import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminMobileNav from "../components/admin/AdminMobileNav";
import NotificationBell from "../components/admin/NotificationBell";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
    let user = null;
    let role = null;
    let email = null;

    try {
        user = await currentUser();
        email = user?.emailAddresses?.[0]?.emailAddress;
        role = user?.publicMetadata?.role;
    } catch (err) {
        console.error("Layout Auth Error:", err);
        redirect("/");
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const isSuperAdmin = email === adminEmail;
    const currentRole = isSuperAdmin ? 'admin' : role;

    if (!isSuperAdmin && (!role || role === 'customer')) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row max-w-full overflow-x-hidden" dir="rtl">
            <AdminMobileNav role={currentRole} />
            <AdminSidebar role={currentRole} />
            <main className="flex-1 p-2 md:p-8 overflow-y-auto h-screen relative w-full">
                <div className="absolute top-4 md:top-6 left-4 md:left-6 z-20">
                    <NotificationBell />
                </div>
                {children}
            </main>
        </div>
    );
}
