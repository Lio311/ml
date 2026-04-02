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
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center py-4 px-4 overflow-hidden" dir={dir}>
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Secondary Decorator */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-lg mx-auto relative z-10 px-4">
                <div className="pt-2 pb-2 text-center overflow-visible">
                    <h1 className="text-3xl md:text-4xl font-serif font-black mb-1 text-white tracking-tighter animate-fadeIn">
                        {t('common.contact_title')}
                    </h1>
                    <div className="flex justify-center overflow-visible">
                        <p className="text-zinc-500 text-[9px] md:text-[10px] animate-fadeIn delay-100 italic tracking-[0.1em] whitespace-nowrap opacity-60 border-x border-white/5 px-4 mb-2">
                            {t('common.contact_subtitle')}
                        </p>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-3xl p-4 md:p-6 rounded-[1.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10 blur-2xl group-hover:scale-110 transition-transform duration-700" />

                    {status === 'success' ? (
                        <div className="text-center py-6 animate-fadeIn">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
                                <span className="text-2xl">✅</span>
                            </div>
                            <h3 className="text-xl font-serif font-black mb-2 text-white">
                                {t('common.contact_success_title')}
                            </h3>
                            <p className="text-zinc-500 text-xs mb-4 max-w-xs mx-auto">
                                {t('common.contact_success_desc')}
                            </p>
                            <button
                                onClick={() => setStatus(null)}
                                className="px-6 py-2 bg-white text-black rounded-full font-bold text-xs tracking-widest hover:bg-gray-200 transition shadow-lg"
                            >
                                {t('common.contact_send_another')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-2">
                            {/* Name Field */}
                            <div className="space-y-0.5">
                                <label className="block text-[8px] font-medium text-gray-500 uppercase tracking-widest px-1">
                                    {t('common.contact_name_label')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-600"
                                    placeholder={t('common.contact_name_placeholder')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-0.5">
                                <label className="block text-[8px] font-medium text-gray-500 uppercase tracking-widest px-1">
                                    {t('common.contact_email_label')}
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-600"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-0.5">
                                <label className="block text-[8px] font-medium text-gray-500 uppercase tracking-widest px-1">
                                    {t('common.contact_phone_label')}
                                </label>
                                <input
                                    type="tel"
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-600 text-left"
                                    placeholder="05X-XXXXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            {/* Message Field */}
                            <div className="space-y-0.5">
                                <label className="block text-[8px] font-medium text-gray-500 uppercase tracking-widest px-1">
                                    {t('common.contact_message_label')}
                                </label>
                                <textarea
                                    required
                                    rows="2"
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-600 resize-none"
                                    placeholder={t('common.contact_message_placeholder')}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm uppercase tracking-wider"
                            >
                                {status === 'loading' ? t('common.contact_sending') : t('common.contact_send')}
                            </button>

                            {status === 'error' && (
                                <div className="text-red-400 text-[10px] text-center font-medium animate-pulse">
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
