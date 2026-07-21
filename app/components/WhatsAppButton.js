'use client';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function WhatsAppButton() {
    const { dir } = useLanguage();
    const { user, isLoaded } = useUser();
    const [isVisible, setIsVisible] = useState(true);
    const [isChatClosed, setIsChatClosed] = useState(false);

    useEffect(() => {
        const handleChatClosed = () => setIsChatClosed(true);
        window.addEventListener('chatWidgetClosed', handleChatClosed);
        
        const chatDismissedAt = localStorage.getItem('chat_dismissed_at');
        if (chatDismissedAt) {
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - new Date(chatDismissedAt).getTime() < thirtyDays) {
                setIsChatClosed(true);
            }
        }
        
        return () => window.removeEventListener('chatWidgetClosed', handleChatClosed);
    }, []);

    useEffect(() => {
        const checkDismissal = async () => {
            const DISMISSAL_KEY = 'whatsapp_dismissed_at';
            let dismissedAt = localStorage.getItem(DISMISSAL_KEY);
            
            if (isLoaded && user) {
                try {
                    const res = await fetch('/api/user/preferences');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.preferences?.whatsapp_dismissed_at) {
                            dismissedAt = data.preferences.whatsapp_dismissed_at;
                            localStorage.setItem(DISMISSAL_KEY, dismissedAt);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch preferences", e);
                }
            }

            if (dismissedAt) {
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                if (Date.now() - new Date(dismissedAt).getTime() < thirtyDays) {
                    setIsVisible(false);
                }
            }
        };

        checkDismissal();
    }, [isLoaded, user]);

    const handleDismiss = async (e) => {
        e.stopPropagation();
        setIsVisible(false);
        const now = new Date().toISOString();
        localStorage.setItem('whatsapp_dismissed_at', now);
        
        if (isLoaded && user) {
            try {
                await fetch('/api/user/preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        preferences: { whatsapp_dismissed_at: now }
                    })
                });
            } catch (error) {
                console.error("Failed to save preference", error);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed z-50 ${isChatClosed ? 'bottom-6' : 'bottom-[88px]'} ${dir === 'rtl' ? 'right-6' : 'left-6'} transition-all duration-300 group`}>
            <a 
                href="https://wa.me/972502266071" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 text-white rounded-full w-14 h-14 shadow-lg hover:bg-green-600 hover:scale-110 flex items-center justify-center transition-all duration-300"
                aria-label="Contact us on WhatsApp"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16" className="w-7 h-7">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
            </a>
            <button 
                onClick={handleDismiss}
                className="absolute -top-2 -left-2 z-10 bg-gray-200 text-gray-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-500 hover:text-white"
                title="סגור"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
