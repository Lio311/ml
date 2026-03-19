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

export default function Header({ brands = [], menu = [] }) {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'deputy';
    const { uniqueVendorsCount: cartCount } = useCart();
    const { count: wishlistCount } = useWishlist();

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Top Bar - Black Promo Strip */}
            <div className="hidden md:flex justify-between items-center bg-black text-white text-[10px] md:text-xs py-1 px-4 tracking-widest uppercase">
                <div className="flex-1 flex justify-start">
                    <LiveVisitorCounter />
                </div>
                <div className="text-center font-bold">משלוח בדואר לכל הארץ ב-30 ₪</div>
                <div className="flex-1"></div>
            </div>

            {/* Main Header Container */}
            <div className="w-full px-3 md:px-6 py-2 md:py-4 relative bg-white">
                <div className="flex flex-col md:grid md:grid-cols-3 md:items-center">
                    
                    {/* Mobile Navigation (Handles Search Overlay internally) */}
                    <MobileNav 
                        menu={menu} 
                        cartCount={cartCount} 
                        wishlistCount={wishlistCount} 
                        isAdmin={isAdmin} 
                    />

                    {/* Desktop RIGHT Group: Search + User Profile */}
                    <div className="hidden md:flex">
                        <UserActions />
                    </div>

                    {/* Desktop CENTER Group: Logo + Navigation Links */}
                    <div className="hidden md:flex flex-col items-center justify-center gap-2">
                        <Link href="/" className="block">
                            <Image src="/logo_v5.png" alt="ml." width={180} height={70} className="h-16 w-auto object-contain" priority />
                        </Link>
                        <DesktopNav menu={menu} brands={brands} />
                    </div>

                    {/* Desktop LEFT Group: Orders + Wishlist + Cart */}
                    <div className="hidden md:flex">
                        <DesktopIcons cartCount={cartCount} wishlistCount={wishlistCount} />
                    </div>
                </div>
            </div>
        </header>
    );
}
