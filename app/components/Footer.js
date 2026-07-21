'use client';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useBrand } from '../context/BrandContext';

export default function Footer() {
    const { t, dir } = useLanguage();
    const brand = useBrand();
    return (
        <footer className="border-t bg-black text-white py-2 overflow-hidden mt-auto">
            <div className={`container grid grid-cols-2 md:grid-cols-5 gap-4 text-center py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>

                <div>
                    <h3 className="text-lg font-bold mb-4 tracking-widest">{brand.name}</h3>
                    <p className="text-sm text-gray-400">
                        {t('common.footer_tagline')}
                    </p>
                    <div className="mt-4">
                        <Link href="/catalogs-info" className="text-yellow-400 font-bold hover:underline transition">
                            {t('common.create_store')}
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">{t('common.popular_brands')}</h3>
                    <ul className={`grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-center text-gray-400`}>
                        <li><Link href="/brands/Xerjoff" className="hover:text-white transition">Xerjoff</Link></li>
                        <li><Link href="/brands/Creed" className="hover:text-white transition">Creed</Link></li>
                        <li><Link href="/brands/Kilian" className="hover:text-white transition">Kilian</Link></li>
                        <li><Link href="/brands/Initio" className="hover:text-white transition">Initio</Link></li>
                        <li><Link href="/brands/Tom%20Ford" className="hover:text-white transition">Tom Ford</Link></li>
                        <li><Link href="/brands/Amouage" className="hover:text-white transition">Amouage</Link></li>
                        <li><Link href="/brands/Clive%20Christian" className="hover:text-white transition">Clive Christian</Link></li>
                        <li><Link href="/brands/Roja" className="hover:text-white transition">Roja</Link></li>
                        <li><Link href="/brands/Sospiro" className="hover:text-white transition">Sospiro</Link></li>
                        <li><Link href="/brands/Maison%20Francis%20Kurkdjian" className="hover:text-white transition">Maison Francis Kurkdjian</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">{t('common.top_categories')}</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><Link href="/catalog?category=בוטיק" className="hover:text-white transition">{t('common.boutique_perfumes')}</Link></li>
                        <li><Link href="/catalog?category=נישה" className="hover:text-white transition">{t('common.niche_perfumes')}</Link></li>
                        <li><Link href="/catalog?category=דיזיינר" className="hover:text-white transition">{t('common.designer_perfumes')}</Link></li>
                        <li><Link href="/catalog?category=יוניסקס" className="hover:text-white transition">{t('common.unisex_perfumes')}</Link></li>
                        <li><Link href="/catalog?category=גברים" className="hover:text-white transition">{t('common.men_perfumes')}</Link></li>
                        <li><Link href="/catalog?category=נשים" className="hover:text-white transition">{t('common.women_perfumes')}</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">{t('common.info_and_terms')}</h3>
                    <ul className={`space-y-2 text-sm text-gray-400`}>
                        <li><Link href="/about" className="hover:text-white transition">{t('common.about_ml_tlv')}</Link></li>
                        <li><Link href="/faq" className="hover:text-white transition">{t('common.faq')}</Link></li>
                        <li><Link href="/contact" className="hover:text-white transition">{t('common.contact')}</Link></li>

                        <li><Link href="/terms" className="hover:text-white transition">{t('common.terms_of_service')}</Link></li>
                        <li><Link href="/shipping" className="hover:text-white transition">{t('common.shipping_returns')}</Link></li>
                        <li><Link href="/privacy" className="hover:text-white transition">{t('common.privacy_policy')}</Link></li>
                    </ul>
                </div>

                <div className="flex flex-col items-center col-span-2 md:col-span-1">
                    <h3 className="text-lg font-bold mb-2">שירות לקוחות</h3>
                    <a href="https://wa.me/972502266071" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                        <span dir="ltr">050-2266071</span>
                    </a>

                    <h3 className="text-lg font-bold mb-4">{t('common.follow_us')}</h3>
                    <a
                        href={`https://instagram.com/${brand.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24" height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="bg-gradient-to-tr from-yellow-400 to-purple-600 text-white rounded-lg p-0.5"
                        >
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        <span dir="ltr">@{brand.instagram}</span>
                    </a>

                    <div className="space-y-3 pt-6 border-t border-gray-800 w-full">
                        <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition block">
                            {t('common.perfume_magazine')}
                        </Link>
                        <Link href="/reviews" className="text-sm text-gray-400 hover:text-white transition block">
                            {t('common.user_reviews')}
                        </Link>
                    </div>
                </div>

            </div>
            <div className="container mt-2 pt-2 border-t border-gray-800 text-center text-xs text-gray-500">
                © 2022 {brand.name}. {t('common.all_rights_reserved')}
            </div>
        </footer>
    );
}
