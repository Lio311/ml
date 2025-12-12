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

                    {/* Desktop Orders Icon (Right) */}
                    <div className="hidden md:flex z-20 absolute right-4">
                        <SignedIn>
                            <Link href="/orders" className="relative group">
                                <span className="sr-only">ההזמנות שלי</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 hover:text-blue-600 transition">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.05 1.557M6.75 21.75H4.875c-.621 0-1.125-.504-1.125-1.125V3.225c0-.621.504-1.125 1.125-1.125h1.562a2.31 2.31 0 010 1.5H6.75v18.125z" />
                                </svg>
                            </Link>
                        </SignedIn>
                    </div>

                    {/* Mobile Menu Button */}
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

                    {/* Desktop Split Navigation & Logo */}
                    <div className="flex-1 flex justify-center items-center">

                        {/* Mobile Logo Center */}
                        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
                            <Link href="/" className="inline-block">
                                <Image src="/logo_v3.png" alt="ml." width={100} height={40} className="h-10 w-auto object-contain" priority />
                            </Link>
                        </div>

                        {/* Desktop Split Menu */}
                        {/* Desktop Split Menu */}
                        <div className="hidden md:flex flex-col items-center gap-1">
                            {/* Logo Top */}
                            <Link href="/" className="block">
                                <Image src="/logo_v3.png" alt="ml." width={180} height={70} className="h-16 w-auto object-contain" priority />
                            </Link>

                            <nav className="flex items-center gap-6 lg:gap-8">
                                <Link
                                    href="/"
                                    className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}
                                >
                                    דף הבית
                                </Link>
                                <Link
                                    href="/catalog"
                                    className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname.startsWith('/catalog') ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}
                                >
                                    קטלוג
                                </Link>

                                <Link
                                    href="/about"
                                    className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/about' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}
                                >
                                    אודות
                                </Link>
                                <Link
                                    href="/contact"
                                    className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm ${pathname === '/contact' ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}
                                >
                                    צור קשר
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* Actions - Absolute Left on Desktop */}
                    <div className="flex items-center gap-4 md:absolute md:left-4 z-20">
                        <div className="hidden md:block">
                            <LanguageSwitcher />
                        </div>
                        <SignedIn>
                            <div className="flex items-center gap-2">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium hover:text-gray-600 transition hidden md:block">
                                    התחברות
                                </button>
                            </SignInButton>
                        </SignedOut>

                        <Link href="/wishlist" className="relative group">
                            <span className="sr-only">מועדפים</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:text-red-500 transition">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </Link>



                        <Link href="/cart" className="relative group">
                            <span className="sr-only">עגלה</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22" height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="group-hover:text-green-600 transition"
                            >
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 0 0 0 2 1.61h9.72a2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
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

