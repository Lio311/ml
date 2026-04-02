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

            <div className="container max-w-2xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-serif font-black mb-6 tracking-tight text-white">
                        {t('common.contact_title')}
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-md mx-auto font-light leading-relaxed">
                        {t('common.contact_subtitle')}
                    </p>
                </div>

                <div className="bg-[#111111]/60 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />

                    {status === 'success' ? (
                        <div className="text-center py-16 animate-fadeIn">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl">
                                <span className="text-4xl">✅</span>
                            </div>
                            <h3 className="text-3xl font-serif font-black mb-4 text-white">
                                {t('common.contact_success_title')}
                            </h3>
                            <p className="text-zinc-400 text-lg mb-8 max-w-sm mx-auto">
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
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div>
                                <label htmlFor="name" className={`block text-xs uppercase tracking-widest font-bold text-zinc-500 mb-3 px-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_name_label')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition-all text-lg"
                                    placeholder={t('common.contact_name_placeholder')}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className={`block text-xs uppercase tracking-widest font-bold text-zinc-500 mb-3 px-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_email_label')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition-all text-lg"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className={`block text-xs uppercase tracking-widest font-bold text-zinc-500 mb-3 px-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_message_label')}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="5"
                                    required
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition-all text-lg resize-none"
                                    placeholder={t('common.contact_message_placeholder')}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-5 bg-white text-black rounded-full font-black text-base tracking-[0.2em] uppercase hover:bg-gray-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-50"
                            >
                                {status === 'loading' ? t('common.contact_sending') : t('common.contact_send')}
                            </button>

                            {status === 'error' && (
                                <div className="text-red-400 text-sm text-center font-medium animate-pulse">
                                    {t('common.contact_error')}
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Bottom decorative spacer */}
                <div className="mt-20 text-center">
                    <p className="text-zinc-600 text-sm tracking-widest uppercase font-bold">
                        ml_tlv premium experience
                    </p>
                </div>
            </div>
        </div>
    );
}
