"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, User, ShoppingBag, Heart, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../header/LanguageSwitcher';

export default function MobileNavV2({ isOpen, onClose, navLinks = [], isAdmin }) {
    const { t, dir } = useLanguage();

    const sidebarVariants = {
        closed: { x: dir === 'rtl' ? '100%' : '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
        open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    const overlayVariants = {
        closed: { opacity: 0 },
        open: { opacity: 1 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={overlayVariants}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        className={`fixed top-0 bottom-0 w-[80%] max-w-[320px] glass-dark z-[70] flex flex-col shadow-2xl ${dir === 'rtl' ? 'right-0' : 'left-0'}`}
                        style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(40px)', borderLeft: dir === 'rtl' ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRight: dir === 'ltr' ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
                    >
                        {/* Header Area */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <span className="text-white text-xs font-bold tracking-[0.2em] uppercase">תפריט</span>
                            <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-8 px-6 space-y-6">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                >
                                    <Link 
                                        href={link.href} 
                                        onClick={onClose}
                                        className="flex items-center justify-between group"
                                    >
                                        <span className={`text-lg font-bold tracking-wide transition-all ${link.active ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                            {link.label}
                                        </span>
                                        {dir === 'rtl' ? <ChevronLeft size={18} className="text-white/20" /> : <ChevronRight size={18} className="text-white/20" />}
                                    </Link>
                                </motion.div>
                            ))}

                            {isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="pt-6 border-t border-white/5"
                                >
                                    <Link 
                                        href="/admin" 
                                        onClick={onClose}
                                        className="flex items-center gap-3 text-white/40 hover:text-white transition-colors text-sm font-bold tracking-widest uppercase"
                                    >
                                        <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                            <User size={16} />
                                        </span>
                                        ממשק ניהול
                                    </Link>
                                </motion.div>
                            )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="p-8 space-y-8 bg-black/20 border-t border-white/5">
                            <div className="flex justify-center">
                                <LanguageSwitcher variant="mobile" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/wishlist" onClick={onClose} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
                                    <Heart size={20} />
                                    <span className="text-[10px] uppercase tracking-widest font-bold">מועדפים</span>
                                </Link>
                                <Link href="/cart" onClick={onClose} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
                                    <ShoppingBag size={20} />
                                    <span className="text-[10px] uppercase tracking-widest font-bold">עגלה</span>
                                </Link>
                            </div>

                            <p className="text-[9px] text-white/20 text-center uppercase tracking-[0.3em] font-light">
                                ml-tlv. luxury sample boutique
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
