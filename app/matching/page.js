import SmartMatchingClient from "./SmartMatchingClient";
import pool from "../lib/db";
import { cookies } from "next/headers";
import { getT } from "../lib/getT";

// Force dynamic rendering to avoid build timeout
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const cookieStore = cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);

    return {
        title: `${t('common.matching')} | ml_tlv`,
        description: t('matching.description'),
    };
}

export default async function MatchingPage() {
    const cookieStore = cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    // Fetch all unique notes for the tag selector
    let allNotes = new Set();

    try {
        const res = await pool.query("SELECT top_notes, middle_notes, base_notes FROM products WHERE active = true");
        res.rows.forEach(row => {
            [row.top_notes, row.middle_notes, row.base_notes].forEach(field => {
                if (field) {
                    field.split(',').forEach(note => allNotes.add(note.trim()));
                }
            });
        });
    } catch (e) {
        console.error("Failed to fetch notes for matching wizard:", e);
    }

    const uniqueNotes = Array.from(allNotes).sort();

    return (
        <div className="bg-neutral-50 min-h-screen py-12" dir={dir}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">{t('matching.title')}</h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        {t('matching.description')}
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
                    <SmartMatchingClient initialNotes={uniqueNotes} />
                </div>
            </div>
        </div>
    );
}
