import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PhoneOrderClient from "./PhoneOrderClient";

export const metadata = {
    title: "הזמנה טלפונית | ml_tlv Admin",
};

export default async function PhoneOrderPage() {
    const { sessionClaims, publicMetadata } = await auth();
    const role = sessionClaims?.metadata?.role || publicMetadata?.role || 'customer';

    const isAdmin = role === 'admin' || role === 'deputy';

    if (!isAdmin) {
        redirect("/admin");
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PhoneOrderClient />
        </div>
    );
}
