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
                        פלטפורמה בלעדית למשתמשי ml_tlv: הוסף מוצרים משלך, שלח קישור אישי ללקוחות וקבל הזמנות ישירות אליך - הכל בחינם!
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
                        <p className="text-gray-600">כל מה שאתה צריך כדי להתחיל למכור מהר ובסטייל.</p>
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
            <section id="how-it-works" className="py-12 px-4 bg-white/50">
                 <div className="container max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black mb-10 text-center">איך זה עובד?</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <span className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">1</span>
                            <div>
                                <h3 className="font-bold text-lg mb-1">הרשמה ופתיחת קטלוג</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">התחבר לאתר, גש ל"הקטלוגים שלי" בתפריט האישי ובחר שם וקישור לחנות.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <span className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">2</span>
                            <div>
                                <h3 className="font-bold text-lg mb-1">הוספת מוצרים</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">הוסף את הפריטים שאתה רוצה למכור. קבע שם, מחיר ותמונה לכל מוצר.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <span className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">3</span>
                            <div>
                                <h3 className="font-bold text-lg mb-1">שיתוף ומכירה</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">העסק את הקישור ושלח ללקוחות. יש להם עגלת קניות נפרדת ונוחה.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-6 bg-yellow-400 rounded-2xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                            <span className="flex-shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">4</span>
                            <div>
                                <h3 className="font-bold text-lg mb-1">סגירת העסקה</h3>
                                <p className="text-black/80 text-sm leading-relaxed font-medium">קבל מייל עם פרטי ההזמנה וצור קשר עם הלקוח לסיום התשלום אופליין.</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </section>

             {/* CTA Bottom */}
             <section className="bg-black text-white py-16 text-center px-4">
                 <h2 className="text-3xl font-black mb-6">מוכן לפתוח את החנות שלך?</h2>
                 {userId ? (
                    <Link href="/my-catalogs" className="inline-block px-10 py-4 bg-yellow-400 text-black rounded-full font-black text-lg hover:scale-105 transition-transform overflow-hidden relative group">
                        <span className="relative z-10">בוא נתחיל עכשיו!</span>
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-white z-0"></div>
                        <span className="relative z-10 hidden group-hover:inline ml-2">🚀</span>
                    </Link>
                ) : (
                    <Link href="/sign-up" className="inline-block px-10 py-4 bg-yellow-400 text-black rounded-full font-black text-lg hover:scale-105 transition-transform">
                        הירשם והתחל למכור
                    </Link>
                )}
             </section>

        </div>
    );
}
