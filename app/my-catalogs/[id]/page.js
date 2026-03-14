import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CatalogManagerClient from "./CatalogManagerClient";

export const metadata = {
    title: "ניהול קטלוג | ml_tlv",
    description: "ניהול קטלוג אישי כולל הוספת מוצרים",
};

export default async function CatalogManagerPage({ params }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const { id } = await params;

    return (
        <div className="container py-12">
            <CatalogManagerClient catalogId={id} />
        </div>
    );
}
