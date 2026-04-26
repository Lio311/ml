import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';
import { getBrand } from '../lib/brand';

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

        </div>

        <section className="text-center pb-10">
            <p className="italic text-gray-500 mb-6">"בושם הוא לא רק ריח, הוא הזיכרון שנשאר בחדר אחרי שהלכתם."</p>
            <p className="font-bold text-gray-900">צוות ml-tlv</p>
        </section>
    </div>
);

const AboutEN = ({ brand }) => {
    const brandLower = (brand?.hyphen || 'ml-tlv').toLowerCase();
    return (
        <div className="space-y-8 text-lg leading-relaxed text-gray-700 text-left font-light" dir="ltr">
            <section>
                <h2 className="text-3xl font-serif font-black text-gray-900 mb-6">The Story Behind {brandLower}</h2>
                <p>
                    It all started with a simple passion — or perhaps more accurately, an obsession — for fragrances. As a dedicated perfume enthusiast, our founder, <strong>Lio</strong>, found himself repeatedly standing before store shelves, hesitating to spend thousands on a 100ml bottle that he might grow tired of within a week.
                </p>
                <p className="mt-4">
                    The need for a smarter solution gave birth to <strong>{brandLower}</strong>. We realized that the true way to experience a perfume isn't through a "quick spray" on a paper strip in a store, but in real life: at the office in the morning, at the gym, and on a date in the evening. A fragrance needs to live with you for you to know if it's truly "yours."
                </p>
            </section>

            <section className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 shadow-sm">
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">Our Professional Standards</h3>
                <p>
                    At {brandLower}, we never compromise on quality. Every <strong>decant</strong> (perfume sample) leaving our Tel Aviv studio undergoes a rigorous process:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
                    <li><strong>100% Originality:</strong> Every drop is drawn directly from original bottles only. We guarantee full authenticity.</li>
                    <li><strong>Sterile Process:</strong> The use of disposable syringes and a clean environment ensures the fragrance maintains its exact composition.</li>
                    <li><strong>Premium Packaging:</strong> We use high-quality glass bottles with an atomizer providing perfect distribution, just like the original bottle.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">More Than a Store — A Niche Community</h3>
                <p>
                    Since our founding in 2023 in Tel Aviv, we've become a home for thousands of perfume lovers in Israel. We are proud to offer over 300 types of perfumes from the world's most coveted luxury brands — Xerjoff, Roja, Amouage, Creed, and Maison Francis Kurkdjian. 
                </p>
                <p className="mt-4">
                    Our goal is to make the world of <strong>Haute Parfumerie</strong> accessible to everyone. Whether you're looking for the perfect wedding scent or just want to smell like a million dollars every day without breaking the bank, we're here to advise and guide you.
                </p>
            </section>

            <div className="my-12 p-8 bg-black text-white rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-12 -translate-y-12"></div>
                <h3 className="text-2xl font-serif mb-10 relative z-10 text-white">Why Do Our Customers Return?</h3>
                <div className="grid md:grid-cols-3 gap-12 relative z-10">
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-white/10 group-hover:bg-white/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        </div>
                        <h4 className="font-bold text-white text-lg">Uncompromising Authenticity</h4>
                        <p className="text-gray-400 text-sm max-w-[200px]">100% originality guarantee in every order.</p>
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/></svg>
                        </div>
                        <h4 className="font-bold text-white text-lg">Personal Consultation</h4>
                        <p className="text-gray-400 text-sm max-w-[200px]">We're available on Instagram to help you choose.</p>
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.235-2.794a1 1 0 0 0-.78-.382H15V18Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                        </div>
                        <h4 className="font-bold text-white text-lg">Express Shipping</h4>
                        <p className="text-gray-400 text-sm max-w-[200px]">Fast delivery to every point in the country.</p>
                    </div>
                </div>
            </div>

            <section className="text-center pb-10">
                <p className="italic text-gray-500 mb-6">"Perfume is not just a scent, it's the memory that stays in the room after you've left."</p>
                <p className="font-bold text-gray-900">{brandLower} Team</p>
            </section>
        </div>
    );
};

export default async function AboutPage() {
    const brand = await getBrand();
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": locale === 'en' ? `${brand.name} - Perfume Samples & Decants` : `${brand.name} - דוגמיות בשמים ודיקאנטים`,
        "description": locale === 'en' 
            ? `Israel's leading shop for perfume samples, decants, and luxury niche fragrances. 100% original niche and boutique perfumes.`
            : `חנות דוגמיות בשמים, דיקאנטים ודוגמיות יוקרה הגדולה בישראל. בשמי נישה ובוטיק מקוריים (דיקנטים, דקנטים, דקאנטים).`,
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
                {locale === 'en' ? <AboutEN brand={brand} /> : <AboutHE brand={brand} />}
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
        </div>
    );
}
