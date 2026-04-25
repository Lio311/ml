import FAQClient from '../faq/FAQClient';
import { shipping_he, shipping_en } from '../data/shipping_data';
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
        title: t('common.shipping_returns'),
        description: locale === 'en' 
            ? "Information on shipping options, delivery times and return policy."
            : "מידע על אפשרויות משלוח, זמני אספקה ומדיניות החזרות.",
        alternates: {
            canonical: 'https://www.ml-tlv.com/shipping',
        },
    };
}

export default async function ShippingPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const categories = locale === 'en' ? shipping_en : shipping_he;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header section with background pattern */}
            <div className="bg-black text-white py-20 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                        {t('common.shipping_returns')}
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        {t('common.faq_subtitle_header')}
                    </p>
                </div>
            </div>

            <FAQClient 
                categories={categories} 
                sidebarTitle={t('common.order_info')}
                footerTitle={t('common.shipping_help')}
                footerSubtitle={t('common.shipping_footer_subtitle')}
                contactBtnText={t('common.contact_now')}
            />
            
            <div className="container mx-auto px-4 max-w-5xl mt-12 text-center">
                <p className="text-gray-400 text-sm">
                    {t('common.last_updated')}: {locale === 'en' ? 'March 20, 2026' : '20 במרץ 2026'}
                </p>
            </div>
        </div>
    );
}
