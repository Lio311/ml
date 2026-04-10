import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PhoneOrderClient from "./PhoneOrderClient";

export const metadata = {
    title: "הזמנה טלפונית | ml_tlv Admin",
};

export default async function PhoneOrderPage() {
    return (
        <div className="min-h-screen">
            <PhoneOrderClient />
        </div>
    );
}
