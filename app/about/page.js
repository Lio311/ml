import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

const getT = (locale) => {
    const dict = locale === 'en' ? en : he;
    return (key) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result[k]) result = result[k];
            else return key;
        }
        return result;
    };
};

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    return {
        title: t('common.about'),
        description: locale === 'en' 
            ? "Our story - how we turned our love for perfumes into a business of experiences."
            : "הסיפור שלנו - איך הפכנו אהבה לבשמים לעסק של חוויות.",
        alternates: {
            canonical: 'https://www.ml-tlv.com/about',
        },
    };
}

const AboutHE = () => (
    <div className="space-y-8 text-lg leading-relaxed text-gray-700 text-right font-light" dir="rtl">
        <section>
            <h2 className="text-3xl font-serif font-black text-gray-900 mb-6">הסיפור מאחורי ml-tlv</h2>
            <p>
                הכל התחיל מאהבה פשוטה — או אולי נכון יותר לומר, מהתמכרות — לניחוחות. בתור חובב בשמים מושבע, המייסד שלנו, <strong>Lior ml</strong>, מצא את עצמו שוב ושוב עומד מול המדף בחנות, מתלבט אם להוציא אלפי שקלים על בקבוק של 100 מ"ל שייתכן שיימאס עליו אחרי שבוע.
            </p>
            <p className="mt-4">
                הצורך בפתרון חכם יותר הוליד את <strong>ml-tlv</strong>. הבנו שהדרך האמיתית להכיר בושם היא לא ב-"התזה מהירה" על הנייר בחנות, אלא בחיים עצמם: בבוקר במשרד, בחדר הכושר, ובדייט בערב. הבושם צריך לחיות איתכם כדי שתדעו אם הוא באמת "שלכם".
            </p>
        </section>

        <section className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 shadow-sm">
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">הסטנדרט המקצועי שלנו</h3>
            <p>
                אנחנו ב-ml-tlv לא מתפשרים על איכות. כל <strong>דקאנט</strong> (דוגמית בושם) שיוצא מהסטודיו שלנו בתל אביב עובר תהליך קפדני:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 mr-4">
                <li><strong>100% מקוריות:</strong> כל טיפה נשאבת ישירות מהבקבוקים המקוריים בלבד. אנחנו מתחייבים לאמינות מלאה.</li>
                <li><strong>תהליך סטרילי:</strong> השימוש במזרקים חד-פעמיים ובסביבה נקייה מבטיח שהבושם שומר על הרכבו המדויק.</li>
                <li><strong>אריזת פרימיום:</strong> אנחנו משתמשים בבקבוקי זכוכית איכותיים עם מרסס (Atomizer) שמספק פיזור מושלם, ממש כמו הבקבוק המקורי.</li>
            </ul>
        </section>

        <section>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">יותר מחנות — קהילה של חובבי נישה</h3>
            <p>
                מאז הקמתנו ב-2023 בתל אביב, הפכנו לבית עבור אלפי חובבי בשמים בישראל. אנחנו גאים להציע מעל 300 סוגי בשמים ממותגי העל הנחשקים בעולם — Xerjoff, Roja, Amouage, Creed, ו-Maison Francis Kurkdjian. 
            </p>
            <p className="mt-4">
                המטרה שלנו היא להנגיש את עולם ה-<strong>Haute Parfumerie</strong> לכולם. בין אם אתם מחפשים את הבושם המושלם לחתונה, או סתם רוצים להריח כמו מיליון דולר ביום יום מבלי לשבור תוכנית חיסכון, אנחנו כאן כדי לייעץ וללוות אתכם.
            </p>
        </section>

        <div className="my-12 p-8 bg-black text-white rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12"></div>
            <h3 className="text-2xl font-serif mb-6 relative z-10 text-white">למה הלקוחות שלנו חוזרים שוב ושוב?</h3>
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-2">
                    <div className="text-4xl mb-4">🏆</div>
                    <h4 className="font-bold text-white">אמינות ללא פשרות</h4>
                    <p className="text-gray-400 text-sm">התחייבות למקוריות ב-100% בכל הזמנה.</p>
                </div>
                <div className="space-y-2">
                    <div className="text-4xl mb-4">✨</div>
                    <h4 className="font-bold text-white">ייעוץ אישי</h4>
                    <p className="text-gray-400 text-sm">אנחנו זמינים באינסטגרם לעזור לכם לבחור.</p>
                </div>
                <div className="space-y-2">
                    <div className="text-4xl mb-4">🚚</div>
                    <h4 className="font-bold text-white">משלוח אקספרס</h4>
                    <p className="text-gray-400 text-sm">מגיעים לכל נקודה בארץ במהירות שיא.</p>
                </div>
            </div>
        </div>

        <section className="text-center pb-10">
            <p className="italic text-gray-500 mb-6">"בושם הוא לא רק ריח, הוא הזיכרון שנשאר בחדר אחרי שהלכתם."</p>
            <p className="font-bold text-gray-900">— צוות ml-tlv</p>
        </section>
    </div>
);

