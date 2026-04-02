"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function ContactClient() {
    const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const { t, dir } = useLanguage();

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    }

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-start pt-4 md:pt-6 pb-12 px-4 overflow-hidden" dir={dir}>
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Secondary Decorator */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-md mx-auto relative z-10 px-4">
                <div className="mb-10 text-center overflow-visible">
                    <h1 className="text-4xl md:text-5xl font-serif font-black mb-3 text-white tracking-tighter animate-fadeIn">
                        {t('common.contact_title')}
                    </h1>
                    <div className="flex justify-center overflow-visible">
                        <p className="text-zinc-500 text-xs md:text-sm animate-fadeIn delay-100 italic tracking-wide whitespace-normal opacity-60 border-x border-white/5 px-6 leading-relaxed">
                            {t('common.contact_subtitle')}
                        </p>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:scale-110 transition-transform duration-700" />

                    {status === 'success' ? (
                        <div className="text-center py-10 animate-fadeIn">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-2xl font-serif font-black mb-3 text-white">
                                {t('common.contact_success_title')}
                            </h3>
                            <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                                {t('common.contact_success_desc')}
                            </p>
                            <button
                                onClick={() => setStatus(null)}
                                className="px-10 py-3 bg-white text-black rounded-full font-bold text-sm tracking-widest hover:bg-gray-200 transition shadow-lg"
                            >
                                {t('common.contact_send_another')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1 blur-[0.3px]">
                                    {t('common.contact_name_label')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-700 shadow-inner"
                                    placeholder={t('common.contact_name_placeholder')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1 blur-[0.3px]">
                                    {t('common.contact_email_label')}
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-700 shadow-inner"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1 blur-[0.3px]">
                                    {t('common.contact_phone_label')}
                                </label>
                                <input
                                    type="tel"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-700 shadow-inner text-right"
                                    placeholder={t('common.contact_phone_placeholder')}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            {/* Message Field */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1 blur-[0.3px]">
                                    {t('common.contact_message_label')}
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-700 shadow-inner resize-none"
                                    placeholder={t('common.contact_message_placeholder')}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-4 bg-white text-black font-black rounded-full hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-[0.25em] shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                                >
                                    {status === 'loading' ? t('common.contact_sending') : t('common.contact_send')}
                                </button>
                            </div>

                            {status === 'error' && (
                                <div className="text-red-400 text-xs text-center font-medium animate-pulse mt-4">
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
