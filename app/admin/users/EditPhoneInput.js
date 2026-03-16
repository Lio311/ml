'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
                setIsEditing(false);
                router.refresh(); // Refresh the page to update the UI
            } else {
                console.error('Failed to update phone');
                alert('שגיאה בעדכון מספר הטלפון');
            }
        } catch (error) {
            console.error('Error updating phone', error);
            alert('שגיאה בעדכון מספר הטלפון');
        } finally {
            setIsLoading(false);
        }
    };

    if (!canEdit) {
        return initialPhone ? (
            <a href={`tel:${initialPhone}`} className="hover:underline text-blue-600">
                {initialPhone}
            </a>
        ) : (
            <span className="text-gray-400 italic">אין</span>
        );
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 mt-1" dir="ltr">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-right"
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
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded transition-colors disabled:opacity-50"
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
                    className="text-gray-400 hover:text-red-600 bg-gray-50 p-1 rounded transition-colors disabled:opacity-50"
                    title="ביטול"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="group flex items-center justify-between mt-1">
            {initialPhone ? (
                <a href={`tel:${initialPhone}`} className="hover:underline text-blue-600" dir="ltr">
                    {initialPhone}
                </a>
            ) : (
                <span className="text-gray-400 italic text-[10px]">אין טלפון</span>
            )}
            <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 p-1 rounded transition-all focus:opacity-100"
                title="ערוך טלפון"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
