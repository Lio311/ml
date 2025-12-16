"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function RequestsClient() {
    const { user, isLoaded } = useUser();
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [requests, setRequests] = useState([]);

    // Fetch requests logic
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

    useEffect(() => {
        // Fetch initially just to populate if needed, or maybe only after submit? 
        // User said "After click... logic... display of all perfumes". 
        // I'll fetch on mount too, but maybe hide them until submit? 
        // "Loading screen... intro paragraph... text boxes will DISAPPEAR and be replaced by display".
        // This implies the display is NOT there initially.
        // So I will fetch them when "loading" starts.
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!brand || !model) return;

        setLoading(true);

        try {
            // Submit
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand, model })
            });

            if (res.status === 409) {
                alert('לא ניתן לבקש את אותו מוצר פעמיים');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed');
            }

            // Fetch updated list
            await fetchRequests();

            // Fake delay for "Loading Screen" effect if fetch is too fast
            await new Promise(r => setTimeout(r, 1500));

            setSubmitted(true);
        } catch (err) {
            alert('שגיאה בשליחה, נסה שוב');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">

            {/* Logic: If NOT submitted, show Form. If Submitted, show Wall. */}

            {!submitted ? (
                <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-xl transition-all duration-500 transform hover:scale-[1.01]">


                    <p className="text-center text-gray-600 mb-8 text-lg leading-relaxed">
                        לא מצאתם את הבושם שחיפשתם? <br />
                        כאן זה המקום שלכם להשפיע! <br />
                        <span className="font-bold text-black">הנהלת האתר תשקול ותביא את הבשמים המבוקשים ביותר.</span>
                    </p>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-xl font-bold animate-pulse">שולח את הבקשה שלך...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">שם המותג (Brand)</label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^[a-zA-Z0-9\s\-]*$/.test(val)) {
                                            setBrand(val);
                                        }
                                    }}
                                    className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition text-lg"
                                    placeholder="לדוגמה: Xerjoff"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">שם הדגם (Model)</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^[a-zA-Z0-9\s\-]*$/.test(val)) {
                                            setModel(val);
                                        }
                                    }}
                                    className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition text-lg"
                                    placeholder="לדוגמה: Naxos"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 text-xl font-bold text-white bg-black rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 mt-4"
                            >
                                שלח בקשה
                            </button>
                        </form>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-6xl animate-fade-in-up">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">הבקשה שלך התקבלה!</h2>
                        <p className="text-xl text-gray-600">הנה מה שאחרים ביקשו... האם הטעם שלכם דומה?</p>
                    </div>

                    {/* Animated Grid of Requests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.length === 0 && <p className="text-center col-span-full">עדיין אין בקשות... היה הראשון!</p>}

                        {requests.map((req, idx) => (
                            <div
                                key={idx}
                                className="bg-white p-6 rounded-xl shadow-md border hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 flex items-center justify-between"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div>
                                    <div className="text-sm text-gray-500 tracking-widest uppercase">{req.brand}</div>
                                    <div className="text-xl font-bold">{req.model}</div>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-3 min-w-[60px]">
                                    <span className="text-2xl font-bold">{req.count}</span>
                                    <span className="text-[10px] uppercase text-gray-500">Votes</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button onClick={() => setSubmitted(false)} className="text-gray-500 underline hover:text-black">
                            שלח בקשה נוספת
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
