"use client";

import { useState, useEffect } from "react";
import { Construction, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function MaintenanceAdminPage() {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/maintenance', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setEnabled(data.enabled);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('שגיאה בטעינת הנתונים');
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('ההגדרות נשמרו בהצלחה!');
            } else {
                toast.error('שגיאה בשמירה: ' + (data.error || ''));
            }
        } catch (err) {
            console.error(err);
            toast.error('שגיאה בשמירה');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
            <div className="flex items-center space-x-4 space-x-reverse mb-8">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Construction className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">אתר בשיפוצים</h1>
                    <p className="text-gray-500 mt-1">הפעל או כבה את מצב התחזוקה באתר. כאשר מצב זה מופעל, הגולשים יופנו לעמוד מיוחד המודיע שהאתר בשיפוצים, ולא יוכלו לגלוש בשאר העמודים (למעט ממשק הניהול שיישאר פתוח).</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between border-b pb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">הפעלת מצב שיפוצים</h3>
                            <p className="text-sm text-gray-500 mt-1">הפעלת מתג זה תחסום מידית את הגישה לאתר.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 min-w-[140px]"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    שמור שינויים
                                    <Save className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {enabled && (
                    <div className="bg-yellow-50 p-4 text-yellow-800 text-sm border-t border-yellow-100 flex items-start gap-3">
                        <Construction className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">שים לב: מצב התחזוקה פעיל כרגע.</p>
                            <p className="mt-1">גולשים שיכנסו לאתר יועברו לעמוד "אתר בשיפוצים". כדי לבטל, כבה את המתג ושמור.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
