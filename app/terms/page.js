import FAQClient from '../faq/FAQClient';
import { terms_he, terms_en } from '../data/terms_data';
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
        title: t('common.website_terms'),
        description: t('common.terms_desc') || "Website terms and conditions.",
        alternates: {
            canonical: 'https://www.ml-tlv.com/terms',
        },
    };
}

export default async function TermsPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const categories = locale === 'en' ? terms_en : terms_he;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header section with background pattern */}
            <div className="bg-black text-white py-20 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]" />
                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 text-center tracking-tight">
                        {t('common.website_terms')}
                    </h1>
                    <p className="text-gray-400 text-center text-lg md:text-xl w-full mx-auto font-light leading-relaxed">
                        {t('common.faq_subtitle_header')}
                    </p>
                </div>
            </div>

            <FAQClient 
                categories={categories} 
                sidebarTitle={t('common.terms_sidebar_title')}
                footerTitle={t('common.terms_footer_title')}
                footerSubtitle={t('common.terms_footer_subtitle')}
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
