"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function SyncUsersButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        if (!confirm("האם ברצונך לסנכרן את כל המשתמשים מ-Clerk? פעולה זו תעדכן את בסיס הנתונים המקומי.")) return;

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
