'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Save, RotateCcw, Palette, AlertTriangle } from 'lucide-react';
import { useBrand } from '@/app/context/BrandContext';

export default function BrandClient() {
    const brand = useBrand();
    const [brandName, setBrandName] = useState('');
    const [current, setCurrent] = useState(null);
    const [isDefault, setIsDefault] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => { fetchBrand(); }, []);

    const fetchBrand = async () => {
        try {
            const res = await fetch('/api/admin/brand');
            if (res.ok) {
                const data = await res.json();
                setCurrent(data);
                setIsDefault(data.isDefault);
                if (!data.isDefault) setBrandName(data.name);
            }
        } catch { toast.error('שגיאה בטעינת שם המותג'); }
    };

    const preview = brandName.trim() || current?.name || brand.name;
    const dotVariant = preview.split('_')[0] + '.';
    const hyphenVariant = preview.replace(/_/g, '-');

    const handleSave = async () => {
        if (!brandName.trim() || brandName.trim().length < 2) {
            toast.error('שם המותג חייב להכיל לפחות 2 תווים');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: brandName.trim() })
            });
            if (res.ok) {
                const data = await res.json();
                setCurrent(data);
                setIsDefault(false);
                toast.success('✅ שם המותג עודכן! הממשק יתעדכן בטעינה הבאה.');
            } else {
                const err = await res.json();
                toast.error(err.error || 'שגיאה בשמירה');
            }
        } catch { toast.error('שגיאת רשת'); }
        finally { setIsSaving(false); }
    };

    const handleReset = async () => {
        setIsResetting(true);
        try {
            const res = await fetch('/api/admin/brand', { method: 'DELETE' });
            if (res.ok) {
                setCurrent({ name: 'ml_tlv', isDefault: true });
                setIsDefault(true);
                setBrandName('');
                toast.success(`שם המותג אופס לברירת המחדל (${brand.name})`);
            }
        } catch { toast.error('שגיאת רשת'); }
        finally { setIsResetting(false); }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto" dir="rtl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    שם מסחרי (Rebranding)
                </h1>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    שינוי שם המותג ישפיע על כל הממשק, האימיילים ומטא-דאטה של האתר
                </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <strong>שים לב:</strong> שינוי שם המותג ישפיע על ממשק המשתמש מיידית עם רענון הדף. מטא-דאטה לגוגל ותוכן מיילים עתידיים יתעדכנו גם הם. <strong>דומיין האתר</strong> ({brand.hyphen}.com) לא ישתנה — זה דורש שינוי DNS נפרד.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">תצוגה מקדימה</h2>
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">ממשק ראשי</p>
                            <p className="text-xl font-black text-gray-900">{preview}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Footer / עיצוב עם נקודה</p>
                            <p className="text-lg font-bold text-gray-700">{dotVariant} <span className="text-xs uppercase tracking-widest opacity-50">luxury sample boutique</span></p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">כותרת עמוד / SEO</p>
                            <p className="text-sm text-gray-600">FAQ | <strong>{preview}</strong></p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">שם מותג עם מקף</p>
                            <p className="text-sm font-mono text-gray-600">{hyphenVariant}</p>
                        </div>
                    </div>
                    {isDefault && (
                        <p className="mt-3 text-xs text-center text-gray-400 font-medium">✓ מוצג שם המותג הנוכחי (ברירת מחדל)</p>
                    )}
                    {!isDefault && (
                        <p className="mt-3 text-xs text-center text-blue-500 font-medium">✓ שם מסחרי מותאם אישית פעיל</p>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">עדכון שם מסחרי</h2>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            שם המותג החדש
                        </label>
                        <input
                            type="text"
                            dir="ltr"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            placeholder={`${current?.name || brand.name}`}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            ניתן להשתמש באותיות, מספרים, מקף ותחתית. לדוגמה: <span dir="ltr" className="font-mono bg-gray-100 px-1 rounded">ScentShop</span> או <span dir="ltr" className="font-mono bg-gray-100 px-1 rounded">niche_perfumes</span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isResetting}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md"
                        >
                            החל שם מסחרי חדש
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>

                        {!isDefault && (
                            <button
                                onClick={handleReset}
                                disabled={isResetting || isSaving}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 border border-red-200"
                            >
                                אופס לשם המקורי ({brand.name})
                                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
