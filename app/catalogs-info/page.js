import { auth } from "@clerk/nextjs/server";
import InfoPageClient from "./InfoPageClient";
import { cookies } from 'next/headers';
import { getT } from '../lib/getT';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    return {
        title: `${t('common.catalogs_info_meta_title')}`,
        description: t('common.catalogs_info_meta_desc'),
    };
}

export default async function CatalogsInfoPage() {
    const { userId } = await auth();

    return <InfoPageClient userId={userId} />;
}
