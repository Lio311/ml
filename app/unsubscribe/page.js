"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBrand } from '../context/BrandContext';

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get('email') || '';
    
    const [email, setEmail] = useState(initialEmail);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const brand = useBrand();

    const handleUnsubscribe = async (e) => {
        if (e) e.preventDefault();
        
        if (!email || !email.includes('@')) {
            setErrorMessage('אנא הזן כתובת אימייל חוקית');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setStatus('success');
            } else {
                const data = await res.json();
                setErrorMessage(data.error || 'אירעה שגיאה. אנא נסה שנית.');
                setStatus('error');
            }
        } catch (err) {
            setErrorMessage('אירעה שגיאה. אנא נסה שנית.');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans" dir="rtl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md w-full border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-black tracking-tight mb-2 uppercase">{brand.name}</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-wide">יוקרה בחתיכות קטנות</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">הוסרת בהצלחה</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                            כתובת האימייל <strong className="text-gray-800">{email}</strong> הוסרה מרשימת הדיוור שלנו. לא נשלח אליך יותר המלצות, מבצעים או עדכונים על בשמים חדשים.
                        </p>
                        <Link href="/" className="inline-block bg-black text-white px-8 py-3.5 rounded-xl text-sm font-bold tracking-wide hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                            חזרה לאתר
                        </Link>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">הסרה מרשימת דיוור</h2>
                            <p className="text-sm text-gray-500">נשמח להמשיך להפתיע אותך עם ניחוחות חדשים, אבל אנחנו מבינים אם תרצה להפסיק.</p>
                        </div>

                        <form onSubmit={handleUnsubscribe} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">כתובת אימייל</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (status === 'error') setStatus('idle');
                                    }}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-left"
                                    dir="ltr"
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errorMessage}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={status === 'loading'}
                                className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-bold tracking-wide hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        מעבד...
                                    </>
                                ) : (
                                    'הסר אותי מהרשימה'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full"></div></div>}>
            <UnsubscribeContent />
        </Suspense>
    );
}
