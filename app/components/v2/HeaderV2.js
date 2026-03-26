"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MegaMenuBrands from './MegaMenuBrands';
import MegaMenuCatalog from './MegaMenuCatalog';
import { usePathname } from 'next/navigation';
import LiveVisitorCounter from '../LiveVisitorCounter';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useUser } from '@clerk/nextjs';
import UserActions from '../header/UserActions';
import DesktopIcons from '../header/DesktopIcons';
import LanguageSwitcher from '../header/LanguageSwitcher';
import './v2.css';

export default function HeaderV2({ brands = [] }) {
    const [activeMenu, setActiveMenu] = useState(null); 
    const { t, dir } = useLanguage();
    const { globalItemsCount: cartCount } = useCart();
    const { count: wishlistCount } = useWishlist();
    const { user } = useUser();

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
            className="fixed top-0 w-full z-50 transition-all duration-500"
            onMouseLeave={() => setActiveMenu(null)}
            dir={dir}
        >
            <div className="frosted-nav h-24 md:h-28 relative z-40 flex items-center">
                <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 h-full flex items-center justify-between">
                    
                    {/* Right Side: Navigation */}
                    <div className="flex-1 flex items-center">
                        <nav className="hidden xl:flex items-center gap-6 text-black">
                            {navLinks.map((link) => (
                                <div 
                                    key={link.label}
                                    className="relative py-2 group"
                                    onMouseEnter={() => link.type ? setActiveMenu(link.type) : setActiveMenu(null)}
                                >
                                    <Link 
                                        href={link.href}
                                        className={`text-[12px] font-bold tracking-[0.1em] uppercase transition-all duration-500 ${
                                            link.active ? 'text-black opacity-100' : 'text-black opacity-40 hover:opacity-100'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                    
                                    {link.active && (
                                        <div className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-black/80 scale-x-100 transition-transform duration-500"></div>
                                    )}
                                    {!link.active && (
                                        <div className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Center: Logo */}
                    <div className="flex-shrink-0 flex justify-center px-8">
                        <Link href="/v2" className="block transform hover:scale-105 transition-transform duration-700">
                            <Image 
                                src="/logo_v5.png" 
                                alt="ml." 
                                width={180} 
                                height={70} 
                                className="h-12 md:h-16 w-auto object-contain inverted-logo-v2" 
                                priority 
                            />
                        </Link>
                    </div>

                    {/* Left Side: Actions (Icons, Search, Language) */}
                    <div className="flex-1 flex items-center justify-end gap-6">
                        <div className="flex items-center gap-4 v2-user-actions">
                            <LanguageSwitcher variant="header" />
                            <div className="hidden lg:flex w-[1px] h-4 bg-black/10 mx-2"></div>
                            <UserActions />
                        </div>
                        <div className="flex items-center gap-6 v2-desktop-icons">
                            <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                        </div>
                    </div>
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

            <style jsx global>{`
                .inverted-logo-v2 {
                    filter: brightness(0);
                }
                .v2-user-actions input {
                    background: transparent !important;
                    border-bottom-color: rgba(0,0,0,0.2) !important;
                }
                .v2-user-actions input:focus {
                    border-bottom-color: black !important;
                }
                .v2-desktop-icons svg {
                    color: black !important;
                }
                .dir-rtl {
                    direction: rtl;
                }
            `}</style>
        </header>
    );
}
