import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MyCatalogsClient from "./MyCatalogsClient";
import { cookies } from "next/headers";
import { getT } from "../lib/getT";

export async function generateMetadata() {
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);
    
    return {
        title: t('my_catalogs.meta_title'),
        description: t('my_catalogs.meta_desc'),
    };
}

export default async function MyCatalogsPage() {
    const { userId } = await auth();
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">{t('my_catalogs.title')}</h1>
            <MyCatalogsClient />
        </div>
    );
}
