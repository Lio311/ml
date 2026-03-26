"use client";

import Link from 'next/link';

export default function MegaMenuCatalog({ isOpen, onClose }) {
    if (!isOpen) return null;

    const categories = [
        { 
            id: 'summer', 
            label: 'קיץ', 
            subtitle: 'Fresh, Citrus, Clean', 
            href: '/catalog?category=קיץ',
            icon: (
                <svg className="w-16 h-16 text-yellow-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
            )
        },
        { 
            id: 'winter', 
            label: 'חורף', 
            subtitle: 'Spicy, Oriental, Woody', 
            href: '/catalog?category=חורף',
            icon: (
                <svg className="w-16 h-16 text-blue-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m9-9H3m15.364-6.364l-12.728 12.728m12.728 0L5.636 5.636" />
                </svg>
            )
        },
        { 
            id: 'men', 
            label: 'גברים', 
            subtitle: 'Classic, Aquatic, Bold', 
            href: '/catalog?gender=גברים',
            icon: (
                <svg className="w-16 h-16 text-gray-300 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        { 
            id: 'women', 
            label: 'נשים', 
            subtitle: 'Floral, Elegant, Sweet', 
            href: '/catalog?gender=נשים',
            icon: (
                <svg className="w-16 h-16 text-pink-300 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
            )
        }
    ];

    return (
        <div 
            className="absolute top-full left-0 w-full glass-dark py-20 z-40 animate-fadeIn"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">
                    {categories.map((cat) => (
                        <Link 
                            key={cat.id} 
                            href={cat.href}
                            className="quadrant glass flex flex-col items-center justify-center p-12 hover:bg-white/10 group/item relative overflow-hidden"
                        >
                            <div className="quadrant-icon mb-6 transform group-hover/item:scale-110 transition-all duration-500">
                                {cat.icon}
                            </div>
                            <h3 className="text-2xl font-serif text-white mb-2">{cat.label}</h3>
                            <p className="text-xs text-white/50 tracking-widest uppercase">{cat.subtitle}</p>
                            
                            {/* Inner Glow Mesh */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover/item:opacity-[0.05] transition-opacity duration-700 pointer-events-none blur-3xl"></div>
                        </Link>
                    ))}
                </div>
            </div>
            
            <style jsx>{`
                .quadrant {
                    height: 280px;
                }
            `}</style>
        </div>
    );
}
