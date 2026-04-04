"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MegaMenuBrands from './header/MegaMenuBrands';
import MegaMenuCatalog from './header/MegaMenuCatalog';
import MobileNav from './header/MobileNav';
import { usePathname, useRouter } from 'next/navigation';
import LiveVisitorCounter from './LiveVisitorCounter';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Menu, Search, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import SearchAutocomplete from './SearchAutocomplete';
import DesktopIcons from './header/DesktopIcons';
import LanguageSwitcher from './header/LanguageSwitcher';
import './header/header_v2.css';

export default function Header({ brands = [] }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const { t, dir } = useLanguage();
    const { globalItemsCount: cartCount } = useCart();
    const { count: wishlistCount } = useWishlist();
    const { user } = useUser();
    const router = useRouter();
    const isAdmin = 
        user?.publicMetadata?.role?.toLowerCase() === 'admin' || 
        user?.publicMetadata?.role?.toLowerCase() === 'deputy' ||
        user?.publicMetadata?.isAdmin === true;

    const pathname = usePathname();
    const isHome = pathname === '/';

    const navLinks = [
        { label: t('common.home'), href: '/', active: pathname === '/' },
        { label: t('common.brands'), href: '/brands', type: 'brands', active: pathname === '/brands' },
        { label: t('common.catalog'), href: '/catalog', type: 'catalog', active: pathname === '/catalog' },
        { label: t('common.matching'), href: '/matching', active: pathname === '/matching' },
        { label: t('common.requests'), href: '/requests', active: pathname === '/requests' },
        { label: t('common.contact'), href: '/contact', active: pathname === '/contact' },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header 
            className="fixed top-0 !left-0 !right-0 !w-screen z-50 transition-all duration-500"
            onMouseLeave={() => setActiveMenu(null)}
            dir={dir}
        >
            <div className={`frosted-nav !w-screen h-20 md:h-28 relative z-40 flex items-center transition-all duration-500 ${
                !isScrolled && isHome ? '!bg-white !backdrop-blur-none !shadow-none' : ''
            }`}>
                <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 h-full flex items-center justify-between">
                    
                    {/* Desktop Layout (XL and up) */}
                    <div className="hidden xl:flex w-full items-center justify-between h-full">
                        {/* Right Side: Navigation & User */}
                        <div className="flex-1 flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <SignedIn>
                                    <div className="flex items-center">
                                        <UserButton 
                                            fallbackRedirectUrl="/" 
                                            userProfileProps={{
                                                appearance: {
                                                    elements: {
                                                        modalCloseButton: { display: 'none !important' },
                                                    },
                                                },
                                            }}
                                        />
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
                            <Link href="/" className="block transform hover:scale-105 transition-transform duration-700">
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
                            <div className="flex items-start gap-12">
                                <div className="max-w-[180px] v2-user-actions pt-1.5">
                                    <SearchAutocomplete />
                                </div>
                                <div className="flex flex-col items-center gap-5">
                                    <div className="flex items-center h-[34px] v2-desktop-icons">
                                        <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                                    </div>
                                    <div className="v2-lang-row scale-90 origin-center opacity-80 hover:opacity-100 transition-opacity">
                                        <LanguageSwitcher variant="header" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:hidden flex w-full items-center justify-between h-full px-4 text-black" dir="rtl">
                        {/* Right side: Back & Menu (Grouped to occupy 1/3 of space for centering) */}
                        <div className="flex-1 flex items-center justify-start gap-1">
                            {!isHome && (
                                <button
                                    onClick={() => router.back()}
                                    className="p-1.5 text-black hover:opacity-100 opacity-70 transition-opacity"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-1.5 text-black hover:opacity-100 opacity-70 transition-opacity"
                            >
                                <Menu size={26} />
                            </button>
                        </div>

                        {/* Center: Logo */}
                        <div className="flex-shrink-0 flex justify-center">
                            <Link href="/">
                                <Image 
                                    src="/logo_v5.png" 
                                    alt="ml." 
                                    width={100} 
                                    height={35} 
                                    className="h-7 w-auto object-contain inverted-logo-v2" 
                                    priority 
                                />
                            </Link>
                        </div>

                        {/* Left side: Icons starting with Search (Grouped to occupy 1/3 for centering) */}
                        <div className="flex-1 flex items-center justify-end gap-1">
                            <button 
                                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                                className="p-1.5 text-black hover:text-blue-600 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </button>
                             <DesktopIcons 
                                cartCount={cartCount} 
                                wishlistCount={wishlistCount} 
                                hideSearch={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Search Bar Expansion - Moved outside frosted-nav for better layout */}
            <div className={`md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ease-in-out relative z-30 ${
                isMobileSearchOpen ? 'h-16 opacity-100 overflow-visible' : 'h-0 opacity-0 overflow-hidden'
            }`}>
                <div className="w-full max-w-[1800px] mx-auto px-4 h-full flex items-center">
                    <SearchAutocomplete 
                        fullWidth={true} 
                        onSelect={() => setIsMobileSearchOpen(false)} 
                    />
                </div>
            </div>

            {/* Mobile Nav Sidebar */}
            <MobileNav 
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