const AboutEN = () => (
    <div className="space-y-6 text-lg leading-relaxed text-gray-700 text-left" dir="ltr">
        <p>
            Welcome to <strong>ml_tlv</strong>, your premier destination for luxury niche and boutique perfumes in Israel.
        </p>
        <p>
            We believe that finding "your scent" is a journey, not just a transaction. That's why we established this platform—to allow you to experience the world's finest niche and boutique perfumes through <strong>luxury samples</strong> and high-quality decants, all at accessible prices and in practical quantities.
        </p>
        <p>
            Our curated collection features prestigious brands such as Xerjoff, Roja, Creed, Amouage, and many others. Every decant is meticulously drawn directly from original bottles in a sterile, professional environment, ensuring you receive the most authentic and precise fragrance representation.
        </p>

        <div className="my-10 p-8 bg-gray-50 border-y border-black/10 text-center">
            <h3 className="text-2xl font-serif mb-4">Why Choose Us?</h3>
            <div className="grid md:grid-cols-3 gap-8">
                <div>
                    <div className="text-3xl mb-2">💎</div>
                    <h4 className="font-bold mb-2">100% Original</h4>
                    <p className="text-sm">Full guarantee on the authenticity of every perfume.</p>
                </div>
                <div>
                    <div className="text-3xl mb-2">🎁</div>
                    <h4 className="font-bold mb-2">Gifts in Every Order</h4>
                    <p className="text-sm">Complimentary samples based on your order value.</p>
                </div>
                <div>
                    <div className="text-3xl mb-2">🚀</div>
                    <h4 className="font-bold mb-2">Fast Shipping</h4>
                    <p className="text-sm">Reliable and swift delivery across the country.</p>
                </div>
            </div>
        </div>

        <p>
            We are dedicated to helping you discover your unique personal signature. Need assistance or a personalized recommendation? We are available on Instagram for any questions you might have.
        </p>
    </div>
);

export default async function AboutPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": locale === 'en' ? "ml_tlv - Perfume Samples & Decants" : "ml_tlv - דוגמיות בשמים ודיקאנטים",
        "description": locale === 'en' 
            ? "Israel's leading shop for perfume samples, decants, and luxury niche fragrances. 100% original niche and boutique perfumes."
            : "חנות דוגמיות בשמים, דיקאנטים ודוגמיות יוקרה הגדולה בישראל. בשמי נישה ובוטיק מקוריים (דיקנטים, דקנטים, דקאנטים).",
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
    };

    return (
        <div className="min-h-screen bg-gray-50 py-20">
            <div className="container max-w-4xl mx-auto px-4">
                {locale === 'en' ? <AboutEN /> : <AboutHE />}
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
        </div>
    );
}
