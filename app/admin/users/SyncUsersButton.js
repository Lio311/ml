"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SyncUsersButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border-2 border-amber-50`}
                dir="rtl"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-amber-50 p-2.5 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-bold text-lg">סנכרון משתמשים</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mt-0.5">
                            האם ברצונך לסנכרן את כל המשתמשים מ-Clerk? פעולה זו תעדכן את בסיס הנתונים המקומי.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeSync();
                        }}
                        className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Check className="w-4 h-4" />
                        כן, סנכרן עכשיו
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-200"
                    >
                        <X className="w-4 h-4" />
                        ביטול
                    </button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const executeSync = async () => {

        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/sync", {
                method: "POST",
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`סנכרון הושלם: ${data.syncedCount} משתמשים עוודכנו.`);
                router.refresh();
            } else {
                toast.error(`שגיאה בסנכרון: ${data.error}`);
            }
        } catch (error) {
            console.error("Sync error:", error);
            toast.error("שגיאה בחיבור לשרת");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition shadow-sm text-sm font-medium ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'מסנכרן...' : 'סנכרן משתמשים מ-Clerk'}
        </button>
    );
}
