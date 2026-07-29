'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Save, ImageIcon, RotateCcw } from 'lucide-react';

const LOGO_SECTIONS = [
    { key: 'logo_header', title: 'לוגו ראשי (Header)', desc: 'מופיע בתפריט, footer, עמודי תוכן, open graph' },
    { key: 'logo_email', title: 'לוגו למיילים (Email)', desc: 'מופיע במיילים נשלחים ללקוחות וב-fallback' },
    { key: 'logo_chat', title: "לוגו צ'אט (Chat)", desc: "מופיע בווידג'ט הצ'אט" },
    { key: 'logo_fallback', title: 'לוגו גיבוי / אופליין', desc: 'מופיע בדף שגיאת רשת ופוש נוטיפיקציות' },
    { key: 'icon_apple', title: 'אייקון לאפליקציה באייפון', desc: 'Apple Touch Icon - מופיע בשמירה למסך הבית' },
    { key: 'icon_192', title: 'אייקון PWA (192x192)', desc: 'מופיע במכשירי אנדרואיד / כרום' },
    { key: 'icon_512', title: 'אייקון PWA (512x512)', desc: 'מופיע במכשירי אנדרואיד / כרום באיכות גבוהה' },
    { key: 'favicon', title: 'פאביקון (Favicon)', desc: 'מופיע בלשונית הדפדפן' }
];

function LogoSection({ section, logos, isDefault, onSave, onDelete }) {
    const [logoUrl, setLogoUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    const currentLogo = logos[section.key];
    const isDef = isDefault[section.key];
    const previewSrc = logoUrl.trim() || currentLogo;

    // Reset input when currentLogo changes (on mount or fetch)
    useEffect(() => {
        if (!isDef) setLogoUrl(currentLogo);
        else setLogoUrl('');
    }, [currentLogo, isDef]);

    const handleSave = async () => {
        if (!logoUrl.trim()) {
            toast.error('יש להזין כתובת URL ללוגו');
            return;
        }
        setIsSaving(true);
        await onSave(section.key, logoUrl.trim(), () => {
            setPreviewError(false);
        });
        setIsSaving(false);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(section.key, () => {
            setLogoUrl('');
            setPreviewError(false);
        });
        setIsDeleting(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 mb-1">{section.title}</h2>
                <p className="text-sm text-gray-500 mb-4">{section.desc}</p>
                
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    כתובת תמונת לוגו / אייקון
                </label>
                <input
                    type="text"
                    dir="ltr"
                    value={logoUrl}
                    onChange={(e) => {
                        setLogoUrl(e.target.value);
                        setPreviewError(false);
                    }}
                    placeholder="/my-logo.png או https://..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-sm text-sm"
                    >
                        שמור
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    {!isDef && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || isSaving}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 border border-red-200 text-sm"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            אפס
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full md:w-48 shrink-0 flex flex-col justify-center items-center bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[140px]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">תצוגה מקדימה</h3>
                {!previewError && previewSrc ? (
                    <img
                        src={previewSrc}
                        alt="Logo Preview"
                        className="max-h-20 max-w-full object-contain"
                        onError={() => setPreviewError(true)}
                    />
                ) : (
                    <div className="text-center text-gray-400 text-sm">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-30" />
                        לא נטען
                    </div>
                )}
                {isDef ? (
                    <p className="mt-2 text-[10px] text-center text-gray-400 font-medium">✓ ברירת מחדל</p>
                ) : (
                    <p className="mt-2 text-[10px] text-center text-blue-500 font-medium">✓ מותאם אישית</p>
                )}
            </div>
        </div>
    );
}

export default function LogoClient() {
    const [logos, setLogos] = useState({});
    const [isDefault, setIsDefault] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogos();
    }, []);

    const fetchLogos = async () => {
        try {
            const res = await fetch('/api/admin/logo');
            if (res.ok) {
                const data = await res.json();
                setLogos(data.logos || {});
                setIsDefault(data.isDefault || {});
            }
        } catch (err) {
            toast.error('שגיאה בטעינת הלוגואים');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key, logoUrl, onSuccess) => {
        try {
            const res = await fetch('/api/admin/logo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, logoUrl })
            });
            if (res.ok) {
                toast.success('הלוגו עודכן בהצלחה! ישתקף באתר בטעינה הבאה.');
                setLogos(prev => ({ ...prev, [key]: logoUrl }));
                setIsDefault(prev => ({ ...prev, [key]: false }));
                onSuccess();
            } else {
                toast.error('שגיאה בשמירת הלוגו');
            }
        } catch (err) {
            toast.error('שגיאת רשת');
        }
    };

    const handleDelete = async (key, onSuccess) => {
        try {
            const res = await fetch(`/api/admin/logo?key=${key}`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                toast.success('הלוגו אופס לברירת המחדל');
                setLogos(prev => ({ ...prev, [key]: data.logoUrl }));
                setIsDefault(prev => ({ ...prev, [key]: true }));
                onSuccess();
            } else {
                toast.error('שגיאה במחיקת הלוגו');
            }
        } catch (err) {
            toast.error('שגיאת רשת');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    ניהול לוגואים ואייקונים
                </h1>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    החלפה, עדכון או איפוס של כל הלוגואים והאייקונים במערכת
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {LOGO_SECTIONS.map((section) => (
                    <LogoSection
                        key={section.key}
                        section={section}
                        logos={logos}
                        isDefault={isDefault}
                        onSave={handleSave}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
