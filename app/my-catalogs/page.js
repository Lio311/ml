import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MyCatalogsClient from "./MyCatalogsClient";

export const metadata = {
    title: "הקטלוגים שלי | ml_tlv",
    description: "ניהול הקטלוגים האישיים שלך",
};

export default async function MyCatalogsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">הקטלוגים שלי</h1>
            <MyCatalogsClient />
        </div>
    );
}
