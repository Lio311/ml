import SmartMatchingClient from "./SmartMatchingClient";
import pool from "../lib/db";
import { cookies } from "next/headers";
import { getT } from "../lib/getT";

// Force dynamic rendering to avoid build timeout
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    return {
        title: `${t('common.matching')} | ml_tlv`,
        description: t('matching.description'),
    };
}

export default async function MatchingPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
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

    return <SmartMatchingClient initialNotes={uniqueNotes} />;
}
