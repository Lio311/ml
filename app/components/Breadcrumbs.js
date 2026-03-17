import Link from 'next/link';

export default function Breadcrumbs({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center text-xs md:text-sm text-gray-500 gap-2">
                <li>
                    <Link href="/" className="hover:text-black transition-colors">
                        דף הבית
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <span className="text-gray-300">«</span>
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
