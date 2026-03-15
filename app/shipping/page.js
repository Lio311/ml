export const metadata = {
    title: "מדיניות משלוחים | ml_tlv",
    description: "מידע על משלוחים, זמני אספקה ומחירים.",
};

export const metadata = {
    title: "מדיניות משלוחים | ml_tlv",
    description: "מידע על משלוחים, זמני אספקה ומחירים.",
};

export default function ShippingPage() {
    return (
        <div className="bg-gray-50 min-h-screen py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-black mb-4">מדיניות משלוחים והחזרות</h1>
                    <p className="text-gray-500">UPS EasyShip & Israel Post</p>
                </header>

                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-right rtl leading-relaxed">
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">אפשרויות משלוח</h2>
                        <ul className="space-y-4 list-disc pr-6">
                            <li>
                                <strong>משלוח לנקודת איסוף (UPS EasyShip):</strong> בעלות של <strong>30 ₪</strong>. 
                                המשלוח יגיע לנקודת האיסוף הקרובה לביתכם (לוקר או חנות) בשימוש בשירות UPS.
                            </li>
                            <li>
                                <strong>משלוח עד הבית (דואר ישראל):</strong> ניתן בתוספת תשלום בתיאום אישי.
                                <p className="text-sm text-gray-500 mt-1">יש לציין זאת בהערות להזמנה ואנו ניצור איתכם קשר לתיאום התשלום והמשלוח.</p>
                            </li>
                            <li>
                                <strong>איסוף עצמי:</strong> בתיאום מראש מתל אביב (ללא עלות).
                            </li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">זמני אספקה</h2>
                        <p>
                            אנו עושים מאמץ להוציא כל הזמנה ותוכן (דיקנטים נמזגים במיוחד) תוך 24-48 שעות. 
                            זמן ההגעה המשוער לנקודת האיסוף הוא עד 5 ימי עסקים מהוצאת המשלוח.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">מדיניות החזרות</h2>
                        <p className="mb-4">
                            ניתן לבטל עסקה ולקבל החזר על מוצרים סגורים באריזתם המקורית בלבד תוך 14 ימים.
                        </p>
                        <div className="p-4 bg-red-50 border-r-4 border-red-500 rounded-l-lg">
                            <p className="font-bold text-red-800">
                                שימו לב: דוגמיות בשמים (דיקנטים) המוכנות וממולאות במיוחד לפי הזמנה אינן ניתנות להחזרה או החלפה.
                            </p>
                        </div>
                    </section>

                    <footer className="mt-12 pt-8 border-t text-center">
                        <p className="font-bold mb-2">לכל שאלה או תיאום אישי:</p>
                        <a href="mailto:pornfragrance@gmail.com" className="text-blue-600 font-bold text-xl">pornfragrance@gmail.com</a>
                    </footer>
                </div>
            </div>
        </div>
    );
}
