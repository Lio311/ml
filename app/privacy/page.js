import FAQClient from '../faq/FAQClient';

export const metadata = {
    title: "מדיניות פרטיות | ml_tlv",
    description: "מידע על איסוף נתונים, אבטחה ושמירה על פרטיות המשתמשים.",
};

export default function PrivacyPolicyPage() {
    const categories = [
        {
            title: "כללי",
            items: [
                { 
                    q: "מטרה", 
                    a: "מדיניות זו נועדה להסביר כיצד ml_tlv אוספת ומשמשת במידע האישי שלך. אנו מתחייבים לשמור על פרטיותך בהתאם לחוק הגנת הפרטיות הישראלי." 
                }
            ]
        },
        {
            title: "איסוף מידע",
            items: [
                { 
                    q: "פרטי רכישה", 
                    a: "אנו אוספים שם, כתובת, טלפון ואימייל לצורך עיבוד ואספקת ההזמנות שלך בצורה היעילה ביותר." 
                },
                { 
                    q: "ניהול חשבון ואבטחה", 
                    a: "אנו משתמשים בשירות Clerk לאימות משתמשים. זהו אחד השירותים המובילים בעולם המבטיח שפרטי ההתחברות שלך נשמרים בצורה מאובטחת ומוצפנת, ללא גישה ישירה של הנהלת האתר לסיסמאות." 
                },
                { 
                    q: "מידע טכני ושיפור חוויה", 
                    a: "האתר משתמש בעוגיות (Cookies) לצורך תפעול תקין (כמו שמירה על עגלת הקניות). בנוסף, אנו נעזרים ב-Google Analytics ו-Microsoft Clarity כדי להבין טוב יותר איך המשתמשים גולשים באתר ולשפר את חוויית הקניה באופן מתמיד." 
                }
            ]
        },
        {
            title: "שימוש במידע ושיתוף",
            items: [
                { 
                    q: "איך אנו משתמשים במידע?", 
                    a: "המידע משמש אך ורק לצורך תפעול האתר, משלוח הדיקנטים ושירות לקוחות. איננו מוכרים או משכירים מידע אישי לצדדים שלישיים לצרכי שיווק." 
                },
                { 
                    q: "עם מי אנו משתפים מידע?", 
                    a: "מידע משותף אך ורק עם ספקים תפעוליים חיוניים: חברות השילוח (UPS, דואר ישראל) לצורך הגעת החבילה, ושירותי אבטחה (Clerk) וסליקה מורשים." 
                }
            ]
        },
        {
            title: "אבטחה וסליקה",
            items: [
                { 
                    q: "אבטחת האתר", 
                    a: "כל התקשורת באתר מוצפנת בתקן SSL מחמיר. הגלישה והזנת הנתונים שלכם בטוחה לחלוטין." 
                },
                { 
                    q: "סליקת כרטיסי אשראי", 
                    a: "פרטי האשראי שלכם אינם נשמרים בשרתי האתר. הסליקה מתבצעת ישירות מול ספקי סליקה חיצוניים העומדים בתקן PCI-DSS המחמיר ביותר." 
                }
            ]
        },
        {
            title: "יצירת קשר",
            items: [
                { 
                    q: "איך ניתן לפנות בנושאי פרטיות?", 
                    a: "לכל שאלה, בקשה לעיון במידע או מחיקתו, ניתן לפנות אלינו במייל: pornfragrance@gmail.com. אנו מבטיחים מענה מהיר ומקצועי." 
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header section with background pattern */}
            <div className="bg-black text-white py-20 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]" />
                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 text-center tracking-tight">מדיניות פרטיות</h1>
                    <p className="text-gray-400 text-center text-lg md:text-xl w-full mx-auto font-light leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
                        כל מה שצריך לדעת על עולם הבישום, ההזמנות והבונוסים הייחודיים של ml_tlv. אנחנו כאן לכל שאלה.
                    </p>
                </div>
            </div>

            <FAQClient 
                categories={categories} 
                sidebarTitle="נושאי מדיניות"
                footerTitle="יש לכם שאלות נוספות?"
                footerSubtitle="נשמח לענות על כל סוגיה בנושא פרטיות ואבטחה במייל או בוואטסאפ."
            />
            
            <div className="container mx-auto px-4 max-w-5xl mt-12 text-center">
                <p className="text-gray-400 text-sm">עודכן לאחרונה: 20 במרץ 2026</p>
            </div>
        </div>
    );
}
