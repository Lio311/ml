'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2, Plus, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditSecondaryEmailInput({ userId, initialEmail, canEdit, onSaveSuccess }) {
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
                if (onSaveSuccess) onSaveSuccess(email.trim() || null);
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
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                {initialEmail ? (
                    <a href={`mailto:${initialEmail}`} className="hover:underline text-gray-600" dir="ltr">
                        {initialEmail}
                    </a>
                ) : (
                    <span className="text-gray-400 italic font-normal text-xs">אין מייל נוסף</span>
                )}
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-2xl shadow-sm text-sm font-bold text-gray-700" dir="ltr">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    title="שמור"
                >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                    onClick={() => {
                        setEmail(initialEmail || '');
                        setIsEditing(false);
                    }}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-red-600 bg-gray-50 p-1 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    title="ביטול"
                >
                    <X className="w-3 h-3" />
                </button>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-40 text-sm bg-transparent outline-none transition-all"
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
        <div className="group flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 hover:border-blue-100 rounded-2xl shadow-sm text-sm font-bold text-gray-700 transition-all">
            <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            
            <div className="flex items-center gap-2 relative">
                {initialEmail ? (
                    <span className="text-gray-700" dir="ltr">{initialEmail}</span>
                ) : (
                    <span className="text-gray-400 font-normal text-xs transition-colors">אין מייל נוסף</span>
                )}
                
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 absolute -left-8"
                    title={initialEmail ? "ערוך מייל נוסף" : "הוסף מייל נוסף"}
                >
                    {initialEmail ? <Pencil className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
}
