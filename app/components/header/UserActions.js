"use client";

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import SearchAutocomplete from '../SearchAutocomplete';

export default function UserActions({ cartCount, wishlistCount }) {
    return (
        <div className="flex items-center justify-start gap-4">
            {/* User Icon (Rightmost in RTL) */}
            <SignedIn>
                <div className="flex items-center gap-2">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </SignedIn>
            <SignedOut>
                <SignInButton mode="modal">
                    <button className="text-sm font-bold text-white bg-black px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                        התחברות
                    </button>
                </SignInButton>
            </SignedOut>

            {/* Search Bar - Smart Autocomplete */}
            <SearchAutocomplete />

            {/* Common Actions (Wishlist/Cart) for Desktop could also be here or in Header. 
                In original Header.js, they were in a separate group at the end. 
                I will keep this component focused on User/Search as per original layout grid.
            */}
        </div>
    );
}
