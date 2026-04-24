"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, Video, AlignCenter, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function BannerManager() {
    const [banner, setBanner] = useState({
        type: 'video',
        url: '/hero-video.mp4',
        objectPosition: 'center'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings/home_banner')
            .then(res => res.json())
            .then(data => {
                if (data.banner) {
                    setBanner(data.banner);
                }
            })
            .catch(err => toast.error('שגיאה בטעינת נתוני הבאנר'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!banner.url) {
            toast.error('חובה להזין קישור לתמונה או וידאו');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/home_banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banner })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('הגדרות הבאנר נשמרו בהצלחה!');
            } else {
                toast.error(data.error || 'שגיאה בשמירה');
            }
        } catch (e) {
            toast.error('שגיאת תקשורת');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">טוען...</div>;

    const positions = [
        { id: 'top', label: 'עליון', icon: <ArrowUp size={16} /> },
        { id: 'center', label: 'מרכז', icon: <AlignCenter size={16} /> },
        { id: 'bottom', label: 'תחתון', icon: <ArrowDown size={16} /> },
        { id: 'left', label: 'שמאל', icon: <ArrowLeft size={16} /> },
        { id: 'right', label: 'ימין', icon: <ArrowRight size={16} /> },
    ];

    return (
        <div className="max-w-4xl mx-auto p-6" dir="rtl">
            <h1 className="text-3xl font-bold mb-8">ניהול באנר ראשי (דף הבית)</h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-8">
                
                {/* Type Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">סוג הבאנר</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setBanner({ ...banner, type: 'video' })}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                                banner.type === 'video' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <Video size={20} />
                            <span>וידאו</span>
                        </button>
                        <button
                            onClick={() => setBanner({ ...banner, type: 'image' })}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                                banner.type === 'image' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <ImageIcon size={20} />
                            <span>תמונה</span>
                        </button>
                    </div>
                </div>

                {/* URL Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">קישור לתמונה / וידאו</label>
                    <input
                        type="text"
                        value={banner.url}
                        onChange={(e) => setBanner({ ...banner, url: e.target.value })}
                        placeholder="https://example.com/image.jpg או /hero-video.mp4"
                        dir="ltr"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        ניתן להשתמש בקישור חיצוני (<span dir="ltr">https://...</span>) או בקובץ מקומי מתיקיית ה-<span dir="ltr">public</span> (למשל: <span dir="ltr">/hero-video.mp4</span>).
                    </p>
                </div>

                {/* Object Position */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">מיקוד / חיתוך התמונה (Object Position)</label>
                    <div className="flex flex-wrap gap-3">
                        {positions.map(pos => (
                            <button
                                key={pos.id}
                                onClick={() => setBanner({ ...banner, objectPosition: pos.id })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                    banner.objectPosition === pos.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {pos.icon}
                                <span>{pos.label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        קובע איזה חלק של התמונה/וידאו יקבל עדיפות במסכים צרים (מובייל).
                    </p>
                </div>

            </div>

            {/* Preview Section */}
            <div className="mb-8 border border-gray-200 rounded-2xl overflow-hidden relative" style={{ height: '400px' }}>
                <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                    תצוגה מקדימה (Preview)
                </div>
                {banner.type === 'video' ? (
                    <video
                        src={banner.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ objectPosition: banner.objectPosition }}
                    />
                ) : (
                    <img 
                        src={banner.url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: banner.objectPosition }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=Image+Not+Found' }}
                    />
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    {saving ? 'שומר...' : 'שמור שינויים'}
                    <Save size={20} />
                </button>
            </div>
        </div>
    );
}
