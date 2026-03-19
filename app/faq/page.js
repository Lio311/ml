export const metadata = {
    title: "שאלות ותשובות | ml_tlv",
    description: "שאלות נפוצות ותשובות בנוגע להזמנות, משלוחים ומוצרים.",
};

export default function FAQPage() {
    const categories = [
        {
            title: "מקוריות ואיכות בשמים",
            items: [
                { 
                    q: "האם הבשמים מקוריים ב-100%?", 
                    a: "חד משמעית כן. אנחנו ב-ml_tlv מתחייבים למקוריות מלאה. כל הבשמים נרכשים מהיבואנים הרשמיים או ממשווקים מורשים בלבד. אנחנו לא מתעסקים עם חיקויים או בשמי 'טסטר' ממקורות לא ידועים." 
                },
                { 
                    q: "איך מתבצע תהליך המילוי (Decanting)?", 
                    a: "תהליך המילוי מתבצע בסביבה סטרילית ומבוקרת. אנחנו משתמשים במזרקים חד-פעמיים ובמכשור מקצועי להעברת הבושם ישירות מהבקבוק המקורי לבקבוקוני זכוכית איכותיים, ללא מגע יד אדם וללא פגיעה בניחוח או באיכות הבושם." 
                },
                { 
                    q: "האם הריח בדוגמית זהה לבשום המקורי?", 
                    a: "כן, מדובר בדיוק באותו נוזל. ההבדל היחיד הוא האריזה. דוגמית היא דרך מצוינת לנסות בושם יוקרתי לפני שמשקיעים אלפי שקלים בבקבוק מלא." 
                },
                { 
                    q: "האם הדוגמיות מגיעות בבקבוק המקורי של המותג?", 
                    a: "לא. המותגים הגדולים בדרך כלל לא מייצרים דוגמיות בגדלים של 5 או 10 מ\"ל למכירה. אנחנו מעבירים את הבושם לבקבוקוני זכוכית יוקרתיים בעלי ראש התזה (Atmoizer) איכותי שמבטיח פיזור אופטימלי של הניחוח." 
                }
            ]
        },
        {
            title: "גדלים, כמויות ושימוש",
            items: [
                { 
                    q: "אילו גדלים זמינים לרכישה?", 
                    a: "אנחנו מציעים שלושה גדלים עיקריים: 2 מ\"ל (לניסיון ראשוני), 5 מ\"ל (לשימוש של כשבועיים) ו-10 מ\"ל (לשימוש ממושך או נסיעות)." 
                },
                { 
                    q: "לכמה התזות מספיקה דוגמית של 2 מ\"ל?", 
                    a: "דוגמית של 2 מ\"ל מספיקה לרוב ל-25 עד 30 התזות. זה מספיק בהחלט כדי לבחון את עמידות הבושם על העור לאורך מספר ימים." 
                },
                { 
                    q: "כמה התזות יש ב-5 מ\"ל וב-10 מ\"ל?", 
                    a: "ב-5 מ\"ל יש כ-75 התזות, וב-10 מ\"ל יש כ-150 התזות. המספר המדויק תלוי בעוצמת הלחיצה ובסוג המתיז." 
                },
                { 
                    q: "האם הבקבוקונים ניתנים למילוי חוזר?", 
                    a: "הבקבוקונים שלנו איכותיים מאוד וניתנים להברגה חוזרת, כך שתוכלו להשתמש בהם שוב לנסיעות או למילוי עצמי של בשמים אחרים לאחר שטיפה יסודית." 
                }
            ]
        },
        {
            title: "מבצעים, הגרלות ומתנות",
            items: [
                { 
                    q: "איך עובדת שיטת הדוגמיות במתנה?", 
                    a: "אנחנו אוהבים לפנק! בקנייה מעל 300 ₪ תקבלו 2 דוגמיות מתנה, מעל 500 ₪ תקבלו 4 דוגמיות, ומעל 1000 ₪ תקבלו 6 דוגמיות (בגודל 2 מ\"ל). המתנות נבחרות על ידינו בהתאם למלאי ולסגנון ההזמנה שלכם." 
                },
                { 
                    q: "מה זה 'מבצע הבזק' (Lottery Mode)?", 
                    a: "מדי פעם מופיע באתר שעון עצר שמציע הנחה משמעותית (לרוב 15%) לזמן מוגבל מאוד. עליכם לסיים את הרכישה לפני שהזמן נגמר, אחרת העגלה שלכם תתאפס וההנחה תיעלם." 
                },
                { 
                    q: "איך מפעילים את גלגל המזל?", 
                    a: "כשסכום העגלה שלכם באתר הראשי חוצה את רף ה-1200 ₪, יופיע לכם גלגל מזל עם אפשרות לזכות בפרסים מדהימים - מהנחות נוספות ועד דוגמיות יוקרה בחינם." 
                }
            ]
        },
        {
            title: "משלוחים ואיסוף עצמי",
            items: [
                { 
                    q: "מהי עלות המשלוח?", 
                    a: "עלות המשלוח היא 30 ₪ לכל חלקי הארץ. המשלוח מתבצע באמצעות חברת שליחים עד הבית." 
                },
                { 
                    q: "תוך כמה זמן המשלוח יגיע אלי?", 
                    a: "זמן האספקה הממוצע הוא 3 עד 5 ימי עסקים. בדרך כלל אנחנו מוציאים את ההזמנות מהר יותר כדי שתיהנו מהבושם כמה שיותר מהר." 
                },
                { 
                    q: "האם ניתן לבצע איסוף עצמי?", 
                    a: "כן, ניתן לבצע איסוף עצמי בחינם מרחוב וושינגטון 19, תל אביב. יש לבחור באופציה זו בעגלת הקניות ולתאם מראש בוואטסאפ." 
                }
            ]
        },
        {
            title: "מערכת הקטלוגים והשותפים",
            items: [
                { 
                    q: "ראיתי 'הבשמים של...' - מה זה אומר?", 
                    a: "בנוסף לקטלוג הראשי, אנחנו מארחים קטלוגים אישיים של אספנים ושותפים. אלו מוצרים שנשלחים ישירות מאותם ספקים אך מנוהלים דרך התשתית המאובטחת שלנו." 
                },
                { 
                    q: "האם ניתן לשלב מוצרים מקטלוגים שונים בהזמנה אחת?", 
                    a: "בוודאי. ניתן להוסיף מוצרים מכל קטלוג לעגלה אחת. שימו לב שהעגלה מחולקת ללשוניות לפי ספקים, וייתכן שיידרש תשלום משלוח נפרד לכל ספק (אלא אם צוין אחרת)." 
                }
            ]
        },
        {
            title: "שירות לקוחות והחזרות",
            items: [
                { 
                    q: "איך ניתן ליצור קשר עם שירות הלקוחות?", 
                    a: "הדרך המהירה ביותר היא דרך הוואטסאפ שלנו (הכפתור הצף באתר) או במייל. אנחנו זמינים למענה בימי חול בין 10:00 ל-18:00." 
                },
                { 
                    q: "מהי מדיניות ההחזרות?", 
                    a: "בשל העובדה שמדובר במוצרים אישיים והיגייניים (דוגמיות בושם), לא ניתן להחזיר מוצרים שנפתחו או נעשה בהם שימוש. אם המוצר הגיע תקול או דולף, אנא צרו קשר מיד ונחליף אותו עבורכם." 
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header section with background pattern */}
            <div className="bg-black text-white py-16 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]" />
                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">מרכז המידע והתמיכה</h1>
                    <p className="text-gray-400 text-center text-lg max-w-2xl mx-auto italic">
                        כל מה שצריך לדעת על עולם הבישום, ההזמנות והבונוסים של ml_tlv
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    
                    {/* Sidebar navigation for desktop */}
                    <div className="hidden md:block">
                        <div className="sticky top-24 space-y-2">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 px-3">קטגוריות</h2>
                            {categories.map((cat, idx) => (
                                <a 
                                    key={idx} 
                                    href={`#cat-${idx}`}
                                    className="block px-3 py-2 text-sm text-gray-600 hover:text-black hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                >
                                    {cat.title}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-3 space-y-12">
                        {categories.map((cat, idx) => (
                            <section key={idx} id={`cat-${idx}`} className="scroll-mt-24">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-black rounded-full" />
                                    {cat.title}
                                </h2>
                                <div className="space-y-4">
                                    {cat.items.map((item, i) => (
                                        <div key={i} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                            <h3 className="font-bold text-lg mb-3 flex justify-between items-start gap-4">
                                                <span>{item.q}</span>
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                {item.a}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        {/* Direct Contact Footer */}
                        <div className="bg-black text-white p-8 rounded-3xl mt-12 text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-50" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">לא מצאתם תשובה?</h3>
                                <p className="text-gray-400 mb-6">הצוות שלנו כאן כדי לעזור לכם למצוא את הריח המושלם</p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Link href="/contact" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition">
                                        דברו איתנו
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
