'use client';

import { useState } from 'react';
import Image from './CImage';
import WishlistHeart from './WishlistHeart';
import ShareButton from './ShareButton';
import SpotifyPlayer from './SpotifyPlayer';
import { useLanguage } from '../context/LanguageContext';

export default function ProductGallery({ product, locale, localizedName }) {
    const { t } = useLanguage();
    // Collect all available images
    const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const activeImage = images[activeImageIndex] || null;

    return (
        <div className="w-full md:w-1/2 flex flex-col gap-4">
            {/* Main Image Container */}
            <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center relative shadow-sm p-8 md:p-12 group">
                {activeImage ? (
                    <Image
                        src={activeImage}
                        alt={locale === 'he' ? `דוגמית בושם ${localizedName} בנפח 2-10 מ"ל, בקבוקון זכוכית עם מתז - ml-tlv` : `${localizedName} perfume sample decant 2-10ml glass atomizer - ml-tlv`}
                        fill
                        priority
                        className="object-contain p-8 md:p-12 transition-all duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                ) : (
                    <div className="text-6xl text-gray-300">🧴</div>
                )}

                <div className="absolute top-4 start-4 z-10">
                    <WishlistHeart productId={product.id} />
                </div>

                <div className="absolute top-4 end-4 z-10">
                    <ShareButton name={product.name} />
                </div>

                {product.stock > 0 && product.stock <= 20 && (
                    <span className="absolute top-16 end-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse z-10 shadow-sm border border-red-500">
                        {t('common.limited_stock')}
                    </span>
                )}

                <div className="absolute top-4 end-16 z-20">
                    <SpotifyPlayer trackUrl={product.spotify_track_url} />
                </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 justify-center mt-2">
                    {images.map((imgUrl, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                                activeImageIndex === idx ? 'border-black' : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <Image
                                src={imgUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
