"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import SearchAutocomplete from '../SearchAutocomplete';
import { Settings, MessageSquare, Star } from 'lucide-react';
import AdminInboxCounter from './AdminInboxCounter';

export default function MobileNav({ menu = [], cartCount, wishlistCount, isAdmin }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            {/* Search Overlay */}
            {isSearchOpen && (
                <div className="absolute inset-x-0 top-full bg-white shadow-xl p-4 border-t z-[60] animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <SearchAutocomplete fullWidth={true} onSelect={() => setIsSearchOpen(false)} />
                        </div>
                        <button
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 text-gray-500 hover:text-black font-bold text-sm"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Header Icons Container */}
            <div className="flex md:hidden justify-between items-center w-full z-20">
                <div className="flex items-center gap-0.5">
                    {/* Hamburger */}
                    <button className="p-2 -ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Search */}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 transition-colors ${isSearchOpen ? 'text-black' : 'text-gray-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </button>
                </div>

                {/* Logo */}
                <Link href="/" className="inline-block absolute left-1/2 transform -translate-x-1/2">
                    <Image src="/logo_v5.png" alt="ml." width={100} height={40} className="h-10 w-auto object-contain" priority />
                </Link>

                {/* Right Icons */}
                <div className="flex items-center gap-0">
                    <SignedIn>
                        <Link href="/my-catalogs" className="p-1.5 text-black hover:text-yellow-600 transition" title="ניהול הקטלוגים שלי">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
                        </Link>
                        <Link href="/orders" className="p-1.5 text-black relative" title="ההזמנות שלי">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </Link>
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="p-1.5 text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </button>
                        </SignInButton>
                    </SignedOut>
                    
                    {/* Wishlist */}
                    <Link href="/wishlist" className="p-1.5 text-black relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        {wishlistCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[7px] text-white font-bold">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    {/* Cart */}
                    <Link href="/cart" className="p-1.5 text-black relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[7px] text-white font-bold">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[70] bg-white pt-24 px-6 md:hidden overflow-y-auto">
                    {/* Close Button */}
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="absolute top-5 left-5 p-2 text-black hover:bg-gray-100 rounded-full transition-colors z-50"
                        aria-label="סגור תפריט"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <div className="flex flex-col gap-6 text-xl font-bold text-center pb-10">
                        <div className="flex justify-center items-center gap-4 py-4">
                            <SignedIn>
                                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-12 h-12" } }} />
                                <Link href="/my-catalogs" onClick={() => setIsMenuOpen(false)} className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                    הקטלוגים שלי
                                </Link>
                            </SignedIn>
                        </div>

                        {menu.filter(item => item.visible).map(item => (
                            <Link
                                key={item.id}
                                href={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`border-b pb-4 ${item.isRed ? 'text-red-600 font-bold' : ''}`}
                            >
                                {item.label}
                            </Link>
                        ))}

                        {/* Admin Management Links */}
                        {isAdmin && (
                            <div className="mt-4 pt-6 border-t border-gray-100 flex flex-col gap-6">
                                <AdminInboxCounter isAdmin={isAdmin} />
                                <Link 
                                    href="/admin?tab=reviews" 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-center gap-3 text-black bg-gray-100 py-3 rounded-2xl"
                                >
                                    <Star className="w-6 h-6" />
                                    <span>ניהול ביקורות</span>
                                </Link>
                                <Link 
                                    href="/admin" 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-center gap-3 text-gray-600 border border-gray-200 py-3 rounded-2xl"
                                >
                                    <Settings className="w-6 h-6" />
                                    <span>ניהול אתר</span>
                                </Link>
                            </div>
                        )}
                        
                        <button onClick={() => setIsMenuOpen(false)} className="mt-8 text-sm text-gray-500 underline font-normal">
                            סגור תפריט
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
