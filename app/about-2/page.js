import { cookies } from 'next/headers';
import { getT } from '../lib/getT';
import { getBrandName, buildVariants } from '../lib/brand';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brandName = await getBrandName();
    const t = getT(locale, brandName);
    const brand = buildVariants(brandName);

    return {
        title: t('common.about'),
        description: locale === 'en' 
            ? "Our story - how we turned our love for perfumes into a business of experiences."
            : "הסיפור שלנו - איך הפכנו אהבה לבשמים לעסק של חוויות.",
        alternates: {
            canonical: `${brand.url}/about`,
        },
    };
}

const AboutHE = ({ brand }) => (
    <div className="space-y-6 text-lg leading-relaxed text-gray-700 text-right" dir="rtl">
        <p>
            ברוכים הבאים ל-<strong>{brand.name}</strong>, הבית שלכם לבשמי נישה ובוטיק יוקרתיים בישראל.
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
);

const AboutEN = ({ brand }) => (
    <div className="space-y-6 text-lg leading-relaxed text-gray-700 text-left" dir="ltr">
        <p>
            Welcome to <strong>{brand.name}</strong>, your premier destination for luxury niche and boutique perfumes in Israel.
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
    const brandName = await getBrandName();
    const brand = buildVariants(brandName);

    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": locale === 'en' ? `${brand.name} - Perfume Samples & Decants` : `${brand.name} - דוגמיות בשמים ודיקאנטים`,
        "description": locale === 'en' 
            ? "Israel's leading shop for perfume samples, decants, and luxury niche fragrances. 100% original niche and boutique perfumes."
            : "חנות דוגמיות בשמים, דיקאנטים ודוגמיות יוקרה הגדולה בישראל. בשמי נישה ובוטיק מקוריים (דיקנטים, דקנטים, דקאנטים).",
        "url": brand.url,
        "logo": `${brand.url}/api/assets/logo?type=logo_header`,
        "foundingDate": "2023",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Tel Aviv",
            "addressCountry": "IL"
        },
        "sameAs": [
            `https://instagram.com/${brand.instagram}`
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
                {locale === 'en' ? <AboutEN brand={brand} /> : <AboutHE brand={brand} />}
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
        </div>
    );
}
