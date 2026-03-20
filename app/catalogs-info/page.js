import { auth } from "@clerk/nextjs/server";
import InfoPageClient from "./InfoPageClient";
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

const getT = (locale) => {
    const dict = locale === 'en' ? en : he;
    return (key) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result[k]) result = result[k];
            else return key;
        }
        return result;
    };
};

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
