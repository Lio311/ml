"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { cleanProductName } from '../lib/productUtils';
import WishlistHeart from './WishlistHeart';

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
    const { t, localize, dir } = useLanguage();
    const { addToCart, cartItems } = useCart();
    const [added, setAdded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let timer;
        if (added) {
            timer = setTimeout(() => setAdded(false), 2000);
        }
        return () => clearTimeout(timer);
    }, [added]);

    const handleAdd = (size, price) => {
        const stock = product.stock || 0;
        const currentInCart = (cartItems || []).reduce((total, item) => {
            if (item.id === product.id) {
                return total + (item.size * item.quantity);
            }
            return total;
        }, 0);

        if (currentInCart + size > stock) {
            toast.error(t('common.out_of_stock_toast'));
            return;
        }

        addToCart(product, size, price);
        toast.success(t('common.added_to_cart_toast').replace('{name}', localize(product, 'name')).replace('{size}', size));
        setAdded(true);
    };

    return (
        <div className="group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white flex flex-col h-full relative">
            <div className="absolute top-2 start-2 z-10">
                <WishlistHeart productId={product.id} />
            </div>

            <Link href={`/product/${product.slug || product.id}`} className="relative aspect-square bg-gray-50 overflow-hidden block">
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
            </Link>

            <div className="p-3 text-center flex flex-col items-center justify-center flex-1">
                {dir === 'rtl' ? (
                    <div className="flex flex-col items-center mb-1">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                            {product.brand_he || product.brand}
                        </div>
                        <Link href={`/product/${product.slug || product.id}`} className="w-full">
                            <p className="text-sm font-bold text-black truncate w-full hover:underline">
                                {product.model_he || product.model}
                            </p>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-[10px] text-gray-400 mb-0.5 line-clamp-1 uppercase tracking-wider font-medium">{product.brand || 'No Brand'}</div>
                        <Link href={`/product/${product.slug || product.id}`} className="w-full">
                            <p className="text-sm font-bold text-black truncate w-full hover:underline">
                                {cleanProductName(localize(product, 'name'), product.brand)}
                            </p>
                        </Link>
                    </>
                )}

                <div className="w-full mt-3 space-y-2">
                    {Number(product.price_2ml) > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>2 {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{product.price_2ml} ₪</span>
                                <button
                                    onClick={() => handleAdd(2, product.price_2ml)}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-5 h-5 rounded flex items-center justify-center transition"
                                >+</button>
                            </div>
                        </div>
                    )}

                    {Number(product.price_5ml) > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>5 {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{product.price_5ml} ₪</span>
                                <button
                                    onClick={() => handleAdd(5, product.price_5ml)}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-5 h-5 rounded flex items-center justify-center transition"
                                >+</button>
                            </div>
                        </div>
                    )}

                    {Number(product.price_10ml) > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>10 {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{product.price_10ml} ₪</span>
                                <button
                                    onClick={() => handleAdd(10, product.price_10ml)}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-5 h-5 rounded flex items-center justify-center transition"
                                >+</button>
                            </div>
                        </div>
                    )}

                    <Link href={`/product/${product.slug || product.id}`} className={`block w-full text-center text-[11px] py-1.5 mt-2 rounded transition ${added ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {added ? t('common.added_to_cart_btn') : t('common.more_details')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
