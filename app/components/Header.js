"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "@/app/components/CImage";
import MegaMenuBrands from './header/MegaMenuBrands';
import MegaMenuCatalog from './header/MegaMenuCatalog';
import MobileNav from './header/MobileNav';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import LiveVisitorCounter from './LiveVisitorCounter';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Menu, Search, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import SearchAutocomplete from './SearchAutocomplete';
import DesktopIcons from './header/DesktopIcons';
import LanguageSwitcher from './header/LanguageSwitcher';
import AnnouncementBar from './AnnouncementBar';
import './header/header_v2.css';

export default function Header({ brands = [] }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null); 
    const [headerHeight, setHeaderHeight] = useState(112);

    useEffect(() => {
        const headerEl = document.querySelector('header');
        if (!headerEl) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setHeaderHeight(entry.target.offsetHeight);
            }
        });
        resizeObserver.observe(headerEl);
        return () => resizeObserver.disconnect();
    }, []);
    const [isHoveringTop, setIsHoveringTop] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
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
    const searchParams = useSearchParams();
    const isHome = pathname === '/';

    useEffect(() => {
        setActiveMenu(null);
    }, [pathname, searchParams]);

    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(true);
    const [logoSrc, setLogoSrc] = useState('/logo_v5.png');

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const res = await fetch('/api/admin/logo');
                if (res.ok) {
                    const data = await res.json();
                    if (data.logoUrl) setLogoSrc(data.logoUrl);
                }
            } catch (e) { /* keep default */ }
        };
        fetchLogo();
    }, []);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (data.menu) {
                    setMenuItems(data.menu.filter(item => item.visible));
                }
            } catch (error) {
                console.error('Header Menu Fetch Error:', error);
            } finally {
                setMenuLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const navLinks = !menuLoading && menuItems.length > 0 
        ? [...menuItems].sort((a, b) => (a.order || 99) - (b.order || 99)).map(item => ({
            label: t(`common.${item.id}`) !== `common.${item.id}` ? t(`common.${item.id}`) : item.label,
            href: item.path,
            type: item.id === 'brands' ? 'brands' : (item.id === 'catalog' ? 'catalog' : null),
            active: pathname === item.path,
            isRed: item.isRed
        }))
        : [
            { label: t('common.home'), href: '/', active: pathname === '/' },
            { label: t('common.brands'), href: '/brands', type: 'brands', active: pathname === '/brands' },
            { label: t('common.catalog'), href: '/catalog', type: 'catalog', active: pathname === '/catalog' },
            { label: t('common.bundles'), href: '/bundles', active: pathname === '/bundles' },
            { label: t('common.discovery_sets') || 'דיסקברי סט', href: '/discovery-sets', active: pathname === '/discovery-sets' },
            { label: t('common.sales'), href: '/sales', active: pathname === '/sales' },
            { label: t('common.requests'), href: '/requests', active: pathname === '/requests' },
            { label: t('common.contact'), href: '/contact', active: pathname === '/contact' },
        ];

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsAtTop(currentScrollY <= 100);
            setIsScrolled(currentScrollY > 20);
        };

        const handleMouseMove = (e) => {
            setIsHoveringTop(e.clientY < 150);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove);

        handleScroll(); // Initial check

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const isHeaderVisible = isAtTop || isHoveringTop || activeMenu !== null || isMobileMenuOpen || isMobileSearchOpen;

    return (
        <>
            <header 
                className={`fixed top-0 !left-0 !right-0 !w-screen z-50 transition-all duration-500 group/header ${
                isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
            onMouseLeave={() => setActiveMenu(null)}
            dir={dir}
            style={{ '--header-height': `${headerHeight}px` }}
        >
            <AnnouncementBar />
            <div className={`frosted-nav group-hover/header:!bg-white group-hover/header:!backdrop-blur-none !w-screen h-20 md:h-28 relative z-40 flex items-center transition-all duration-500 ${
                !isScrolled && isHome ? '!bg-white !backdrop-blur-none !shadow-none' : ''
            }`}>
                <div className="w-full max-w-[1800px] mx-auto px-0 md:px-4 xl:px-6 h-full flex items-center justify-between">
                    
                    {/* Desktop Layout (XL and up) */}
                    <div className="hidden xl:grid w-full items-center h-full" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
                        {/* Right Side: User & Logo */}
                        <div className="flex items-center pe-2 xl:pe-4 h-full">
                            <div className="flex items-center gap-6 xl:gap-10">
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

                                {/* LOGO */}
                                <h1 className="m-0 p-0 leading-none">
                                    <Link href="/" className="block transform hover:scale-105 transition-transform duration-700">
                                        <Image 
                                            src={logoSrc} 
                                            alt="ml_tlv - דוגמיות בשמי נישה יוקרתיים" 
                                            width={160} 
                                            height={60} 
                                            className="h-10 md:h-14 w-auto object-contain inverted-logo-v2" 
                                            priority 
                                        />
                                    </Link>
                                </h1>
                            </div>
                            {/* Spacer 1 */}
                            <div className="flex-1 hidden lg:block"></div>

                            {/* Language Switcher (Centered between Logo and Nav Menu) */}
                            <div className="hidden lg:block opacity-90 hover:opacity-100 transition-opacity">
                                <LanguageSwitcher variant="header" />
                            </div>

                            {/* Spacer 2 */}
                            <div className="flex-1 hidden lg:block"></div>
                        </div>

                        {/* Center: Navigation Menu */}
                        <div className="flex items-center justify-center px-4 h-full z-10">
                            <nav className={`flex items-center ${dir === 'ltr' ? 'gap-2 xl:gap-4' : 'gap-3 xl:gap-6'} text-black`}>
                                {navLinks.map((link) => (
                                    <div 
                                        key={link.label}
                                        className="relative py-1 group"
                                        onMouseEnter={() => link.type ? setActiveMenu(link.type) : setActiveMenu(null)}
                                    >
                                        <Link 
                                            href={link.href}
                                            className={`${dir === 'ltr' ? 'text-[11px] xl:text-[12px]' : 'text-[14px]'} font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-all duration-500 ${
                                                link.isRed 
                                                    ? 'text-red-600 opacity-100 hover:text-red-700' 
                                                    : (link.active ? 'text-black opacity-100' : 'text-black opacity-40 hover:opacity-100')
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                        
                                        {link.active && !link.isRed && (
                                            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black/80 scale-x-100 transition-transform duration-500"></div>
                                        )}
                                        {!link.active && !link.isRed && (
                                            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </div>

                        {/* Left Side: Actions (Search, Icons) */}
                        <div className="flex justify-end items-center text-black h-full">
                            <div className="flex items-center gap-2 xl:gap-3">
                                <div className="v2-user-actions">
                                    <SearchAutocomplete />
                                </div>
                                <div className="flex items-center h-[34px] v2-desktop-icons">
                                    <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:hidden flex w-full items-center justify-between h-full px-4 text-black" dir={dir}>
                        {/* Right side: Back & Menu - Pushed to right edge */}
                        <div className="flex items-center gap-2">
                            {!isHome && (
                                <button
                                    onClick={() => router.back()}
                                    className="p-1 text-black hover:opacity-100 opacity-70 transition-opacity"
                                    aria-label={t('common.back') || "Back"}
                                >
                                    {dir === 'rtl' ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                                </button>
                            )}
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-1 text-black hover:opacity-100 opacity-70 transition-opacity"
                                aria-label={t('common.menu') || "Menu"}
                            >
                                <Menu size={26} />
                            </button>
                        </div>

                        <div className="flex items-center">
                            <h1 className="m-0 p-0 leading-none">
                                <Link href="/">
                                    <Image 
                                        src={logoSrc} 
                                        alt="ml_tlv - דוגמיות בשמי נישה יוקרתיים" 
                                        width={90} 
                                        height={30} 
                                        className="h-6 w-auto object-contain inverted-logo-v2" 
                                        priority 
                                    />
                                </Link>
                            </h1>
                        </div>

                        {/* Left side: Icons - Pushed to left edge */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                                className="p-1 text-black hover:text-blue-600 transition"
                                aria-label={t('common.search') || "Search"}
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
            <div className={`md:hidden bg-white border-b border-gray-100 transition-all duration-300 ease-in-out relative z-30 ${
                isMobileSearchOpen ? 'h-16 opacity-100 overflow-visible' : 'h-0 opacity-0 overflow-hidden'
            }`}>
                <div className="w-full max-w-[1800px] mx-auto px-4 h-full flex items-center">
                    <SearchAutocomplete 
                        fullWidth={true} 
                        onSelect={() => setIsMobileSearchOpen(false)} 
                    />
                </div>
            </div>



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

            {/* Mobile Nav Sidebar */}
            <MobileNav 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
                navLinks={navLinks}
                isAdmin={isAdmin}
            />
        </>
    );
}
