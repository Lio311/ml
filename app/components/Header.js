"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignedIn } from '@clerk/nextjs';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// Modular Components
import MobileNav from './header/MobileNav';
import UserActions from './header/UserActions';
import DesktopNav from './header/DesktopNav';
import DesktopIcons from './header/DesktopIcons';
import LiveVisitorCounter from './LiveVisitorCounter';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ brands = [], menu = [] }) {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'deputy';
    const { globalItemsCount: cartCount } = useCart();
    const { count: wishlistCount } = useWishlist();
    const { locale, toggleLanguage, t } = useLanguage();

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Top Bar - Black Promo Strip */}
            <div className="hidden md:flex justify-between items-center bg-black text-white text-[10px] md:text-xs py-1 px-4 tracking-widest uppercase">
                <div className="flex-1 flex justify-start gap-4 items-center">
                    <LiveVisitorCounter />
                </div>
                <div className="text-center font-bold">{t('common.free_shipping_strip')}</div>
                <div className="flex-1"></div>
            </div>

            {/* Main Header Container */}
            <div className="w-full px-3 md:px-6 py-2 md:py-4 relative bg-white">
                {/* Mobile Header (Visible on Mobile Only) */}
                <div className="md:hidden">
                    <MobileNav 
                        menu={menu} 
                        cartCount={cartCount} 
                        wishlistCount={wishlistCount} 
                        isAdmin={isAdmin} 
                    />
                </div>

                {/* Desktop Header (Visible on Desktop Only) */}
                <div className="hidden md:flex flex-col w-full">
                    {/* Top Row for Language Switcher - Positioned Above Icons */}
                    <div className="flex justify-end pb-2">
                        <LanguageSwitcher variant="header" />
                    </div>

                    <div className="grid grid-cols-3 items-center w-full mt-1">
                        {/* Desktop RIGHT Group (RTL Start): Search + User Profile */}
                        <div className="flex items-center justify-start gap-4">
                            <UserActions />
                        </div>

                        {/* Desktop CENTER Group: Logo + Navigation Links */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Link href="/" className="block">
                                <Image src="/logo_v5.png" alt="ml." width={180} height={70} className="h-16 w-auto object-contain" priority />
                            </Link>
                            <DesktopNav menu={menu} brands={brands} />
                        </div>

                        {/* Desktop LEFT Group (RTL End): Orders + Wishlist + Cart */}
                        <div className="flex items-center justify-end gap-6">
                            <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
