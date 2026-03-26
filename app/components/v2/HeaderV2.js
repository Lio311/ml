"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MegaMenuBrands from './MegaMenuBrands';
import MegaMenuCatalog from './MegaMenuCatalog';
import { usePathname } from 'next/navigation';
import LiveVisitorCounter from '../LiveVisitorCounter';
import { useLanguage } from '../../context/LanguageContext';
import './v2.css';

export default function HeaderV2({ brands = [] }) {
    const [activeMenu, setActiveMenu] = useState(null); 
    const { t } = useLanguage();

    const navLinks = [
        { label: 'דף הבית', href: '/v2', active: true },
        { label: 'מותגים', href: '/brands', type: 'brands' },
        { label: 'קטלוג', href: '/catalog', type: 'catalog' },
        { label: 'התאמת בושם', href: '/matching' },
        { label: 'בקשת בשמים', href: '/requests' },
        { label: 'צור קשר', href: '/contact' },
    ];

    return (
        <header 
            className="sticky top-0 w-full z-50 transition-all duration-500"
            onMouseLeave={() => setActiveMenu(null)}
        >
            {/* Top Bar - Black Promo Strip (Restored from Original) */}
            <div className="hidden md:flex justify-between items-center bg-black text-white text-[10px] md:text-xs py-1 px-4 tracking-widest uppercase relative z-50">
                <div className="flex-1 flex justify-start gap-4 items-center">
                    <LiveVisitorCounter />
                </div>
                <div className="text-center font-bold">{t('common.free_shipping_strip')}</div>
                <div className="flex-1"></div>
            </div>

            <div className="frosted-nav h-20 relative z-40">
                <div className="container mx-auto h-full px-6 flex items-center justify-between">
                
                {/* Header Icons (Left Side - LTR Layout for icons) */}
                <div className="flex items-center gap-6 order-last md:order-first">
                    <button className="icon-glow p-2 rounded-lg text-black/80 hover:text-black transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button className="icon-glow p-2 rounded-lg text-black/80 hover:text-black transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </button>
                    <Link href="/catalog?flavor=checkout" className="icon-glow p-2 rounded-lg text-black/80 hover:text-black transition-all relative">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 118 0m-4 15V11m-4 11H8m12 0a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                    </Link>
                    <div className="h-4 w-[1px] bg-black/10 mx-2"></div>
                    <button className="text-[10px] font-bold tracking-widest hover:opacity-100 opacity-60 transition-opacity">EN / עב</button>
                </div>

                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center gap-8 dir-rtl text-black">
                    {navLinks.map((link) => (
                        <div 
                            key={link.label}
                            className="relative py-2 group"
                            onMouseEnter={() => link.type ? setActiveMenu(link.type) : setActiveMenu(null)}
                        >
                            <Link 
                                href={link.href}
                                className={`text-[13px] font-medium tracking-wide uppercase transition-all duration-300 ${
                                    link.active ? 'text-black' : 'text-black/60 hover:text-black'
                                }`}
                            >
                                {link.label}
                            </Link>
                            
                            {/* Active Indicator (Glow Frosted Square) */}
                            {link.active && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black/80 shadow-[0_0_10px_rgba(0,0,0,0.4)]"></div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Logo (Centered) */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <Link href="/v2">
                        <span className="text-2xl font-bold tracking-tighter text-black select-none">ml-tlv.</span>
                    </Link>
                </div>

            </div>

            {/* Mega Menus */}
            <MegaMenuBrands 
                brands={brands} 
                isOpen={activeMenu === 'brands'} 
                onClose={() => setActiveMenu(null)} 
            />
            <MegaMenuCatalog 
                isOpen={activeMenu === 'catalog'} 
                onClose={() => setActiveMenu(null)} 
            />

            </div>

            <style jsx>{`
                .icon-glow:hover {
                    background: rgba(255, 255, 255, 0.4);
                    box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.6), 0 0 20px rgba(255, 255, 255, 0.2);
                }
                .dir-rtl {
                    direction: rtl;
                }
            `}</style>
        </header>
    );
}
