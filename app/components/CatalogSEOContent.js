"use client";

import { useLanguage } from '../context/LanguageContext';

export default function CatalogSEOContent() {
    const { t, dir } = useLanguage();

    return (
        <div className="border-t border-gray-100 px-4 mt-6 pt-10">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-serif font-bold mb-8 text-center text-gray-900">
                    {t('common.catalog_seo_title')}
                </h2>
                <div className={`grid md:grid-cols-2 gap-6 pb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                {/* Perfume Bottle Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v3H9z"/><path d="M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M12 7v14"/><path d="M9 11h6"/><path d="M9 15h6"/></svg>
                            </div>
                            <h3 className={`text-lg font-bold text-black border-black ps-3 leading-none ${dir === 'rtl' ? 'border-r-2' : 'border-l-2'}`}>{t('common.why_samples_title')}</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">
                            {t('common.why_samples_desc')}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                {/* Test Tube / Vial Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v17.5A2.5 2.5 0 0 0 11.5 22h1a2.5 2.5 0 0 0 2.5-2.5V2h-6z"/><path d="M8 2h8"/><path d="M9 7h6"/><path d="M9 12h6"/></svg>
                            </div>
                            <h3 className={`text-lg font-bold text-black border-black ps-3 leading-none ${dir === 'rtl' ? 'border-r-2' : 'border-l-2'}`}>{t('common.what_is_decant_title')}</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">
                            {t('common.what_is_decant_desc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
