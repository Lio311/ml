export const metadata = {
    title: "תקנון האתר | ml_tlv",
    description: "תנאי שימוש ותקנון האתר.",
};

export default function TermsPage() {
    return (
        <div className="bg-gray-50 min-h-screen py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-black mb-4">תקנון תנאי שימוש</h1>
                    <p className="text-gray-500">ml_tlv - יוקרה בחתיכות קטנות</p>
                </header>

                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-right rtl leading-relaxed">
                    <p className="mb-8">
                        ברוכים הבאים לאתר ml_tlv (להלן: "האתר"). האתר משמש כפלטפורמה להצגת דוגמיות בשמים, רכישתן, וכן כפלטפורמה המאפשרת למשתמשים להקים דפי קטלוג וחנויות וירטואליות (להלן: "השירותים"). האתר מופעל על ידי הנהלת ml_tlv (להלן: "המפעיל").
                        <br /><br />
                        השימוש באתר מהווה הסכמה מצד המשתמש לתקנון זה ולתנאיו במלואם.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">1. כללי</h2>
                        <ul className="space-y-3 list-disc pr-6">
                            <li>התקנון מנוסח בלשון זכר מטעמי נוחות בלבד, אך מתייחס לנשים ולגברים כאחד.</li>
                            <li>התקנון מסדיר את התנאים לשימוש באתר, להקמת חנויות וירטואליות ולרכישת מוצרים דרכו, והוא מחייב את כלל המשתמשים, המוכרים והלקוחות לכל דבר ועניין.</li>
                            <li>המפעיל שומר לעצמו את הזכות לעדכן או לשנות את התקנון מעת לעת, לפי שיקול דעתו הבלעדי.</li>
                        </ul>
                    </section>

                    <section className="mb-10 bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                        <h2 className="text-2xl font-bold mb-4">2. פלטפורמת חנויות וירטואליות והגבלת אחריות</h2>
                        <ul className="space-y-3">
                            <li>2.1 האתר מאפשר למשתמשים להקים דפי קטלוג וחנויות וירטואליות לצורך הצגת ומכירת מוצרים (להלן: "חנויות צד ג'").</li>
                            <li className="font-bold">2.2 המפעיל מספק את התשתית הטכנולוגית בלבד ואינו צד לעסקאות המתבצעות בחנויות צד ג'. האחריות הבלעדית על איכות המוצרים, תיאורם, חוקיותם, אספקתם, מחירם ושירות הלקוחות שלהם חלה על בעל החנות הווירטואלית בלבד.</li>
                            <li>2.3 המפעיל אינו נושא באחריות לכל נזק, ישיר או עקיף, שייגרם למשתמש או לצד שלישי כתוצאה מרכישה או שימוש בחנות וירטואלית שהוקמה דרך האתר.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">3. מוצרים ואחריות</h2>
                        <ul className="space-y-3 list-disc pr-6">
                            <li className="font-black text-lg">כל הבשמים הנמכרים באתר ml_tlv הם בשמים מקוריים ב-100%.</li>
                            <li className="font-bold text-red-600 underline">חשוב להבהיר: לא נמכרים באתר בשמים בגודל מלא כלל.</li>
                            <li>האתר מוכר דוגמיות (דיקנטים) בלבד - זהו נוזל מבושם מקורי שנמזג לתוך כלי זכוכית ייעודי (Decant) בהתאם להזמנת הלקוח.</li>
                            <li>תמונות המוצרים באתר נועדו להמחשה בלבד ומתייחסות לבקבוק המקורי ממנו נלקח הנוזל.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">4. אספקה ומשלוחים</h2>
                        <ul className="space-y-3 list-disc pr-6">
                            <li className="font-bold underline">עלות משלוח עבור הזמנה באתר עומדת על 30 ₪.</li>
                            <li>זמן אספקה ממוצע הוא עד 10 ימי עסקים.</li>
                            <li>המפעיל אינו אחראי לעיכובים שנגרמים על ידי חברות שילוח חיצוניות או כוח עליון.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">5. ביטול עסקה והחזרות</h2>
                        <ul className="space-y-3 list-disc pr-6">
                            <li>ביטול עסקה יתבצע בהתאם לחוק הגנת הצרכן, התשמ"א – 1981.</li>
                            <li>לא ניתן להחזיר דוגמיות/דיקנטים שהוכנו במיוחד עבור הלקוח (מזיגה אישית), בשל אופי המוצר.</li>
                            <li>על מוצרי המדף (שאינם דיקנטים): ניתן לבטל עסקה תוך 14 ימים מקבלת המוצר, בתנאי שלא נפתח ולא נעשה בו שימוש.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">6. פרטיות ואבטחת מידע</h2>
                        <p>האתר מאובטח בפרוטוקול SSL. פרטי כרטיסי אשראי אינם נשמרים במערכות האתר והסליקה נעשית דרך ספקים מורשעים בלבד.</p>
                    </section>

                    <section className="mb-6 pt-8 border-t">
                        <p className="font-bold mb-4">סמכות שיפוט</p>
                        <p>על תקנון זה יחולו דיני מדינת ישראל וסמכות השיפוט הבלעדית תהא לבית המשפט המוסמך ב<b>מחוז תל אביב</b> בלבד.</p>
                    </section>

                    <p className="text-sm text-gray-400 mt-12 text-center">עודכן לאחרונה: 15 במרץ 2026</p>
                </div>
            </div>
        </div>
    );
}
