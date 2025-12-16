export const metadata = {
    title: "תקנון האתר | ml_tlv",
    description: "תנאי שימוש ותקנון האתר.",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-center">תקנון האתר</h1>
            <div className="prose max-w-none rtl bg-white p-8 rounded-xl shadow-sm border">
                <p>
                    ברוכים הבאים לאתר ml_tlv. השימוש באתר כפוף לתנאים המפורטים להלן.
                    <br /><br />
                    <strong>1. כללי</strong><br />
                    האתר משמש כחנות אינטרנטית לרכישת דוגמיות בשמים. הגלישה באתר ורכישת המוצרים מהווה הסכמה לתקנון זה.
                    <br /><br />
                    <strong>2. רכישה והזמנות</strong><br />
                    הנהלת האתר רשאית לא לאשר הזמנה מכל סיבה שהיא. המחירים באתר כוללים מע"מ וניתנים לשינוי בכל עת.
                    <br /><br />
                    <strong>3. אחריות</strong><br />
                    האתר עושה כמיטב יכולתו לספק מוצרים איכותיים. במקרה של פגם, יש לפנות לשירות הלקוחות.
                    <br /><br />
                    <strong>4. קניין רוחני</strong><br />
                    כל התוכן באתר הינו רכושו הבלעדי של ml_tlv ואין לעשות בו שימוש ללא אישור.
                </p>
            </div>
        </div>
    );
}
