import FAQClient from '../faq/FAQClient';
import { getPrivacyHe, getPrivacyEn } from '../data/privacy_data';
import { getBrandName, getBrand } from '../lib/brand';
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { cookies } from 'next/headers';
import { getT } from '../lib/getT';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brandNameStr = await getBrandName();
    const t = getT(locale, brandNameStr);
    const brand = await getBrand();

    return {
        title: t('common.privacy_policy'),
        description: locale === 'en' 
            ? "Information on data collection, security and user privacy protection."
            : "מידע על איסוף נתונים, אבטחה ושמירה על פרטיות המשתמשים.",
        alternates: {
            canonical: `https://www.${brand.hyphen}.com/privacy`,
        },
    };
}

export default async function PrivacyPolicyPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brandNameStr = await getBrandName();
    const t = getT(locale, brandNameStr);
    const brandName = brandNameStr;
    const categories = locale === 'en' ? getPrivacyEn(brandName) : getPrivacyHe(brandName);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 pt-6">
                <Breadcrumbs items={[{ label: t('common.privacy_policy') }]} />
                <BreadcrumbSchema items={[{ name: t('common.privacy_policy') }]} />
            </div>
            {/* Header section with background pattern */}
            <div className="bg-black text-white py-20 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                        {t('common.privacy_policy')}
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        {t('common.faq_subtitle_header')}
                    </p>
                </div>
            </div>

            <FAQClient 
                categories={categories} 
                sidebarTitle={t('common.policy_topics')}
                footerTitle={t('common.privacy_questions')}
                footerSubtitle={t('common.privacy_footer_subtitle')}
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
