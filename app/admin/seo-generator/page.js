"use client";

import { useState } from "react";
import { Edit3, Wand2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SEOGeneratorPage() {
    const [topic, setTopic] = useState("");
    const [keywords, setKeywords] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        
        if (!topic.trim()) {
            toast.error("נא להזין נושא או שם מותג");
            return;
        }

        setIsLoading(true);
        setResult(null);

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

            setResult(data);
            toast.success("המאמר נוצר ופורסם בהצלחה!");
            setTopic("");
            setKeywords("");
        } catch (error) {
            console.error("SEO Generation Error:", error);
            toast.error(error.message || "שגיאה ביצירת התוכן");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <Edit3 className="w-8 h-8 text-blue-600" />
                    בוט תוכן (SEO)
                </h1>
                <p className="text-gray-500 mt-2">
                    הזן נושא, והבינה המלאכותית (Gemini) תייצר מאמר מקצועי לבלוג באנגלית ובעברית, הכולל תגיות ותקצירים, ותפרסם אותו ישירות באתר.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            נושא המאמר או שם המותג <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="לדוגמה: בשמי נישה מומלצים לקיץ 2026, או שם של מותג כמו Tom Ford"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-right"
                            dir="rtl"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            מילות מפתח למחקר (אופציונלי)
                        </label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="לדוגמה: בושם עמיד, דיקאנטים, המלצות, וניל"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-right"
                            dir="rtl"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-400 mt-1">מילים שתרצה שהבוט ישלב בתוך המאמר לטובת קידום אורגני (מופרדות בפסיק).</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !topic.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Wand2 className="w-5 h-5 animate-pulse" />
                                <span>מייצר תוכן... (זה עשוי לקחת 1-2 דקות)</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                <span>צור ופרסם מאמר</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {result && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shrink-0">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-emerald-900 mb-2">המאמר פורסם בהצלחה!</h3>
                            <div className="bg-white/60 rounded-xl p-4 border border-emerald-200 space-y-2 mb-4 text-sm text-emerald-800">
                                <p><span className="font-bold">כותרת:</span> {result.title}</p>
                                <p><span className="font-bold">כותרת (אנגלית):</span> {result.title_en}</p>
                                <p><span className="font-bold">כתובת:</span> /{result.slug}</p>
                            </div>
                            <Link 
                                href={`/blog/${result.slug}`} 
                                target="_blank"
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
                            >
                                צפה במאמר באתר
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
