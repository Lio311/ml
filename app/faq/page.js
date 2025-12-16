export const metadata = {
    title: "שאלות ותשובות | ml_tlv",
    description: "שאלות נפוצות ותשובות בנוגע להזמנות, משלוחים ומוצרים.",
};

export default function FAQPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-center">שאלות ותשובות</h1>
            <div className="space-y-6">
                {[
                    { q: "כמה זמן לוקח למשלוח להגיע?", a: "זמן האספקה הוא בדרך כלל בין 3 ל-5 ימי עסקים, תלוי במיקום בארץ." },
                    { q: "האם הבשמים מקוריים?", a: "כן, כל הדוגמיות שלנו נלקחות מבשמים מקוריים בלבד בתהליך סטרילי ומקצועי." },
                    { q: "איך ניתן ליצור קשר?", a: "ניתן לפנות אלינו דרך עמוד 'צור קשר' באתר, בוואטסאפ או במייל." },
                    { q: "האם יש החזרות או החלפות?", a: "בשל אופי המוצר (מוצרי היגיינה), לא ניתן להחזיר דוגמיות שנפתחו. במקרה של תקלה, אנא צרו קשר." }
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="font-bold text-lg mb-2">{item.q}</h3>
                        <p className="text-gray-600">{item.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
