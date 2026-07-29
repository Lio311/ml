import FAQClient from './FAQClient';
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { getFaqHe, getFaqEn } from '../data/faq_data';
import { getBrandName, getBrand } from '../lib/brand';
import { cookies } from 'next/headers';
import { getT } from '../lib/getT';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brand = await getBrand();
    const t = getT(locale, brand.name);

    return {
        title: t('common.faq'),
        description: t('common.faq_desc'),
        alternates: {
            canonical: `https://www.${brand.hyphen}.com/faq`,
        },
    };
}

export default async function FAQPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const brandName = await getBrandName();
    const t = getT(locale, brandName);
    const categories = locale === 'en' ? getFaqEn(brandName) : getFaqHe(brandName);

    // GEO: Build FAQPage schema for rich snippets and AI engine citation
    const allFaqItems = categories.flatMap(cat => cat.items);
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": allFaqItems.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a
            }
        }))
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 pt-6">
                <Breadcrumbs items={[{ label: t('common.faq') }]} />
                <BreadcrumbSchema items={[{ name: 'שאלות ותשובות' }]} />
            </div>
            {/* GEO: FAQPage Structured Data — enables rich snippets and AI citation */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([
                    faqSchema,
                    {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": t('common.faq'),
                        "speakable": {
                            "@type": "SpeakableSpecification",
                            "cssSelector": [".faq-answer"]
                        }
                    }
                ]) }}
            />

            {/* Header section with background pattern */}
            <div className="bg-black text-white py-20 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                        {t('common.faq_title_header')}
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        {t('common.faq_subtitle_header')}
                    </p>
                </div>
            </div>

            <FAQClient 
                categories={categories} 
                sidebarTitle={t('common.categories_label')}
                footerTitle={t('common.no_answer_found')}
                footerSubtitle={t('common.faq_footer_subtitle')}
                contactBtnText={t('common.contact_now')}
            />
        </div>
    );
}

