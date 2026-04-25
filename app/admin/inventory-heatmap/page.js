import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import InventoryHeatmapClient from "./InventoryHeatmapClient";

export const metadata = {
    title: "מפת חום מלאי Admin",
    robots: "noindex, nofollow",
};

export default async function InventoryHeatmapPage() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses?.[0]?.emailAddress;

    const isAdmin = role === 'admin' || role === 'deputy' || email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
        redirect("/");
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight" dir="rtl">מפת חום - תמונת מצב מלאי</h1>
                <p className="text-gray-500 font-medium mt-1" dir="rtl">ניתוח ויזואלי של קצב המכר מול המלאי הקיים (90 ימים אחרונים)</p>
            </div>
            
            <InventoryHeatmapClient />
        </div>
    );
}
