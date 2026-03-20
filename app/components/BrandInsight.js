import Image from 'next/image';
import { getBrandInsight } from '../lib/db';
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

const localize = (obj, field, locale) => {
    if (!obj) return '';
    if (locale === 'en' && obj[`${field}_en`]) {
        return obj[`${field}_en`] || obj[field];
    }
    return obj[field] || '';
};

export default async function BrandInsight({ brand }) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const insight = await getBrandInsight(brand);
    
    if (!insight) return null;

    return (
        <section className="mt-12 pt-12 pb-0 border-t border-gray-100 bg-white" dir={dir}>
            <div className="max-w-5xl mx-auto px-4 md:px-0">
                    {/* Brand Meta */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {insight.logo_url && (
                            <div className="w-full md:w-1/3 flex justify-center md:justify-end mb-4 md:mb-0">
                                <div className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-center justify-center aspect-square w-48 h-48 md:w-64 md:h-64 sticky top-24">
                                    <Image 
                                        src={insight.logo_url} 
                                        alt={insight.name} 
                                        width={256} 
                                        height={256} 
                                        className="w-full h-full object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                        <div className={`mb-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight">
                                {localize(insight, 'title', locale)}
                            </h2>
                        </div>
                        
                        <p className={`text-gray-700 leading-relaxed text-base md:text-lg mb-8 max-w-none text-justify group`}>
                            {localize(insight, 'description', locale)}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">{t('common.brand_signature')}</h4>
                                <p className={`text-sm text-gray-800 leading-snug ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {localize(insight, 'highlights', locale)}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">{t('common.the_nose')}</h4>
                                <p className={`text-sm text-gray-800 leading-snug ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {localize(insight, 'perfumer', locale)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
