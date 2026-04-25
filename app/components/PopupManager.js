"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Tag, Bell, Megaphone, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ICON_MAP = {
    instagram: Instagram,
    tag: Tag,
    bell: Bell,
    megaphone: Megaphone,
    message: MessageCircle,
};

function shouldShow(popup) {
    const key = `popup_seen_${popup.id}`;
    const stored = localStorage.getItem(key);
    if (!stored) return true;

    const now = new Date();
    const seen = new Date(stored);

    switch (popup.frequency) {
        case 'once': return false;
        case 'always': return true;
        case 'weekly': {
            const diff = (now - seen) / (1000 * 60 * 60 * 24);
            return diff >= 7;
        }
        case 'daily':
        default: {
            return now.toISOString().split('T')[0] !== seen.toISOString().split('T')[0];
        }
    }
}

function markSeen(popup) {
    localStorage.setItem(`popup_seen_${popup.id}`, new Date().toISOString());
}

function buildGradientCSS(colors) {
    if (colors?.gradient?.length >= 2) {
        return `linear-gradient(135deg, ${colors.gradient.join(', ')})`;
    }
    return colors?.primary || '#8b5cf6';
}

export default function PopupManager() {
    const { t } = useLanguage();
    const [popups, setPopups] = useState([]);
    const [currentPopup, setCurrentPopup] = useState(null);

    useEffect(() => {
        const fetchAndShow = async () => {
            try {
                const res = await fetch('/api/popups');
                const data = await res.json();
                const enabled = data.popups || [];
                // Find first popup that should be shown
                const toShow = enabled.find(p => shouldShow(p));
                if (toShow) {
                    setTimeout(() => setCurrentPopup(toShow), toShow.delay || 3000);
                }
            } catch (err) {
                console.warn('PopupManager fetch error', err);
            }
        };
        fetchAndShow();
    }, []);

    const handleClose = () => {
        if (currentPopup) markSeen(currentPopup);
        setCurrentPopup(null);
    };

    const handleCTA = () => {
        if (currentPopup?.content?.buttonUrl) {
            window.open(currentPopup.content.buttonUrl, '_blank');
        }
        handleClose();
    };

    if (!currentPopup) return null;

    const popup = currentPopup;
    const IconComp = ICON_MAP[popup.content?.icon] || MessageCircle;
    const grad = buildGradientCSS(popup.colors);
    const primaryColor = popup.colors?.primary || '#8b5cf6';
    const textColor = popup.colors?.text || '#ffffff';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20"
                >
                    {/* Header gradient */}
                    <div className="absolute top-0 left-0 right-0 h-32 opacity-10" style={{ background: grad }} />

                    <div className="relative p-8 flex flex-col items-center text-center">
                        {/* Close */}
                        <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        {/* Icon / Image circle */}
                        <div className="w-20 h-20 rounded-full p-1 mb-6 shadow-lg" style={{ background: grad }}>
                            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                {popup.content?.imageUrl ? (
                                    <img src={popup.content.imageUrl} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <IconComp className="w-10 h-10" style={{ color: primaryColor }} />
                                )}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent" style={{ backgroundImage: grad, WebkitBackgroundClip: 'text' }}>
                            {popup.content?.title}
                        </h2>

                        <p className="text-gray-600 dark:text-zinc-400 mb-8 text-lg leading-relaxed">
                            {popup.content?.description}
                        </p>

                        {popup.content?.buttonText && (
                            <button
                                onClick={handleCTA}
                                className="w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                style={{ background: grad, color: textColor }}
                            >
                                <IconComp className="w-6 h-6 group-hover:animate-pulse" />
                                <span>{popup.content.buttonText}</span>
                            </button>
                        )}

                        <button onClick={handleClose} className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors">
                            סגור
                        </button>
                    </div>

                    {/* Bottom decoration */}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: grad }} />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
