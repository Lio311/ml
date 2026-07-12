"use client";

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function MegaMenuCatalog({ isOpen, onClose }) {
    const { t } = useLanguage();

    const categories = [
        { 
            id: 'summer', 
            label: t('common.summer'), 
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
            label: t('common.winter'), 
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
            label: t('common.men'), 
            href: '/catalog?gender=גברים',
            icon: (
                <svg className="w-16 h-16 text-gray-300 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="10" cy="14" r="5" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5L19 5m0 0h-4m4 0v4" />
                </svg>
            )
        },
        { 
            id: 'women', 
            label: t('common.women'), 
            href: '/catalog?gender=נשים',
            icon: (
                <svg className="w-16 h-16 text-pink-300 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="9" r="5" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v7m-3-3h6" />
                </svg>
            )
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-full left-0 w-full glass-dark py-6 z-40 flex flex-col justify-center overflow-y-auto"
                    onMouseLeave={onClose}
                    style={{ 
                        height: 'calc(82vh - var(--header-height, 112px))',
                        minHeight: '400px'
                    }}
                >
            <div className="container mx-auto max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">
                    {categories.map((cat) => (
                        <Link 
                            key={cat.id} 
                            href={cat.href}
                            onClick={onClose}
                            className="quadrant glass flex flex-col items-center justify-center p-12 border border-transparent hover:border-white/20 hover:bg-white/5 transition-all duration-300 rounded-xl group/item relative overflow-hidden"
                        >
                            <div className="quadrant-icon mb-6 transform group-hover/item:scale-110 transition-all duration-500">
                                {cat.icon}
                            </div>
                            <h3 className="text-2xl font-serif text-white mb-2">{cat.label}</h3>
                            
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
