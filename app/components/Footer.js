import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
    const { t, dir } = useLanguage();
    return (
        <footer className="border-t bg-black text-white py-2 overflow-hidden mt-auto">
            <div className={`container grid grid-cols-2 md:grid-cols-5 gap-4 text-center py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>

                <div>
                    <h3 className="text-lg font-bold mb-4 tracking-widest">ml_tlv</h3>
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
                    <h3 className="text-lg font-bold mb-4">{t('common.follow_us')}</h3>
                    <a
                        href="https://instagram.com/ml_tlv"
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
                        <span dir="ltr">@ml_tlv</span>
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
            <div className="container mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
                © 2022 ml_tlv. {t('common.all_rights_reserved')}
            </div>
        </footer>
    );
}
