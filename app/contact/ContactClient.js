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
        <div className="min-h-screen bg-gray-50 py-20" dir={dir}>
            <div className="container max-w-2xl mx-auto">
                <h1 className="text-4xl font-serif font-bold mb-8 text-center">{t('common.contact_title')}</h1>

                <p className={`text-center text-gray-600 mb-12 ${dir === 'rtl' ? 'text-right' : 'text-left'} text-center`}>
                    {t('common.contact_subtitle')}
                </p>

                <div className="bg-white p-8 rounded-xl border shadow-sm">
                    {status === 'success' ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold mb-2">{t('common.contact_success_title')}</h3>
                            <p className="text-gray-500">{t('common.contact_success_desc')}</p>
                            <button
                                onClick={() => setStatus(null)}
                                className="mt-6 text-blue-600 underline text-sm"
                            >
                                {t('common.contact_send_another')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className={`block text-sm font-bold mb-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_name_label')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder={t('common.contact_name_placeholder')}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className={`block text-sm font-bold mb-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_email_label')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className={`block text-sm font-bold mb-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {t('common.contact_message_label')}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="5"
                                    required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder={t('common.contact_message_placeholder')}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn btn-primary w-full py-4 text-lg"
                            >
                                {status === 'loading' ? t('common.contact_sending') : t('common.contact_send')}
                            </button>

                            {status === 'error' && (
                                <div className="text-red-500 text-sm text-center">
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
