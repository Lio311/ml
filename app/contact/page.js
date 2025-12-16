"use client";

import { useState } from "react";

export const metadata = {
    title: "צור קשר | ml_tlv",
    description: "דברו איתנו - שירות לקוחות, שאלות נפוצות ופניות עסקיות.",
};

export default function ContactPage() {
    const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'

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
        <div className="min-h-screen bg-gray-50 py-20">
            <div className="container max-w-2xl mx-auto">
                <h1 className="text-4xl font-serif font-bold mb-8 text-center">צור קשר</h1>

                <p className="text-center text-gray-600 mb-12">
                    יש לך שאלה? בקשה מיוחדת? מלא את הטופס ונחזור אליך בהקדם.
                </p>

                <div className="bg-white p-8 rounded-xl border shadow-sm">
                    {status === 'success' ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold mb-2">הודעתך נשלחה בהצלחה!</h3>
                            <p className="text-gray-500">נחזור אליך למייל בהקדם האפשרי.</p>
                            <button
                                onClick={() => setStatus(null)}
                                className="mt-6 text-blue-600 underline text-sm"
                            >
                                שלח הודעה נוספת
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-bold mb-2">שם מלא</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder="ישראל ישראלי"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-bold mb-2">אימייל לחזרה</label>
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
                                <label htmlFor="message" className="block text-sm font-bold mb-2">תוכן ההודעה</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="5"
                                    required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder="בוקר טוב, רציתי לשאול..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn btn-primary w-full py-4 text-lg"
                            >
                                {status === 'loading' ? 'שולח...' : 'שלח הודעה'}
                            </button>

                            {status === 'error' && (
                                <div className="text-red-500 text-sm text-center">
                                    אירעה שגיאה בשליחת ההודעה. אנא נסה שנית או פנה אלינו באינסטגרם.
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
