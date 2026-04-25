import pool from '../lib/db';
import BrandsClient from './BrandsClient';
import { cookies } from 'next/headers';
import { sanitizeProductArray } from '../lib/productUtils';
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
        title: t('common.our_brands'),
        description: t('common.brands_meta_desc'),
    };
}

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    let brands = [];
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT name, logo_url FROM brands ORDER BY LOWER(name) ASC');
        brands = sanitizeProductArray(res.rows);
        client.release();
    } catch (e) {
        console.error("Failed to fetch brands", e);
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('common.our_brands')}</h1>
                    <div className="w-16 h-1 bg-black mx-auto"></div>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        {t('common.brands_subtitle')}
                    </p>
                </div>

                <BrandsClient brands={brands} />
            </div>
        </div>
    );
}
