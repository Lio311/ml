export const metadata = {
    title: "מי אנחנו | ml_tlv",
    description: "הסיפור שלנו - איך הפכנו אהבה לבשמים לעסק של חוויות.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-20">
            <div className="container max-w-4xl mx-auto">
                <div className="space-y-6 text-lg leading-relaxed text-gray-700">
                    <p>
                        ברוכים הבאים ל-<strong>ml_tlv</strong>, הבית שלכם לבשמי נישה ובוטיק יוקרתיים בישראל.
                    </p>
                    <p>
                        אנחנו מאמינים שלמצוא את "הריח שלך" זה מסע, לא סתם רכישה. לכן הקמנו את הפלטפורמה הזו -
                        כדי לאפשר לכם להתנסות בבשמי נישה ובוטיק, <strong>דוגמיות יוקרה</strong> ודיקאנטים האיכותיים ביותר בעולם, במחירים נגישים ובכמויות קטנות.
                    </p>
                    <p>
                        הקולקציה שלנו כוללת מותגים כמו Xerjoff, Roja, Creed, Amouage ועוד רבים וטובים.
                        כל הדוגמיות (Decants) נשאבות ישירות מהבקבוקים המקוריים בתהליך סטרילי ומקצועי,
                        כדי להבטיח שתקבלו את הריח האותנטי והמדויק ביותר.
                    </p>

                    <div className="my-10 p-8 bg-gray-50 border-y border-black/10 text-center">
                        <h3 className="text-2xl font-serif mb-4">למה לבחור בנו?</h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div>
                                <div className="text-3xl mb-2">💎</div>
                                <h4 className="font-bold mb-2">100% מקורי</h4>
                                <p className="text-sm">כל הבשמים מקוריים בהתחייבות מלאה.</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">🎁</div>
                                <h4 className="font-bold mb-2">פינוקים בכל הזמנה</h4>
                                <p className="text-sm">דוגמיות מתנה על פי גובה ההזמנה.</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">🚀</div>
                                <h4 className="font-bold mb-2">משלוח מהיר</h4>
                                <p className="text-sm">שירות מהיר ואמין לכל הארץ.</p>
                            </div>
                        </div>
                    </div>

                    <p>
                        אנחנו כאן כדי לעזור לכם למצוא את החתימה האישית שלכם.
                        נתקעתם? צריכים המלצה? אנחנו זמינים באינסטגרם לכל שאלה.
                    </p>
                </div>
            </div>

            {/* SEO: Organization Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "ml_tlv - דוגמיות בשמים ודיקאנטים",
                        "description": "חנות דוגמיות בשמים, דיקאנטים ודוגמיות יוקרה הגדולה בישראל. בשמי נישה ובוטיק מקוריים (דיקנטים, דקנטים, דקאנטים).",
                        "url": "https://www.ml-tlv.com",
                        "logo": "https://www.ml-tlv.com/logo_v5.png",
                        "foundingDate": "2023",
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": "Tel Aviv",
                            "addressCountry": "IL"
                        },
                        "sameAs": [
                            "https://instagram.com/ml_tlv"
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer support",
                            "availableLanguage": ["Hebrew", "English"]
                        }
                    })
                }}
            />
        </div>
    );
}
