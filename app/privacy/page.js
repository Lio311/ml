export const metadata = {
    title: "מדיניות פרטיות | ml_tlv",
    description: "כיצד אנו שומרים על הפרטיות שלך.",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-center">מדיניות פרטיות</h1>
            <div className="prose max-w-none rtl bg-white p-8 rounded-xl shadow-sm border">
                <p>
                    ב-ml_tlv אנו מתייחסים לפרטיותכם ברצינות רבה.
                    <br /><br />
                    <strong>איסוף מידע</strong><br />
                    אנו אוספים רק את המידע הדרוש לצורך ביצוע ההזמנה ושיפור השירות (שם, כתובת, טלפון, מייל). איננו שומרים פרטי אשראי - הסליקה מתבצעת דרך ספק חיצוני מאובטח.
                    <br /><br />
                    <strong>שימוש במידע</strong><br />
                    המידע משמש אותנו ליצירת קשר, שליחת מוצרים, וכתיבת חשבוניות. לא נעביר את פרטיכם לצד שלישי ללא הסכמתכם, למעט לצורך הליך המשלוח.
                    <br /><br />
                    <strong>אבטחת מידע</strong><br />
                    האתר מאובטח בפרוטוקול SSL להצפנת המידע העובר ביניכם לבין השרת.
                </p>
            </div>
        </div>
    );
}
