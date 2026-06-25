import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminMobileNav from "../components/admin/AdminMobileNav";
import NotificationBell from "../components/admin/NotificationBell";
import ViewerGuard from "../components/admin/ViewerGuard";
import { updateUserActivity } from "../lib/db";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
    let user = null;
    let role = null;
    let email = null;

    try {
        user = await currentUser();
        if (user?.id) {
            await updateUserActivity(user.id);
        }
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
        <div className="min-h-screen md:h-screen bg-gray-100 flex flex-col md:flex-row w-full max-w-full md:overflow-hidden overflow-x-hidden" dir="rtl">
            <ViewerGuard role={currentRole} />
            <AdminMobileNav role={currentRole === 'viewer' ? 'admin' : currentRole} />
            <AdminSidebar role={currentRole === 'viewer' ? 'admin' : currentRole} />
            <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden md:overflow-y-auto bg-gray-100 flex flex-col relative">
                <div className="max-w-7xl mx-auto w-full flex justify-end h-0 overflow-visible relative z-30">
                    <NotificationBell />
                </div>
                <div className="max-w-7xl mx-auto w-full pt-4 md:pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
