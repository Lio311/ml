import SmartMatchingClient from "./SmartMatchingClient";
import pool from "../lib/db";

export const metadata = {
    title: 'התאמת מארזים | ml_tlv',
    description: 'אשף התאמת בשמים אישי - בנה את המארז המושלם בשבילך',
};

export default async function MatchingPage() {
    // Fetch all unique notes for the tag selector
    // We can do this on the server to pass initial data
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
        <div className="bg-neutral-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">יוקרה בחתיכות קטנות</h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        ענה על מספר שאלות קצרות, והאלגוריתם שלנו ירכיב עבורך את המארז המושלם בהתאם לתקציב ולטעם שלך.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
                    <SmartMatchingClient initialNotes={uniqueNotes} />
                </div>
            </div>
        </div>
    );
}
