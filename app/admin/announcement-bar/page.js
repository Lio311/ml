"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Eye, EyeOff, Type, Palette, Loader2 } from 'lucide-react';

export default function AnnouncementBarAdmin() {
    const [bar, setBar] = useState({ enabled: false, text: '', bgColor: '#000000', textColor: '#ffffff' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/announcement-bar')
            .then(res => res.json())
            .then(data => { if (data.bar) setBar(data.bar); })
            .catch(() => toast.error('שגיאה בטעינה'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/announcement-bar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bar })
            });
            const data = await res.json();
            if (data.success) toast.success('נשמר בהצלחה!');
            else toast.error(data.error || 'שגיאה');
        } catch { toast.error('שגיאת תקשורת'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6" dir="rtl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    פס עליון (Announcement Bar)
                </h1>
                <p className="text-gray-500 mt-2 text-sm flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    פס צבעוני עם טקסט שמופיע מעל התפריט הראשי
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {bar.enabled ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                        <span className="font-bold text-gray-800">{bar.enabled ? 'הפס מוצג באתר' : 'הפס מוסתר'}</span>
                    </div>
                    <button onClick={() => setBar({ ...bar, enabled: !bar.enabled })}
                        className={`relative w-12 h-6 rounded-full transition-all ${bar.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${bar.enabled ? 'right-0.5' : 'right-[26px]'}`} />
                    </button>
                </div>

                {/* Text */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">טקסט</label>
                    <input
                        type="text"
                        value={bar.text}
                        onChange={e => setBar({ ...bar, text: e.target.value })}
                        placeholder='משלוחים חינם בכל הזמנה מעל 500 ₪'
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Palette className="w-4 h-4" /> צבע רקע
                        </label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={bar.bgColor} onChange={e => setBar({ ...bar, bgColor: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" dir="ltr" value={bar.bgColor} onChange={e => setBar({ ...bar, bgColor: e.target.value })}
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-left text-sm font-mono" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Type className="w-4 h-4" /> צבע טקסט
                        </label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={bar.textColor} onChange={e => setBar({ ...bar, textColor: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" dir="ltr" value={bar.textColor} onChange={e => setBar({ ...bar, textColor: e.target.value })}
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-left text-sm font-mono" />
                        </div>
                    </div>
                </div>

                {/* Quick Color Presets */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ערכות צבע מוכנות</label>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { bg: '#000000', text: '#ffffff', label: 'שחור' },
                            { bg: '#1e3a5f', text: '#ffffff', label: 'כחול כהה' },
                            { bg: '#dc2626', text: '#ffffff', label: 'אדום' },
                            { bg: '#059669', text: '#ffffff', label: 'ירוק' },
                            { bg: '#7c3aed', text: '#ffffff', label: 'סגול' },
                            { bg: '#f59e0b', text: '#000000', label: 'צהוב' },
                            { bg: '#ec4899', text: '#ffffff', label: 'ורוד' },
                        ].map(preset => (
                            <button key={preset.bg} onClick={() => setBar({ ...bar, bgColor: preset.bg, textColor: preset.text })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-all text-xs font-semibold">
                                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: preset.bg }} />
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Preview */}
            <div className="mt-6 mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">תצוגה מקדימה</h2>
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    {/* Announcement bar preview */}
                    <div className="w-full text-center py-2 px-4 text-sm font-semibold tracking-wide"
                        style={{ backgroundColor: bar.bgColor, color: bar.textColor }}>
                        {bar.text || 'הטקסט שלך יופיע כאן...'}
                    </div>
                    {/* Simulated header */}
                    <div className="bg-white h-16 flex items-center justify-center border-t border-gray-100">
                        <span className="text-gray-300 text-xs font-bold tracking-widest uppercase">← תפריט ראשי →</span>
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-md">
                    {saving ? 'שומר...' : 'שמור שינויים'} <Save size={18} />
                </button>
            </div>
        </div>
    );
}
