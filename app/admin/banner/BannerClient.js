"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, Video, AlignCenter, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

export default function BannerClient() {
    const [banners, setBanners] = useState([
        {
            type: 'video',
            url: '/hero-video.mp4',
            objectPosition: 'center'
        }
    ]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings/home_banner')
            .then(res => res.json())
            .then(data => {
                if (data.banner) {
                    if (Array.isArray(data.banner)) {
                        setBanners(data.banner.length > 0 ? data.banner : [{ type: 'video', url: '/hero-video.mp4', objectPosition: 'center' }]);
                    } else {
                        // Fallback for old single object structure
                        setBanners([data.banner]);
                    }
                }
            })
            .catch(err => toast.error('שגיאה בטעינת נתוני הבאנר'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        // Validate all banners have URLs
        const invalid = banners.find(b => !b.url);
        if (invalid) {
            toast.error('חובה להזין קישור לכל הבאנרים');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/home_banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banner: banners })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('הגדרות הבאנרים נשמרו בהצלחה!');
            } else {
                toast.error(data.error || 'שגיאה בשמירה');
            }
        } catch (e) {
            toast.error('שגיאת תקשורת');
        } finally {
            setSaving(false);
        }
    };

    const addBanner = () => {
        setBanners([...banners, { type: 'image', url: '', objectPosition: 'center' }]);
    };

    const removeBanner = (index) => {
        if (banners.length === 1) {
            toast.error('חייב להיות לפחות באנר אחד');
            return;
        }
        const newBanners = [...banners];
        newBanners.splice(index, 1);
        setBanners(newBanners);
    };

    const moveBanner = (index, direction) => {
        const newBanners = [...banners];
        if (direction === 'up' && index > 0) {
            [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
        } else if (direction === 'down' && index < newBanners.length - 1) {
            [newBanners[index + 1], newBanners[index]] = [newBanners[index], newBanners[index + 1]];
        }
        setBanners(newBanners);
    };

    const updateBanner = (index, field, value) => {
        const newBanners = [...banners];
        newBanners[index][field] = value;
        setBanners(newBanners);
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ניהול באנר ראשי (דף הבית)</h1>
                <button
                    onClick={addBanner}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                    <Plus size={20} />
                    הוסף באנר חדש
                </button>
            </div>

            <div className="space-y-8 mb-24">
                {banners.map((banner, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                        <div className="absolute top-4 left-4 flex gap-2">
                            <button 
                                onClick={() => moveBanner(index, 'up')} 
                                disabled={index === 0}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                                title="הזז קדימה (למעלה)"
                            >
                                <ArrowUp size={18} />
                            </button>
                            <button 
                                onClick={() => moveBanner(index, 'down')} 
                                disabled={index === banners.length - 1}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                                title="הזז אחורה (למטה)"
                            >
                                <ArrowDown size={18} />
                            </button>
                            <button 
                                onClick={() => removeBanner(index)}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="מחק באנר"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6 border-b pb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                {index + 1}
                            </div>
                            <h2 className="text-xl font-bold">באנר מספר {index + 1}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">סוג הבאנר</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => updateBanner(index, 'type', 'video')}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                                                banner.type === 'video' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Video size={20} />
                                            <span>וידאו</span>
                                        </button>
                                        <button
                                            onClick={() => updateBanner(index, 'type', 'image')}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                                                banner.type === 'image' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <ImageIcon size={20} />
                                            <span>תמונה</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">קישור לתמונה / וידאו</label>
                                    <input
                                        type="text"
                                        value={banner.url}
                                        onChange={(e) => updateBanner(index, 'url', e.target.value)}
                                        placeholder="https://example.com/image.jpg או /hero-video.mp4"
                                        dir="ltr"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">מיקוד / חיתוך (Object Position)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {positions.map(pos => (
                                            <button
                                                key={pos.id}
                                                onClick={() => updateBanner(index, 'objectPosition', pos.id)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                                    banner.objectPosition === pos.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pos.icon}
                                                <span>{pos.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="border border-gray-200 rounded-2xl overflow-hidden relative bg-gray-50 flex items-center justify-center min-h-[200px]" style={{ height: '300px' }}>
                                <div className="absolute top-2 right-2 z-10 bg-black/70 text-white px-2 py-1 rounded-md text-[10px] font-bold">
                                    תצוגה מקדימה
                                </div>
                                {banner.url ? (
                                    banner.type === 'video' ? (
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
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: banner.objectPosition }}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=Image+Not+Found' }}
                                        />
                                    )
                                ) : (
                                    <div className="text-gray-400">לא הוזן קישור להצגה</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full flex justify-center bg-white/95 backdrop-blur-md p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] border-t border-gray-200 z-50">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    {saving ? 'שומר...' : 'שמור את כל הבאנרים'}
                    <Save size={20} />
                </button>
            </div>
        </div>
    );
}
