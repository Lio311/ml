import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Breadcrumbs({ items }) {
    const { t, dir } = useLanguage();
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="mb-8 mt-2" dir={dir}>
            <ol className={`flex flex-wrap items-center text-[10px] md:text-xs text-gray-400 gap-1.5 md:gap-2 ${dir === 'rtl' ? 'flex-row' : 'flex-row'}`}>
                <li>
                    <Link href="/" className="hover:text-black transition-colors">
                        {t('common.home')}
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <span className={`text-gray-300 ${dir === 'rtl' ? '' : 'rotate-180'}`}>»</span>
                        {item.href ? (
                            <Link 
                                href={item.href} 
                                className="hover:text-black transition-colors whitespace-nowrap"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-black font-medium truncate max-w-[200px] md:max-w-none">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
