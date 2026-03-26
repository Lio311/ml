"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MegaMenuBrands from './MegaMenuBrands';
import MegaMenuCatalog from './MegaMenuCatalog';
import MobileNavV2 from './MobileNavV2';
import { usePathname } from 'next/navigation';
import LiveVisitorCounter from '../LiveVisitorCounter';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Menu, Search, User } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import SearchAutocomplete from '../SearchAutocomplete';
import DesktopIcons from '../header/DesktopIcons';
import LanguageSwitcher from '../header/LanguageSwitcher';
import './v2.css';

export default function HeaderV2({ brands = [] }) {
    const [activeMenu, setActiveMenu] = useState(null); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, dir } = useLanguage();
    const { globalItemsCount: cartCount } = useCart();
    const { count: wishlistCount } = useWishlist();
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'deputy';

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
            <div className="frosted-nav h-20 md:h-28 relative z-40 flex items-center">
                <div className="w-full max-w-[1800px] mx-auto ps-0 md:ps-0 pe-6 md:pe-12 h-full flex items-center justify-between">
                    
                    {/* Desktop Layout (XL and up) */}
                    <div className="hidden xl:flex w-full items-center justify-between h-full">
                        {/* Right Side: Navigation & User */}
                        <div className="flex-1 flex items-center gap-8">
                            <div className="flex items-center gap-4 border-r border-black/5 pr-0">
                                <SignedIn>
                                    <div className="flex items-center">
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </SignedIn>
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase py-2 px-4 border border-black/10 rounded-full hover:bg-black hover:text-white transition-all duration-300">
                                            <User size={14} />
                                            {t('common.login_register') || 'כניסה'}
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                            </div>
                            
                            <nav className="flex items-center gap-6 text-black">
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
                        <div className="flex-shrink-0 flex justify-center px-4">
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

                        {/* Left Side: Actions (Icons Above, Language Below) */}
                        <div className="flex-1 flex flex-col items-end gap-3 text-black">
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-8">
                                    <div className="max-w-[180px] v2-user-actions">
                                        <SearchAutocomplete />
                                    </div>
                                    <div className="flex items-center gap-6 v2-desktop-icons">
                                        <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                                    </div>
                                </div>
                                <div className="v2-lang-row scale-90 origin-center opacity-80 hover:opacity-100 transition-opacity">
                                    <LanguageSwitcher variant="header" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile/Tablet Layout (< XL) */}
                    <div className="xl:hidden flex w-full items-center justify-between h-full">
                        {/* Hamburger */}
                        <div className="flex-1 flex items-center">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ms-2 text-black hover:opacity-100 opacity-70 transition-opacity"
                            >
                                <Menu size={28} />
                            </button>
                        </div>

                        {/* Center: Logo */}
                        <div className="flex-shrink-0">
                            <Link href="/v2">
                                <Image 
                                    src="/logo_v5.png" 
                                    alt="ml." 
                                    width={120} 
                                    height={40} 
                                    className="h-8 w-auto object-contain inverted-logo-v2" 
                                    priority 
                                />
                            </Link>
                        </div>

                        {/* Left: Icons (Simplified for mobile) */}
                        <div className="flex-1 flex items-center justify-end gap-2 text-black">
                             <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Sidebar */}
            <MobileNavV2 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
                navLinks={navLinks}
                isAdmin={isAdmin}
            />

            {/* Mega Menus (Desktop) */}
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
                    border-bottom-color: black !important;
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
