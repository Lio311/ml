"use client";

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import SearchAutocomplete from '../SearchAutocomplete';
import { useLanguage } from '../../context/LanguageContext';

export default function UserActions({ cartCount, wishlistCount }) {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-start gap-4">
            {/* User Icon (Start in current direction) */}
            <SignedIn>
                <div className="flex items-center gap-2">
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
                    <button className="text-sm font-bold text-white bg-black px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                        {t('common.login_register')}
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
