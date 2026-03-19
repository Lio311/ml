import FAQClient from '../faq/FAQClient';

export const metadata = {
    title: "משלוחים והחזרות | ml_tlv",
    description: "מידע על אפשרויות משלוח, זמני אספקה ומדיניות החזרות.",
};

export default function ShippingPage() {
    const categories = [
        {
            title: "אפשרויות משלוח",
            items: [
                { 
                    q: "משלוח לנקודת איסוף (UPS EasyShip)", 
                    a: "עלות: 30 ₪. החבילה תגיע לנקודת האיסוף הקרובה לביתכם (חנות או לוקר) בתוך רשת UPS הענפה. תקבלו הודעת SMS ברגע שהחבילה מוכנה לאיסוף." 
                },
                { 
                    q: "משלוח עד הבית", 
                    a: "ניתן לתאם משלוח עד הבית באמצעות דואר ישראל בתוספת תשלום. יש לציין זאת בהערות להזמנה ואנו ניצור איתכם קשר לתיאום המחיר והגעת השליח." 
                },
                { 
                    q: "איסוף עצמי", 
                    a: "ניתן לבצע איסוף עצמי בחינם מרחוב וושינגטון 19, תל אביב. לאחר ההזמנה, יש לתאם את מועד האיסוף בוואטסאפ." 
                }
            ]
        },
        {
            title: "זמני אספקה",
            items: [
                { 
                    q: "זמן הכנת ההזמנה", 
                    a: "מכיוון שהדיקנטים שלנו נמזגים במיוחד עבורכם בעת ההזמנה, זמן ההכנה אורך לרוב 24 עד 48 שעות (בימי עסקים)." 
                },
                { 
                    q: "זמן שילוח", 
                    a: "מרגע יציאת המשלוח, זמן ההגעה המשוער לנקודת האיסוף הוא עד 5 ימי עסקים. ברוב המקרים החבילה מגיעה מהר יותר." 
                }
            ]
        },
        {
            title: "מדיניות החזרות וביטולים",
            items: [
                { 
                    q: "ביטול עסקה והחזרים", 
                    a: "ניתן לבטל עסקה ולקבל החזר כספי על מוצרים סגורים באריזתם המקורית בלבד, בתוך 14 ימים מקבלתם." 
                },
                { 
                    q: "החרגת דוגמיות בשמים (דיקנטים)", 
                    a: "שימו לב: דוגמיות בשמים המוכנות וממולאות במיוחד לפי הזמנה אישית (Custom Made) אינן ניתנות להחזרה או החלפה, אלא אם הגיעו תקולות או דולפות." 
                },
                { 
                    q: "מוצר פגום", 
                    a: "במקרה של מוצר שהגיע שבור או דולף, אנא צלמו את המוצר וצרו איתנו קשר מידית בוואטסאפ או במייל לקבלת פתרון מהיר." 
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
                    <h1 className="text-4xl md:text-6xl font-black mb-6 text-center tracking-tight">משלוחים והחזרות</h1>
                    <p className="text-gray-400 text-center text-lg md:text-xl w-full mx-auto font-light leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
                        כל מה שצריך לדעת על עולם הבישום, ההזמנות והבונוסים הייחודיים של ml_tlv. אנחנו כאן לכל שאלה.
                    </p>
                </div>
            </div>

            <FAQClient 
                categories={categories} 
                sidebarTitle="מידע על הזמנות"
                footerTitle="צריכים עזרה עם המשלוח?"
                footerSubtitle="שירות הלקוחות שלנו זמין תמיד לבירור מצב הזמנה או תיאום איסוף מיוחד."
            />
            
            <div className="container mx-auto px-4 max-w-5xl mt-12 text-center">
                <p className="text-gray-400 text-sm">עודכן לאחרונה: 20 במרץ 2026</p>
            </div>
        </div>
    );
}
