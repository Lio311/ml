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
            {/* Top Bar - Black Promo Strip */}
            <div className="hidden md:flex justify-between items-center bg-black/90 text-white text-[10px] md:text-xs py-1.5 px-6 tracking-widest uppercase relative z-50 backdrop-blur-md border-b border-white/5">
                <div className="flex-1 flex justify-start gap-4 items-center">
                    <LanguageSwitcher variant="header" />
                    <div className="w-[1px] h-3 bg-white/20 mx-2"></div>
                    <LiveVisitorCounter />
                </div>
                <div className="text-center font-bold">{t('common.free_shipping_strip')}</div>
                <div className="flex-1"></div>
            </div>

            <div className="frosted-nav h-28 md:h-32 relative z-40 flex flex-col justify-center">
                <div className="container mx-auto px-6 h-full flex flex-col justify-around py-3">
                    
                    {/* Top Row: User Actions (Search/Profile) + Logo + Icons (Wishlist/Cart) */}
                    <div className="grid grid-cols-3 items-center w-full">
                        
                        {/* Right (Start): Search + Profile */}
                        <div className="flex items-center justify-start gap-4 v2-user-actions">
                            <UserActions />
                        </div>

                        {/* Center: Logo */}
                        <div className="flex justify-center">
                            <Link href="/v2" className="block transform hover:scale-105 transition-transform duration-700">
                                <Image 
                                    src="/logo_v5.png" 
                                    alt="ml." 
                                    width={200} 
                                    height={80} 
                                    className="h-14 md:h-20 w-auto object-contain inverted-logo-v2" 
                                    priority 
                                />
                            </Link>
                        </div>

                        {/* Left (End): Wishlist + Cart */}
                        <div className="flex items-center justify-end gap-6 v2-desktop-icons">
                            <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                        </div>
                    </div>

                    {/* Bottom Row: Navigation Links */}
                    <nav className="hidden lg:flex items-center justify-center gap-12 text-black">
                        {navLinks.map((link) => (
                            <div 
                                key={link.label}
                                className="relative py-2 group"
                                onMouseEnter={() => link.type ? setActiveMenu(link.type) : setActiveMenu(null)}
                            >
                                <Link 
                                    href={link.href}
                                    className={`text-[13px] font-bold tracking-[0.15em] uppercase transition-all duration-500 ${
                                        link.active ? 'text-black opacity-100' : 'text-black opacity-60 hover:opacity-100'
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
