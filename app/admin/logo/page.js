'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Trash2, ImageIcon, RotateCcw } from 'lucide-react';
import Image from 'next/image';

export default function LogoAdminPage() {
    const [logoUrl, setLogoUrl] = useState('');
    const [currentLogo, setCurrentLogo] = useState('/logo_v5.png');
    const [isDefault, setIsDefault] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    useEffect(() => {
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const res = await fetch('/api/admin/logo');
            if (res.ok) {
                const data = await res.json();
                setCurrentLogo(data.logoUrl);
                setIsDefault(data.isDefault);
                if (!data.isDefault) setLogoUrl(data.logoUrl);
            }
        } catch (err) {
            toast.error('שגיאה בטעינת הלוגו');
        }
    };

    const handleSave = async () => {
        if (!logoUrl.trim()) {
            toast.error('יש להזין כתובת URL ללוגו');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/logo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl: logoUrl.trim() })
            });
            if (res.ok) {
                toast.success('הלוגו עודכן בהצלחה! ישתקף באתר בטעינה הבאה.');
                setCurrentLogo(logoUrl.trim());
                setIsDefault(false);
                setPreviewError(false);
            } else {
                toast.error('שגיאה בשמירת הלוגו');
            }
        } catch (err) {
            toast.error('שגיאת רשת');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/admin/logo', { method: 'DELETE' });
            if (res.ok) {
                toast.success('הלוגו אופס לברירת המחדל');
                setCurrentLogo('/logo_v5.png');
                setIsDefault(true);
                setLogoUrl('');
                setPreviewError(false);
            } else {
                toast.error('שגיאה במחיקת הלוגו');
            }
        } catch (err) {
            toast.error('שגיאת רשת');
        } finally {
            setIsDeleting(false);
        }
    };

    const previewSrc = logoUrl.trim() || currentLogo;

    return (
        <div className="p-6 max-w-3xl mx-auto" dir="rtl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    ניהול לוגו האתר
                </h1>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    החלפה, עדכון או איפוס הלוגו שמוצג בכותרת האתר
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preview Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">תצוגה מקדימה</h2>
                    <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center min-h-[140px] border border-gray-100">
                        {!previewError ? (
                            <img
                                src={previewSrc}
                                alt="Logo Preview"
                                className="max-h-20 max-w-full object-contain"
                                onError={() => setPreviewError(true)}
                                style={{ filter: 'brightness(0)' }}
                            />
                        ) : (
                            <div className="text-center text-gray-400 text-sm">
                                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                לא ניתן לטעון את התמונה
                            </div>
                        )}
                    </div>
                    {isDefault && (
                        <p className="mt-3 text-xs text-center text-gray-400 font-medium">
                            ✓ מוצג הלוגו הברירת מחדל
                        </p>
                    )}
                    {!isDefault && (
                        <p className="mt-3 text-xs text-center text-blue-500 font-medium">
                            ✓ לוגו מותאם אישית פעיל
                        </p>
                    )}
                </div>

                {/* Edit Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">עדכון לוגו</h2>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            כתובת תמונת לוגו
                        </label>
                        <input
                            type="text"
                            dir="ltr"
                            value={logoUrl}
                            onChange={(e) => {
                                setLogoUrl(e.target.value);
                                setPreviewError(false);
                            }}
                            placeholder="https://... או /my-logo.png"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            ניתן להשתמש בקישור חיצוני (<span dir="ltr">https://...</span>) או בקובץ מקומי מתיקיית ה-<span dir="ltr">public</span> (למשל: <span dir="ltr">/my-logo.png</span>).
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isDeleting}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            שמור לוגו
                        </button>

                        {!isDefault && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || isSaving}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 border border-red-200"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                אפס לברירת מחדל
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
