import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
    title: "הקם חנות משלך | ml_tlv",
    description: "צור קטלוג אישי ומכור מוצרים היישר ללקוחות שלך בקלות.",
};

export default async function CatalogsInfoPage() {
    const { userId } = await auth();

    return (
        <div className="min-h-screen bg-[#FFFBEB]">
            {/* Hero Section */}
            <section className="bg-black text-white py-12 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.4) 0%, transparent 20%)', backgroundSize: '100px 100px' }}></div>
                <div className="container max-w-4xl mx-auto text-center relative z-10">
                    <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-4 inline-block">חדש ב-ml_tlv</span>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                        הקם <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">חנות וירטואלית</span> משלך בדקות
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                        פלטפורמה בלעדית למשתמשי ml_tlv: הוסף מוצרים משלך, שלח קישור אישי ללקוחות וקבל הזמנות ישירות אליך - בחינם!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {userId ? (
                            <Link href="/my-catalogs" className="px-8 py-3 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                ניהול הקטלוגים שלי
                            </Link>
                        ) : (
                            <Link href="/sign-up" className="px-8 py-3 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                צור משתמש כדי להתחיל
                            </Link>
                        )}
                        <a href="#how-it-works" className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-black transition-colors">
                            איך זה עובד?
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-12 px-4">
                <div className="container max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black mb-3">למה לפתוח קטלוג ב-ml_tlv?</h2>
                        <p className="text-gray-600 font-medium">חינם לגמרי וכל התשתיות על חשבוננו. כל מה שאתה צריך כדי להתחיל למכור מהר ובסטייל.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-yellow-100 text-center hover:scale-[1.02] transition-transform">
                            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">🔗</div>
                            <h3 className="text-xl font-bold mb-3 italic">קישור אישי קצר</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">קבל כתובת URL ייחודית משלך פשוטה לשיתוף בוואטסאפ או באינסטגרם.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-yellow-100 text-center hover:scale-[1.02] transition-transform">
                            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">🎨</div>
                            <h3 className="text-xl font-bold mb-3 italic">שליטה מלאה במוצרים</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">הוסף מוצרים עם תמונות, תיאורים ומחירים משלך. אתה קובע מה נמכר ובכמה.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-yellow-100 text-center hover:scale-[1.02] transition-transform">
                            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">📩</div>
                            <h3 className="text-xl font-bold mb-3 italic">הזמנות ישירות למייל</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">ההזמנה נשלחת ישירות אליך למייל להמשך טיפול ותשלום מול הלקוח אופליין.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-16 px-4 bg-black text-white">
                 <div className="container max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black mb-16 text-center">איך זה עובד?</h2>
                    
                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                        
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 bg-white text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                1
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">הרשמה ופתיחת קטלוג</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">התחבר לאתר, גש ל"הקטלוגים שלי" בתפריט האישי ובחר שם וקישור לחנות. הזן את האימייל שאליו תרצה לקבל פניות.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 bg-white text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                2
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">הוספת מוצרים</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">דרך ממשק נוח, תוכל להוסיף את הפריטים שאתה רוצה למכור. קבע שם, מחיר ותמונה לכל מוצר.</p>
                            </div>
                        </div>

                         <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 bg-white text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                3
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2">שיתוף ומכירה</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">העתק את הקישור אישי ושלח ללקוחות. יש להם עגלת קניות נפרדת ועמוד סיכום הזמנה נוח.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-black bg-yellow-400 text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold z-10">
                                4
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border-2 border-yellow-400 bg-yellow-400/10 rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold text-xl mb-2 text-yellow-400">קבלת הזמנות וסגירת עסקה</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">בכל הזמנה שלקוח מבצע, תקבל מיד מייל עם כל פרטי הלקוח וההזמנה שלו. מכאן, אתה מתקשר מולו לסיום התשלום אופליין!</p>
                            </div>
                        </div>

                    </div>
                 </div>
            </section>

             {/* CTA Bottom */}
             <section className="bg-yellow-400 text-black py-16 text-center px-4">
                 <h2 className="text-3xl font-black mb-6">מוכן לפתוח את החנות שלך?</h2>
                 {userId ? (
                    <Link href="/my-catalogs" className="inline-block px-10 py-4 bg-black text-white rounded-full font-black text-lg hover:scale-105 transition-transform overflow-hidden relative group">
                        <span className="relative z-10">בוא נתחיל עכשיו!</span>
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-zinc-800 z-0"></div>
                    </Link>
                ) : (
                    <Link href="/sign-up" className="inline-block px-10 py-4 bg-black text-white rounded-full font-black text-lg hover:scale-105 transition-transform">
                        הירשם והתחל למכור
                    </Link>
                )}
             </section>

        </div>
    );
}
