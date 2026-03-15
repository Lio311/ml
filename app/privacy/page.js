export const metadata = {
    title: "מדיניות פרטיות | ml_tlv",
    description: "מידע על איסוף נתונים, אבטחה ושמירה על פרטיות המשתמשים.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-white min-h-screen py-16 px-4 text-right" dir="rtl">
            <div className="container mx-auto max-w-4xl">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-black mb-4">מדיניות פרטיות</h1>
                    <p className="text-gray-500">ml_tlv - Privacy Policy</p>
                </header>

                <div className="bg-gray-50 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 leading-relaxed space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">1. כללי</h2>
                        <p>
                            מדיניות זו נועדה להסביר כיצד ml_tlv אוספת ומשמשת במידע האישי שלך. אנו מתחייבים לשמור על פרטיותך בהתאם לחוק הגנת הפרטיות הישראלי.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">2. איסוף מידע</h2>
                        <ul className="list-disc pr-6 space-y-2">
                            <li><strong>פרטי רכישה</strong>: שם, כתובת, טלפון ואימייל לצורך אספקת ההזמנות.</li>
                            <li><strong>ניהול חשבון</strong>: אנו משתמשים בשירות <strong>Clerk</strong> לאימות משתמשים בצורה המאובטחת ביותר.</li>
                            <li><strong>מידע טכני</strong>: שימוש בעוגיות (Cookies) לצורך תפעול האתר, ושימוש ב-Google Analytics ו-Microsoft Clarity לשיפור חוויית המשתמש.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">3. שימוש במידע ושיתוף</h2>
                        <p>
                            המידע משמש אך ורק לצורך תפעול האתר, משלוח הדיקנטים ושירות לקוחות. איננו מוכרים מידע לצדדים שלישיים.
                            המידע משותף רק עם ספקים תפעוליים (כגון UPS/דואר ישראל למשלוחים, ו-Clerk לאבטחה).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">4. אבטחה</h2>
                        <p>
                            האתר מאובטח בתקן <strong>SSL</strong>. פרטי האשראי מעובדים דרך ספקי סליקה חיצוניים עומדי תקן PCI-DSS ואינם נשמרים בשרתי האתר.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">5. יצירת קשר</h2>
                        <p>
                            לכל שאלה בנושא פרטיות ניתן לפנות למייל: 
                            <br />
                            <a href="mailto:pornfragrance@gmail.com" className="font-bold text-blue-600 underline">pornfragrance@gmail.com</a>
                        </p>
                    </section>
                </div>
                
                <p className="text-center text-gray-400 mt-12 text-sm">עודכן לאחרונה: 15 במרץ 2026</p>
            </div>
        </div>
    );
}
