import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
    title: "הקם חנות משלך | ml_tlv",
    description: "צור קטלוג אישי ומכור מוצרים היישר ללקוחות שלך בקלות.",
};

export default async function CatalogsInfoPage() {
    const { userId } = await auth();

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-black text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.4) 0%, transparent 20%)', backgroundSize: '100px 100px' }}></div>
                <div className="container max-w-4xl mx-auto text-center relative z-10">
                    <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold tracking-wider mb-6 inline-block">חדש ב-ml_tlv</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        הקם <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">חנות וירטואלית</span> משלך דקות
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        פלטפורמה בלעדית למשתמשי ml_tlv: הוסף מוצרים משלך, שלח קישור אישי ללקוחות וקבל הזמנות ישירות אליך - הכל דרך המערכת שלנו בחינם!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {userId ? (
                            <Link href="/my-catalogs" className="px-8 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                                התחל עכשיו - בחינם
                            </Link>
                        ) : (
                            <Link href="/sign-up" className="px-8 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                                צור משתמש כדי להתחיל
                            </Link>
                        )}
                        <a href="#how-it-works" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-black transition-colors">
                            איך זה עובד?
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="container max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black mb-4">למה לפתוח קטלוג ב-ml_tlv?</h2>
                        <p className="text-gray-500">כל מה שאתה צריך כדי להתחיל למכור מהר.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition">
                            <div className="text-5xl mb-4">🔗</div>
                            <h3 className="text-xl font-bold mb-2">קישור אישי קצר</h3>
                            <p className="text-gray-600">קבל כתובת URL ייחודית משלך (למשל: mltlv.io/catalog/my-shop) פשוטה לשיתוף בוואטסאפ או באינסטגרם.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition">
                            <div className="text-5xl mb-4">🎨</div>
                            <h3 className="text-xl font-bold mb-2">שליטה מלאה במוצרים</h3>
                            <p className="text-gray-600">הוסף אילו מוצרים שתרצה עם תמונות, תיאורים ומחירים משלך. אתה קובע מה נמכר ובכמה.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition">
                            <div className="text-5xl mb-4">📩</div>
                            <h3 className="text-xl font-bold mb-2">הזמנות ישירות למייל</h3>
                            <p className="text-gray-600">לקוחות מוסיפים לעגלה ומשלימים פרטים. ההזמנה נשלחת ישירות אליך למייל להמשך טיפול ותשלום מולם.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-4">
                 <div className="container max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center">איך זה עובד בפועל?</h2>
                    
                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-black text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                1
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">הרשמה ופתיחת קטלוג</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">התחבר לאתר, גש ל"הקטלוגים שלי" ובחר שם וקישור לחנות. הזן את האימייל שאליו תרצה לקבל פניות.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-black text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                2
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">הוספת מוצרים</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">דרך ממשק נוח, תוכל להוסיף את הפריטים שאתה רוצה למכור. קבע שם, מחיר ותמונה לכל מוצר.</p>
                            </div>
                        </div>

                         <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-black text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                3
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">שיתוף ומכירה</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">העתק את הקישור אישי ושלח ללקוחות. יש להם עגלת קניות נפרדת ועמוד סיכום הזמנה נוח.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-black text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                4
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border-2 border-dashed border-black bg-yellow-50 rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">קבלת הזמנות וסגירת עסקה</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">בכל הזמנה שלקוח מבצע, תקבל מיד מייל עם כל פרטי הלקוח וההזמנה שלו. מכאן, אתה מתקשר מולו לסיום התשלום אופליין ולהספקת המוצר!</p>
                            </div>
                        </div>

                    </div>
                 </div>
            </section>

             {/* CTA Bottom */}
             <section className="bg-black text-white py-16 text-center px-4">
                 <h2 className="text-3xl font-black mb-6">מוכן לפתוח את החנות הבאה שלך?</h2>
                 {userId ? (
                    <Link href="/my-catalogs" className="inline-block px-10 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform overflow-hidden relative group">
                        <span className="relative z-10">בוא נתחיל עכשיו!</span>
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-yellow-400 z-0"></div>
                        <span className="relative z-10 group-hover:text-black hidden group-hover:inline ml-2">🎉</span>
                    </Link>
                ) : (
                    <Link href="/sign-up" className="inline-block px-10 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform">
                        הירשם לאתר והתחל פה
                    </Link>
                )}
             </section>

        </div>
    );
}
