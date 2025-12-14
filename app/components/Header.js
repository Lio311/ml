"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useCart } from '../context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
    const { cartItems } = useCart();
    const pathname = usePathname();
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Top Bar - Black Promo Strip */}
            <div className="bg-black text-white text-[10px] md:text-xs py-2 text-center tracking-widest uppercase">
                משלוח בלוקר לכל הארץ ב-30 ₪
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-2 md:py-4 relative">
                <div className="flex items-center justify-between">



                    {/* Mobile Menu Button (Visible on Mobile Only) */}
                    <div className="md:hidden z-20">
                        <button
                            className="p-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>

                    {/* Desktop RIGHT Group: User + Search */}
                    <div className="hidden md:flex items-center gap-4 z-20 absolute right-4">
                        {/* User Icon (Rightmost) */}
                        <SignedIn>
                            <div className="flex items-center gap-2">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm font-bold text-white bg-black px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hidden md:block transform hover:-translate-y-0.5">
                                    התחברות
                                </button>
                            </SignInButton>
                        </SignedOut>

                        {/* Search Bar */}
                        <form action="/catalog" method="get" className="relative group">
                            <input
                                type="text"
                                name="q"
                                placeholder="חיפוש..."
                                className="border-b border-gray-300 py-1 px-2 text-sm focus:outline-none focus:border-black transition-all w-24 focus:w-48 bg-transparent"
                            />
                            <button type="submit" className="absolute left-0 top-1 text-gray-400 group-focus-within:text-black hover:text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Desktop CENTER Group: Logo + Menu */}
                    <div className="flex-1 flex justify-center items-center">
                        {/* Mobile Logo Center */}
                        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
                            <Link href="/" className="inline-block">
                                <Image src="/logo_v3.png" alt="ml." width={100} height={40} className="h-10 w-auto object-contain" priority />
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex flex-col items-center gap-2">
                            <Link href="/" className="block">
                                <Image src="/logo_v3.png" alt="ml." width={180} height={70} className="h-16 w-auto object-contain" priority />
                            </Link>
                            <nav className="flex items-center gap-6 lg:gap-8">
                                <Link href="/" className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}>דף הבית</Link>
                                <Link href="/catalog" className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname.startsWith('/catalog') ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}>קטלוג</Link>
                                <Link href="/matching" className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/matching' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}>התאמת מארזים</Link>
                                <Link href="/about" className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/about' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}>אודות</Link>
                                <Link href="/contact" className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/contact' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}>צור קשר</Link>
                            </nav>
                        </div>
                    </div>

                    {/* Desktop LEFT Group: Orders + Wishlist + Cart */}
                    <div className="flex items-center gap-4 md:absolute md:left-4 z-20">

                        {/* Orders (Moved here) */}
                        <SignedIn>
                            <Link href="/orders" className="relative group hidden md:block" title="ההזמנות שלי">
                                <span className="sr-only">ההזמנות שלי</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 hover:text-blue-600 transition">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </Link>
                        </SignedIn>

                        {/* Wishlist */}
                        <Link href="/wishlist" className="relative group">
                            <span className="sr-only">מועדפים</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:text-red-500 transition">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className="relative group">
                            <span className="sr-only">עגלה</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22" className="group-hover:text-green-600 transition">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Mobile Auth (Hidden on Desktop) */}
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="md:hidden relative group">
                                    <span className="sr-only">התחברות</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden">
                    <div className="flex flex-col gap-6 text-xl font-bold text-center">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="border-b pb-4">
                            דף הבית
                        </Link>
                        <Link href="/catalog" onClick={() => setIsMenuOpen(false)} className="border-b pb-4">
                            קטלוג
                        </Link>
                        <Link href="/matching" onClick={() => setIsMenuOpen(false)} className="border-b pb-4">
                            התאמת מארזים
                        </Link>
                        <Link href="/about" onClick={() => setIsMenuOpen(false)} className="border-b pb-4">
                            אודות
                        </Link>
                        <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="border-b pb-4">
                            צור קשר
                        </Link>
                        <button onClick={() => setIsMenuOpen(false)} className="mt-8 text-sm text-gray-500 underline">
                            סגור תפריט
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

