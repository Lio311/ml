"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function ContactClient() {
    const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
    const { t, dir } = useLanguage();

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('loading');

        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            message: e.target.message.value,
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus('success');
                e.target.reset();
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    }

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center py-24 px-6 overflow-hidden" dir={dir}>
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Secondary Decorator */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-xl mx-auto relative z-10 px-4">
                <div className="pt-8 pb-8 text-center overflow-visible">
                    <h1 className="text-4xl md:text-6xl font-serif font-black mb-4 text-white tracking-tighter animate-fadeIn">
                        {t('common.contact_title')}
                    </h1>
                    <div className="flex justify-center overflow-visible">
                        <p className="text-zinc-400 text-xs md:text-sm animate-fadeIn delay-100 italic tracking-widest whitespace-nowrap opacity-70 border-x border-white/5 px-6">
                            {t('common.contact_subtitle')}
                        </p>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:scale-110 transition-transform duration-700" />

                    {status === 'success' ? (
                        <div className="text-center py-10 animate-fadeIn">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-2xl font-serif font-black mb-2 text-white">
                                {t('common.contact_success_title')}
                            </h3>
                            <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                                {t('common.contact_success_desc')}
                            </p>
                            <button
                                onClick={() => setStatus(null)}
                                className="px-8 py-3 bg-white text-black rounded-full font-bold text-sm tracking-widest hover:bg-gray-200 transition shadow-lg"
                            >
                                {t('common.contact_send_another')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            <div>
                                <label htmlFor="name" className={`block text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2 px-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_name_label')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-base"
                                    placeholder={t('common.contact_name_placeholder')}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className={`block text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2 px-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_email_label')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-base"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className={`block text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2 px-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_message_label')}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="4"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-base resize-none"
                                    placeholder={t('common.contact_message_placeholder')}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-4 mt-2 bg-white text-black rounded-full font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-200 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                            >
                                {status === 'loading' ? t('common.contact_sending') : t('common.contact_send')}
                            </button>

                            {status === 'error' && (
                                <div className="text-red-400 text-xs text-center font-medium animate-pulse">
                                    {t('common.contact_error')}
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
