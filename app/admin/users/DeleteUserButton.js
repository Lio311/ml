"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function DeleteUserButton({ userId, userName }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`המשתמש ${userName} נמחק בהצלחה מה-DB המקומי.`);
                router.refresh();
            } else {
                toast.error(`שגיאה במחיקה: ${data.error}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("שגיאה בחיבור לשרת");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = () => {
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border-2 border-red-100`}
                dir="rtl"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-red-50 p-2.5 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-bold text-lg">מחיקת משתמש לצמיתות</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mt-0.5">
                            האם אתה בטוח שברצונך למחוק את <span className="font-bold text-gray-900">{userName}</span>? 
                            הקטלוגים האישיים יימחקו, אך ההזמנות והביקורות יישמרו ללא שם.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            handleDelete();
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                    >
                        <Check className="w-4 h-4" />
                        כן, מחק מה-DB
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

    return (
        <button
            onClick={confirmDelete}
            disabled={loading}
            className={`p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all group flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="מחק מה-DB"
        >
            <Trash2 className={`w-4 h-4 ${loading ? 'animate-pulse' : 'group-hover:scale-110'}`} />
        </button>
    );
}
