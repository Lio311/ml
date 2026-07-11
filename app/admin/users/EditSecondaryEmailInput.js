'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2, Plus, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditSecondaryEmailInput({ userId, initialEmail, canEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState(initialEmail || '');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/secondary-email`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secondary_email: email.trim() || null })
            });
            if (res.ok) {
                toast.success('מייל נוסף עודכן בהצלחה');
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error('שגיאה בעדכון מייל נוסף');
            }
        } catch (error) {
            console.error('Error updating secondary email', error);
            toast.error('שגיאה בעדכון מייל נוסף');
        } finally {
            setIsLoading(false);
        }
    };

    if (!canEdit) {
        return (
            <div className="flex items-center justify-center mt-1 gap-1">
                <Mail className="w-3 h-3 text-gray-400" />
                {initialEmail ? (
                    <a href={`mailto:${initialEmail}`} className="hover:underline text-gray-600 text-[11px]" dir="ltr">
                        {initialEmail}
                    </a>
                ) : (
                    <span className="text-gray-400 italic text-[10px]">אין מייל נוסף</span>
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
                        setEmail(initialEmail || '');
                        setIsEditing(false);
                    }}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-red-600 bg-gray-50 p-1 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                    title="ביטול"
                >
                    <X className="w-4 h-4" />
                </button>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-40 text-[11px] px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-center"
                    placeholder="הזן מייל נוסף"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setEmail(initialEmail || '');
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
            <div dir="ltr" className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-400" />
                {initialEmail ? (
                    <a href={`mailto:${initialEmail}`} className="hover:underline text-gray-600 text-[11px]">
                        {initialEmail}
                    </a>
                ) : (
                    <span className="text-gray-400 italic text-[10px]">אין מייל נוסף</span>
                )}
            </div>
            <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                title={initialEmail ? "ערוך מייל נוסף" : "הוסף מייל נוסף"}
            >
                {initialEmail ? <Pencil className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
        </div>
    );
}
