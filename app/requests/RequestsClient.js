"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function RequestsClient() {
    const { t, dir } = useLanguage();
    const { user, isLoaded } = useUser();
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests');
            const data = await res.json();
            if (data.requests) {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!brand || !model) return;

        setLoading(true);

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand, model })
            });

            if (res.status === 409) {
                toast.error(t('requests.duplicate_error'));
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error('Failed');

            await fetchRequests();
            await new Promise(r => setTimeout(r, 1500));
            setSubmitted(true);
        } catch (err) {
            toast.error(t('requests.general_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-zinc-900 relative flex flex-col items-center justify-start pt-4 md:pt-6 pb-12 px-4 overflow-hidden" dir={dir}>
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.05)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Secondary Decorator */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-200/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-200/50 rounded-full blur-[120px] pointer-events-none" />

            {!submitted ? (
                <div className="container max-w-md mx-auto relative z-10 px-4">
                    <div className="mb-10 text-center overflow-visible">
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-zinc-900 tracking-tight animate-fadeIn">
                             {t('requests.title') || 'בקשת בשמים'}
                        </h1>
                        <div className="flex justify-center overflow-visible">
                            <p className="text-zinc-400 text-xs md:text-sm animate-fadeIn delay-100 italic tracking-wide whitespace-normal opacity-70 border-x border-zinc-200 px-6 leading-relaxed">
                                {t('requests.header')} <br />
                                {t('requests.subheader')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-zinc-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden group">
                        {/* Subtle Internal Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50/50 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 animate-fadeIn text-center">
                                <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-6"></div>
                                <p className="text-xl font-bold animate-pulse tracking-widest text-zinc-900">{t('requests.sending')}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1 blur-[0.3px]">
                                        {t('requests.brand_label')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={brand}
                                        onChange={(e) => /^[a-zA-Z0-9\s\-]*$/.test(e.target.value) && setBrand(e.target.value)}
                                        className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-300 shadow-sm text-zinc-900"
                                        placeholder={t('requests.brand_placeholder')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1 blur-[0.3px]">
                                        {t('requests.model_label')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={model}
                                        onChange={(e) => /^[a-zA-Z0-9\s\-]*$/.test(e.target.value) && setModel(e.target.value)}
                                        className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-300 shadow-sm text-zinc-900"
                                        placeholder={t('requests.model_placeholder')}
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-zinc-900 text-white font-black rounded-full hover:bg-zinc-800 transition-all active:scale-[0.98] text-xs uppercase tracking-[0.25em] shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                                    >
                                        {t('requests.submit_btn')}
                                    </button>
                                </div>
                                <p className="text-[9px] text-center text-zinc-400 font-bold uppercase tracking-widest mt-4">
                                    {t('requests.management_note')}
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-6xl relative z-10 animate-fadeIn px-4">
                    <div className="text-center mb-16 overflow-visible">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-zinc-900 tracking-tight">
                            {t('requests.success_title')}
                        </h2>
                        <div className="flex justify-center overflow-visible">
                            <p className="text-zinc-500 italic border-x border-zinc-100 px-6 opacity-80">
                                {t('requests.success_subtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.length === 0 && <p className="text-center col-span-full opacity-40">{t('requests.no_requests')}</p>}

                        {requests.map((req, idx) => (
                            <div
                                key={idx}
                                className="bg-white p-6 rounded-3xl border border-zinc-200 flex items-center justify-between group hover:border-zinc-300 transition-all duration-500 transform hover:-translate-y-2 shadow-sm"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div>
                                    <div className="text-[10px] text-zinc-400 tracking-[0.2em] uppercase font-bold mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {req.brand}
                                    </div>
                                    <div className="text-xl font-bold text-zinc-900">{req.model}</div>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-2xl p-4 min-w-[70px] border border-zinc-100 group-hover:bg-zinc-100 transition-colors">
                                    <span className="text-2xl font-black text-zinc-900">{req.count}</span>
                                    <span className="text-[8px] uppercase text-zinc-400 font-bold tracking-tighter">{t('requests.votes')}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                        <button 
                            onClick={() => setSubmitted(false)} 
                            className="text-zinc-400 text-sm font-bold tracking-widest hover:text-zinc-900 transition-colors uppercase border-b border-zinc-200 pb-1"
                        >
                            {t('requests.send_another')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
