"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../context/LanguageContext';

export default function HomeClient({ newArrivals, topCatalogs }) {
    const { t, dir, localize, locale } = useLanguage();
    const isRTL = dir === 'rtl';

    return (
        <>
            {/* New Arrivals Section */}
            <section className="py-4 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl tracking-[0.2em] uppercase mb-3 font-bold text-black">{t('common.new_arrivals')}</h2>
                    <div className="w-10 h-0.5 bg-black mx-auto mb-6"></div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {newArrivals.map((product) => (
                            <ProductCardWrapper key={product.id} product={product} />
                        ))}
                    </div>

                    <Link href="/catalog" className="inline-block mt-8 mb-8 bg-black text-white px-8 py-3 rounded-full font-bold tracking-widest uppercase hover:bg-gray-800 transition shadow-md">
                        {t('common.view_all_products')}
                    </Link>
                </div>
            </section>

            {/* Hot Catalogs Section */}
            <section className="py-12 bg-gray-50 border-t border-b">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl tracking-[0.2em] uppercase mb-3 font-bold text-black">{t('common.hot_catalogs')}</h2>
                    <div className="w-10 h-0.5 bg-yellow-400 mx-auto mb-6"></div>
                    <p className="text-gray-500 mb-10 max-w-2xl mx-auto">{t('common.hot_catalogs_desc')}</p>

                    {topCatalogs.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed max-w-3xl mx-auto">
                            <div className="text-4xl mb-4 opacity-50">🏪</div>
                            <h3 className="text-xl font-bold text-gray-400">{t('common.no_active_catalogs')}</h3>
                            <p className="text-gray-400 text-sm mt-2">
                                {t('common.be_first_to_open')} <Link href="/catalogs-info" className="underline hover:text-black">{t('common.here')}</Link>.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {topCatalogs.map(cat => (
                                <Link href={`/catalog/${cat.slug}`} key={cat.id} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-yellow-200 to-yellow-400 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform overflow-hidden relative">
                                        {cat.image_url ? (
                                            <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="64px" />
                                        ) : (
                                            "🔥"
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-gray-900">{cat.name}</h3>
                                    {cat.description && <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">{cat.description}</p>}

                                    <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm font-bold">
                                        <span className="text-blue-600 group-hover:text-black transition-colors">
                                            {t('common.enter_store')} {isRTL ? '←' : '→'}
                                        </span>
                                        {cat.order_count > 0 && (
                                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                                                {cat.order_count} {t('common.purchases')}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

// This is a simple wrapper to use ProductCard inside a client component
// We import it inline to avoid the server/client boundary issue
function ProductCardWrapper({ product }) {
    const { t, localize } = useLanguage();
    return (
        <Link
            href={`/product/${product.slug || product.id}`}
            className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 16vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🌸</div>
                )}
            </div>
            <div className="p-3 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] text-gray-400 mb-0.5 line-clamp-1 uppercase tracking-wider">{product.brand || 'No Brand'}</div>
                <p className="text-sm font-bold text-black truncate w-full">
                    {(function() {
                        const name = localize(product, 'name');
                        const brand = product.brand || '';
                        if (!brand) return name;
                        
                        // Advanced cleanup: remove brand in various languages/forms
                        const BRAND_MAP = {
                            'Roja': ['רוג\'ה', 'רוגה', 'Roja'],
                            'Elixir Privé': ['אליקסיר פריבה', 'Elixir Privé', 'Elixir Prive'],
                            'Frederic Malle': ['פרדריק מאל', 'Frederic Malle'],
                            'Xerjoff': ['קסרז\'וף', 'Xerjoff'],
                            'Creed': ['קריד', 'Creed'],
                            'Kilian': ['קיליאן', 'Kilian'],
                            'Sospiro': ['סוספירו', 'Sospiro'],
                            'Amouage': ['אמואז\'', 'Amouage'],
                            'Initio': ['אינישיו', 'Initio'],
                            'Mancera': ['מנסרה', 'Mancera'],
                            'Montale': ['מונטל', 'Montale'],
                            'Byredo': ['ביירדו', 'Byredo'],
                            'Diptyque': ['דיפטיק', 'Diptyque'],
                            'Memo Paris': ['ממו פאריס', 'ממו', 'Memo Paris', 'Memo'],
                        };

                        let cleaned = name;
                        const searchBrands = BRAND_MAP[brand] || [brand];
                        
                        for (const b of searchBrands) {
                            const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
                            const regex = new RegExp(`^${escaped}\\s*`, 'i');
                            if (regex.test(cleaned)) {
                                cleaned = cleaned.replace(regex, '');
                                break;
                            }
                        }
                        
                        return cleaned.trim() || name;
                    })()}
                </p>
                {product.price_2ml && (
                    <p className="text-[11px] text-gray-500 mt-1">{t('common.from')} {product.price_2ml} ₪</p>
                )}
            </div>
        </Link>
    );
}
