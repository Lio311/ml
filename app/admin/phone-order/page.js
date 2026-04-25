import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PhoneOrderClient from "./PhoneOrderClient";

import { getBrandName } from "../../lib/brand";

export async function generateMetadata() {
    return {
        title: "הזמנה טלפונית Admin",
    };
}

export default async function PhoneOrderPage() {
    return (
        <div className="min-h-screen">
            <PhoneOrderClient />
        </div>
    );
}
