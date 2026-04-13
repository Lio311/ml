'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditPhoneInput({ userId, initialPhone, canEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [phone, setPhone] = useState(initialPhone || '');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/phone`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim() || null })
            });
            if (res.ok) {
                toast.success('מספר הטלפון עודכן');
                setIsEditing(false);
                router.refresh(); // Refresh the page to update the UI
            } else {
                console.error('Failed to update phone');
                toast.error('שגיאה בעדכון מספר הטלפון');
            }
        } catch (error) {
            console.error('Error updating phone', error);
            toast.error('שגיאה בעדכון מספר הטלפון');
        } finally {
            setIsLoading(false);
        }
    };

    if (!canEdit) {
        return (
            <div className="flex items-center justify-center mt-1">
                {initialPhone ? (
                    <a href={`tel:${initialPhone}`} className="hover:underline text-blue-600 text-[15px]" dir="ltr">
                        {initialPhone}
                    </a>
                ) : (
                    <span className="text-gray-400 italic text-[10px]">אין טלפון</span>
                )}
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="flex items-center justify-center gap-1 mt-1" dir="ltr">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                    title="שמור"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => {
                        setPhone(initialPhone || '');
                        setIsEditing(false);
                    }}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-red-600 bg-gray-50 p-1 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                    title="ביטול"
                >
                    <X className="w-4 h-4" />
                </button>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-32 text-[15px] px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-center"
                    placeholder="הזן טלפון"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setPhone(initialPhone || '');
                            setIsEditing(false);
                        }
                    }}
                    disabled={isLoading}
                />
            </div>
        );
    }

    return (
        <div className="group flex items-center justify-center gap-1.5 mt-1">
            <div dir="ltr">
                {initialPhone ? (
                    <a href={`tel:${initialPhone}`} className="hover:underline text-blue-600 text-[15px]">
                        {initialPhone}
                    </a>
                ) : (
                    <span className="text-gray-400 italic text-[10px]">אין טלפון</span>
                )}
            </div>
            <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                title="ערוך טלפון"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
