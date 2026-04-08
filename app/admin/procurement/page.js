import ProcurementClient from "./ProcurementClient";
import pool from "../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProcurementPage() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    const isAdmin = role === 'admin' || role === 'deputy' || email === adminEmail;
    
    if (!isAdmin) {
        redirect("/");
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-black">רכש ותובנות מלאי</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <span>Smart Procurement & BI Insights Dashboard</span>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    </p>
                </div>
            </div>
            
            <ProcurementClient />
        </div>
    );
}
