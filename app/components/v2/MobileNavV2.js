"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
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
                        <div className="grid grid-cols-3 items-center p-6 border-b border-white/10">
                            <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">תפריט</span>
                            <div className="flex justify-center">
                                <LanguageSwitcher variant="mobile" light={true} />
                            </div>
                            <div className="flex justify-end">
                                <button onClick={onClose} className="p-2 -me-2 text-white/70 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* User + My Catalogs */}
                        <div className="flex justify-center items-center gap-4 py-5 px-6">
                            <SignedIn>
                                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-12 h-12" } }} />
                                <Link href="/my-catalogs" onClick={onClose} className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-yellow-300 transition-colors">
                                    {t('common.my_catalogs_mobile')}
                                </Link>
                            </SignedIn>
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="bg-yellow-400 text-black px-6 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-yellow-300 transition-colors">
                                        {t('common.login_register')}
                                    </button>
                                </SignInButton>
                            </SignedOut>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-4 px-6 space-y-6">
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

                            {/* Prominent Admin Link inside list if role is detected */}
                            {isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="pt-4"
                                >
                                    <Link 
                                        href="/admin" 
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-3 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-all border border-yellow-400/20 py-4 rounded-xl text-sm font-black tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(250,204,21,0.05)]"
                                    >
                                        <Settings size={20} />
                                        <span>{t('common.admin_management')}</span>
                                    </Link>
                                </motion.div>
                            )}
                        </div>

                        {/* Bottom Actions Fallback */}
                        <div className="p-6 space-y-4 bg-black/20 border-t border-white/5 mt-auto">
                            {isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Link 
                                        href="/admin" 
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-3 bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 py-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                    >
                                        <Settings size={20} className="text-white" />
                                        <span>{t('common.admin_management')}</span>
                                    </Link>
                                </motion.div>
                            )}

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
