import { auth } from "@clerk/nextjs/server";
import InfoPageClient from "./InfoPageClient";

export const metadata = {
    title: "הקם חנות משלך | ml_tlv",
    description: "צור קטלוג אישי ומכור מוצרים היישר ללקוחות שלך בקלות.",
};

export default async function CatalogsInfoPage() {
    const { userId } = await auth();

    return <InfoPageClient userId={userId} />;
}
