"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useCart } from '../context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import SearchAutocomplete from './SearchAutocomplete';

import { useWishlist } from '../context/WishlistContext';

export default function Header({ brands = [] }) {
    const { cartItems } = useCart();
    const { count: wishlistCount } = useWishlist();
    const pathname = usePathname();
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBrandsDropdownOpen, setIsBrandsDropdownOpen] = useState(false);

    // Group Brands by Letter
    const groupedBrands = brands.reduce((acc, brand) => {
        const letter = brand.name.charAt(0).toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(brand);
        return acc;
    }, {});

    const sortedLetters = Object.keys(groupedBrands).sort();
    const [menu, setMenu] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (data.menu) setMenu(data.menu.sort((a, b) => a.order - b.order));
            } catch (error) {
                console.error('Header: Error fetching menu settings', error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Top Bar - Black Promo Strip */}
            <div className="hidden md:block bg-black text-white text-[10px] md:text-xs py-2 text-center tracking-widest uppercase">
                משלוח בלוקר לכל הארץ ב-30 ₪
            </div>

            {/* Main Header */}
            <div className="w-full px-6 py-2 md:py-4 relative bg-white">
                <div className="flex flex-col md:grid md:grid-cols-3 md:items-center">

                    {/* Mobile Menu Button & Logo Row (Visible on Mobile Only) */}
                    <div className="flex md:hidden justify-between items-center w-full z-20">
                        <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>

                        <Link href="/" className="inline-block">
                            <Image src="/logo_v3.png" alt="ml." width={100} height={40} className="h-10 w-auto object-contain" priority />
                        </Link>

                        {/* Placeholder for balance or Cart on mobile */}
                        <div className="w-10"></div>
                    </div>

                    {/* Desktop RIGHT Group (RTL Start): Search + User */}
                    <div className="hidden md:flex items-center justify-start gap-4">
                        {/* User Icon (Rightmost in RTL) */}
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

                        {/* Search Bar - Smart Autocomplete */}
                        <SearchAutocomplete />
                    </div>

                    {/* Desktop CENTER Group: Logo + Menu */}
                    <div className="hidden md:flex flex-col items-center justify-center gap-2">
                        <Link href="/" className="block">
                            <Image src="/logo_v3.png" alt="ml." width={180} height={70} className="h-16 w-auto object-contain" priority />
                        </Link>
                        <nav className="flex items-center gap-6 lg:gap-8 relative whitespace-nowrap">
                            {menu.filter(item => item.visible).map(item => {
                                // Special case: Brands dropdown
                                if (item.id === 'brands') {
                                    return (
                                        <div
                                            key={item.id}
                                            className="group"
                                            onMouseEnter={() => setIsBrandsDropdownOpen(true)}
                                            onMouseLeave={() => setIsBrandsDropdownOpen(false)}
                                        >
                                            <Link
                                                href="/brands"
                                                className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm whitespace-nowrap ${pathname.startsWith('/brands') ? 'bg-black text-white' : 'text-gray-900 hover:bg-black hover:text-white'}`}
                                            >
                                                {item.label}
                                            </Link>

                                            {/* The Mega Menu Dropdown */}
                                            <div className={`absolute top-full w-[900px] bg-white text-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 rounded-b-xl overflow-hidden z-50 transition-all duration-300 origin-top transform -translate-x-1/2 left-1/2 ${isBrandsDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                                                <div className="flex flex-col max-h-[60vh]">
                                                    <div className="overflow-y-auto p-6 custom-scrollbar text-right">
                                                        {brands.length === 0 ? (
                                                            <p className="text-center text-gray-400">טוען מותגים...</p>
                                                        ) : (
                                                            <div className="columns-4 gap-8">
                                                                {sortedLetters.map(letter => (
                                                                    <div key={letter} className="break-inside-avoid mb-6">
                                                                        <h4 className="font-bold text-black border-b border-gray-200 mb-2 pb-1 text-lg sticky top-0 bg-white/95 backdrop-blur-sm">{letter}</h4>
                                                                        <div className="flex flex-col gap-1">
                                                                            {groupedBrands[letter].map(brand => (
                                                                                <Link
                                                                                    key={brand.name}
                                                                                    href={`/brands/${encodeURIComponent(brand.name)}`}
                                                                                    className="text-xs text-gray-600 hover:text-black hover:font-bold transition-colors"
                                                                                >
                                                                                    {brand.name}
                                                                                </Link>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4 bg-gray-50 border-t text-center">
                                                        <Link href="/brands" className="text-sm font-bold underline hover:text-red-600">
                                                            לכל המותגים &larr;
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.path}
                                        className={`px-5 py-2 text-sm font-bold tracking-widest transition rounded-sm whitespace-nowrap ${pathname === item.path
                                            ? (item.isRed ? 'bg-red-600 text-white' : 'bg-black text-white')
                                            : (item.isRed ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-900 hover:bg-black hover:text-white')
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Desktop LEFT Group (RTL End): Orders + Wishlist + Cart */}
                    <div className="hidden md:flex items-center justify-end gap-6">
                        {/* Orders (Rightmost in this group) */}
                        <SignedIn>
                            <Link href="/orders" className="relative group" title="ההזמנות שלי">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 hover:text-blue-600 transition">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </Link>
                        </SignedIn>

                        {/* Wishlist */}
                        <Link href="/wishlist" className="relative group" title="מועדפים">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:text-red-500 transition">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                            {/* Wishlist Count Badge */}
                            {wishlistCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white font-bold">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart (Leftmost in this group) */}
                        <Link href="/cart" className="relative group" title="עגלה">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:text-green-600 transition">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
                    {/* Close Button (Anchored Top-Left) */}
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="absolute top-5 left-5 p-2 text-black hover:bg-gray-100 rounded-full transition-colors z-50"
                        aria-label="סגור תפריט"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex flex-col gap-6 text-xl font-bold text-center overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                        <button onClick={() => setIsMenuOpen(false)} className="mt-8 text-sm text-gray-500 underline">
                            סגור תפריט
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

