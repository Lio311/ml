"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function ContactModal({ isOpen, onClose }) {
    const { t, dir } = useLanguage();
    const [status, setStatus] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir={dir}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 sm:p-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold mb-2 text-zinc-900 tracking-tight">
                            {t('common.contact_title')}
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm">
                            {t('common.contact_subtitle')}
                        </p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-zinc-900">
                                {t('common.contact_success_title')}
                            </h3>
                            <p className="text-zinc-500 text-sm mb-8">
                                {t('common.contact_success_desc')}
                            </p>
                            <button
                                onClick={() => {
                                    setStatus(null);
                                    onClose();
                                }}
                                className="px-8 py-3 bg-zinc-900 text-white rounded-full font-bold text-sm tracking-widest hover:bg-zinc-800 transition shadow-lg"
                            >
                                סגור
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">
                                    {t('common.contact_name_label')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400"
                                    placeholder={t('common.contact_name_placeholder')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">
                                    {t('common.contact_phone_label')}
                                </label>
                                <input
                                    type="tel"
                                    className={`w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                                    placeholder={t('common.contact_phone_placeholder')}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">
                                    {t('common.contact_message_label')}
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 resize-none"
                                    placeholder={t('common.contact_message_placeholder')}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98] text-sm uppercase tracking-[0.1em] disabled:opacity-70 shadow-lg"
                                >
                                    {status === 'loading' ? 'שולח...' : t('common.contact_send')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
