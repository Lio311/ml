"use client";

// Logic for daily Instagram popup
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useBrand } from '../context/BrandContext';

export default function InstagramPopup() {
    const { t, dir } = useLanguage();
    const brand = useBrand();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkPopup = () => {
            const lastSeen = localStorage.getItem('last_instagram_popup_seen');
            const today = new Date().toISOString().split('T')[0];

            if (lastSeen !== today) {
                // Delay showing to not overwhelm immediately on load
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        };

        checkPopup();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('last_instagram_popup_seen', today);
    };

    const handleInstagramClick = () => {
        window.open(`https://instagram.com/${brand.instagram}`, '_blank');
        handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20"
                    >
                        {/* Premium Header/Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] opacity-10" />
                        
                        <div className="relative p-8 flex flex-col items-center text-center">
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>

                            {/* Instagram-like Icon Circle */}
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] p-1 mb-6 shadow-lg">
                                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                                    <Instagram className="w-10 h-10 text-[#dc2743]" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-tr from-[#dc2743] to-[#bc1888] bg-clip-text text-transparent">
                                {t('common.instagram_popup_title') || "Let's talk on Instagram!"}
                            </h2>
                            
                            <p className="text-gray-600 dark:text-zinc-400 mb-8 text-lg leading-relaxed">
                                {t('common.instagram_popup_desc') || `Need advice or a quick answer? We are available for you at ${brand.instagram} for any question, all week long.`}
                            </p>

                            <button
                                onClick={handleInstagramClick}
                                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
                                <span>{t('common.instagram_popup_btn') || "Go to personal advice"}</span>
                            </button>

                            <button
                                onClick={handleClose}
                                className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                {t('common.close_menu')}
                            </button>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
