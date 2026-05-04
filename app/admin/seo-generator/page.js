"use client";

import { useState, useEffect } from "react";
import { Edit3, Wand2, CheckCircle, Clock, ExternalLink, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SEOGeneratorPage() {
    const [topic, setTopic] = useState("");
    const [keywords, setKeywords] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const [drafts, setDrafts] = useState([]);
    const [published, setPublished] = useState([]);
    const [isLoadingLists, setIsLoadingLists] = useState(true);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/admin/seo-list');
            if (res.ok) {
                const data = await res.json();
                setDrafts(data.drafts || []);
                setPublished(data.published || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingLists(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        
        if (!topic.trim()) {
            toast.error("נא להזין נושא או שם מותג");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/seo-generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ topic, keywords }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "שגיאה ביצירת התוכן");
            }

            toast.success("טיוטה נוצרה בהצלחה וממתינה לאישורך!");
            setTopic("");
            setKeywords("");
            fetchPosts(); // Refresh lists
        } catch (error) {
            console.error("SEO Generation Error:", error);
            toast.error(error.message || "שגיאה ביצירת התוכן");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch("/api/admin/seo-approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error();
            toast.success("המאמר אושר ופורסם באתר!");
            fetchPosts();
        } catch (err) {
            toast.error("שגיאה באישור המאמר");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק טיוטה זו?")) return;
        try {
            const res = await fetch("/api/admin/seo-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error();
            toast.success("הטיוטה נמחקה בהצלחה");
            fetchPosts();
        } catch (err) {
            toast.error("שגיאה במחיקת הטיוטה");
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4" dir="rtl">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <Edit3 className="w-8 h-8 text-blue-600" />
                    בוט תוכן (SEO)
                </h1>
                <p className="text-gray-500 mt-2">
                    מערכת אוטומטית ליצירת מאמרים מותאמי SEO לקידום האתר בעזרת מנוע Gemini.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Right Column: Generation Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <h2 className="text-lg font-bold mb-4">יצירת מאמר ידנית</h2>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    נושא המאמר או שם המותג <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="לדוגמה: בשמי נישה לקיץ 2026"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all text-right text-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    מילות מפתח (אופציונלי)
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="מופרדות בפסיק"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all text-right text-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !topic.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <span>מייצר טיוטה...</span>
                                        <Wand2 className="w-5 h-5 animate-pulse" />
                                    </>
                                ) : (
                                    <>
                                        <span>צור מאמר</span>
                                        <Wand2 className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Left Column: Lists */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* Drafts Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-900">מאמרים הממתינים לאישור (טיוטות)</h2>
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">{drafts.length}</span>
                        </div>
                        
                        {isLoadingLists ? (
                            <div className="h-32 flex items-center justify-center bg-white rounded-2xl border border-gray-100"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : drafts.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-400 font-medium">
                                אין מאמרים הממתינים לאישור. הבוט ייצר טיוטה חדשה בכל יום ב-08:00 בבוקר.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {drafts.map(draft => (
                                    <div key={draft.id} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-1">{draft.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{draft.excerpt}</p>
                                            <p className="text-xs text-gray-400 mt-2">נוצר ב: {new Date(draft.created_at).toLocaleDateString('he-IL')}</p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                                            <button 
                                                onClick={() => handleDelete(draft.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="מחק טיוטה"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(draft.id)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                אשר ופרסם באתר
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Published Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-xl font-bold text-gray-900">מאמרים שפורסמו לאחרונה</h2>
                        </div>
                        
                        {isLoadingLists ? null : published.length === 0 ? (
                            <div className="text-gray-400 text-sm">אין מאמרים באוויר.</div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <ul className="divide-y divide-gray-100">
                                    {published.map(post => (
                                        <li key={post.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">{post.title}</h4>
                                                <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('he-IL')}</span>
                                            </div>
                                            <Link 
                                                href={`/blog/${post.slug}`} 
                                                target="_blank"
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold"
                                            >
                                                צפה
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
