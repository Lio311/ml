"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, Video, AlignCenter, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

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

    return (
        <div className="max-w-4xl mx-auto p-6" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">ניהול באנר ראשי (דף הבית)</h1>
                <button
                    onClick={addBanner}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    הוסף באנר חדש
                </button>
            </div>

            <div className="space-y-8 mb-4">
                {banners.map((banner, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center font-bold ${banner.isHidden ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {index + 1}
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold">באנר מספר {index + 1} {banner.isHidden && <span className="text-sm font-normal text-orange-600 mr-2">(מוסתר)</span>}</h2>
                            </div>

                            <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                                <button
                                    onClick={() => updateBanner(index, 'isHidden', !banner.isHidden)}
                                    className={`p-2 rounded-lg transition-colors ${banner.isHidden ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'hover:bg-gray-200'}`}
                                    title={banner.isHidden ? "הצג באנר (כרגע מוסתר)" : "הסתר באנר"}
                                >
                                    {banner.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button 
                                    onClick={() => removeBanner(index)}
                                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                    title="מחק באנר"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
                                <button 
                                    onClick={() => moveBanner(index, 'up')} 
                                    disabled={index === 0}
                                    className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors"
                                    title="הזז אחורה"
                                >
                                    <ArrowUp size={18} />
                                </button>
                                <button 
                                    onClick={() => moveBanner(index, 'down')} 
                                    disabled={index === banners.length - 1}
                                    className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors"
                                    title="הזז קדימה"
                                >
                                    <ArrowDown size={18} />
                                </button>
                            </div>
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

                                {/* Device Tabs */}
                                <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-6">
                                    <button
                                        onClick={() => updateBanner(index, 'activeTab', 'desktop')}
                                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${(!banner.activeTab || banner.activeTab === 'desktop') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        מחשב (Desktop)
                                    </button>
                                    <button
                                        onClick={() => updateBanner(index, 'activeTab', 'mobile')}
                                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${(banner.activeTab === 'mobile') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        מובייל (Mobile)
                                    </button>
                                </div>

                                {(!banner.activeTab || banner.activeTab === 'desktop') ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">מיקוד אנכי של הסרטון/תמונה (מחשב)</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    type="range" 
                                                    min="-20" 
                                                    max="120" 
                                                    value={
                                                        banner.objectPositionDesktop ?? 
                                                        (banner.objectPosition && banner.objectPosition.includes('%') ? parseInt(banner.objectPosition.split(' ')[1]) : 50)
                                                    }
                                                    onChange={(e) => {
                                                        updateBanner(index, 'objectPositionDesktop', parseInt(e.target.value));
                                                        // Fallback so frontend doesn't break if it hasn't been updated yet
                                                        updateBanner(index, 'objectPosition', `50% ${e.target.value}%`);
                                                    }}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                                                    <span>למטה (-20)</span>
                                                    <span>אמצע (50)</span>
                                                    <span>למעלה (120)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">מיקום הקובייה הלבנה (מחשב)</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentPositionDesktop ?? 50}
                                                    onChange={(e) => updateBanner(index, 'contentPositionDesktop', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                                                    <span>למעלה (0%)</span>
                                                    <span>אמצע (50%)</span>
                                                    <span>למטה (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">מיקוד אנכי של הסרטון/תמונה (מובייל)</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    type="range" 
                                                    min="-20" 
                                                    max="120" 
                                                    value={
                                                        banner.objectPositionMobile ?? 
                                                        (banner.objectPosition && banner.objectPosition.includes('%') ? parseInt(banner.objectPosition.split(' ')[1]) : 50)
                                                    }
                                                    onChange={(e) => updateBanner(index, 'objectPositionMobile', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                                                    <span>למטה (-20)</span>
                                                    <span>אמצע (50)</span>
                                                    <span>למעלה (120)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">מיקום הקובייה הלבנה (מובייל)</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentPositionMobile ?? 80}
                                                    onChange={(e) => updateBanner(index, 'contentPositionMobile', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                                                    <span>למעלה (0%)</span>
                                                    <span>אמצע (50%)</span>
                                                    <span>למטה (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Advanced Cropper Preview */}
                            <div className={`border border-gray-200 rounded-2xl overflow-hidden relative bg-black flex items-center justify-center transition-all duration-300 ${banner.isHidden ? 'opacity-40' : 'opacity-100'} ${(!banner.activeTab || banner.activeTab === 'desktop') ? 'min-h-[300px] h-[300px] w-full' : 'min-h-[500px] h-[500px] w-full max-w-[280px] mx-auto rounded-3xl'}`}>
                                <div className="absolute top-2 right-2 z-30 bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-md">
                                    אזור גלוי ({(!banner.activeTab || banner.activeTab === 'desktop') ? 'מחשב' : 'מובייל'})
                                </div>
                                
                                {banner.url ? (
                                    (() => {
                                        const isDesktop = (!banner.activeTab || banner.activeTab === 'desktop');
                                        
                                        let yPercent = 50;
                                        if (isDesktop) {
                                            yPercent = banner.objectPositionDesktop ?? (banner.objectPosition && banner.objectPosition.includes('%') ? parseInt(banner.objectPosition.split(' ')[1] || '50') : 50);
                                        } else {
                                            yPercent = banner.objectPositionMobile ?? (banner.objectPosition && banner.objectPosition.includes('%') ? parseInt(banner.objectPosition.split(' ')[1] || '50') : 50);
                                        }
                                        
                                        // Mobile crop is much smaller vertically because container is tall
                                        const totalCutoff = isDesktop ? 30 : 15; 
                                        const topCutoff = (yPercent / 100) * totalCutoff;
                                        const bottomCutoff = totalCutoff - topCutoff;
                                        
                                        const contentY = isDesktop ? (banner.contentPositionDesktop ?? 50) : (banner.contentPositionMobile ?? 80);

                                        return (
                                            <div className="relative w-full h-full">
                                                {/* Background layer (dimmed out) */}
                                                {banner.type === 'video' ? (
                                                    <video
                                                        src={banner.url}
                                                        autoPlay loop muted playsInline
                                                        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                                                    />
                                                ) : (
                                                    <img
                                                        src={banner.url}
                                                        alt="Preview Background"
                                                        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=Image+Not+Found' }}
                                                    />
                                                )}

                                                {/* Foreground layer (bright, exactly clipped to visible area) */}
                                                {banner.type === 'video' ? (
                                                    <video
                                                        src={banner.url}
                                                        autoPlay loop muted playsInline
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        style={{ clipPath: `inset(${topCutoff}% 0 ${bottomCutoff}% 0)` }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={banner.url}
                                                        alt="Preview Foreground"
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        style={{ clipPath: `inset(${topCutoff}% 0 ${bottomCutoff}% 0)` }}
                                                    />
                                                )}

                                                {/* Red frame overlay tracking the visible area */}
                                                <div 
                                                    className="absolute left-0 right-0 border-2 border-red-500 z-20 pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-75 flex flex-col"
                                                    style={{
                                                        top: `${topCutoff}%`,
                                                        bottom: `${bottomCutoff}%`
                                                    }}
                                                >
                                                    {/* Top Menu Overlay Simulation */}
                                                    <div className={`w-full ${isDesktop ? 'h-[12%]' : 'h-[15%]'} bg-white/70 backdrop-blur-md border-b border-black/10 flex items-center justify-center relative z-10 shadow-sm`}>
                                                        <span className="text-black/80 text-[9px] md:text-[10px] font-bold drop-shadow-md">מוסתר ע"י תפריט עליון</span>
                                                    </div>
                                                    
                                                    {/* Content Box Simulation */}
                                                    <div 
                                                        className="absolute left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-black/10 shadow-xl text-center transition-all duration-75 flex flex-col items-center"
                                                        style={{
                                                            width: isDesktop ? '60%' : '85%',
                                                            maxWidth: isDesktop ? '400px' : '220px',
                                                            top: `${contentY}%`,
                                                            transform: `translate(-50%, -${contentY}%)`
                                                        }}
                                                    >
                                                        <div className="text-[7px] md:text-[9px] tracking-[0.2em] text-gray-800 font-bold mb-1 opacity-90 uppercase">גלה את בושם החתימה שלך</div>
                                                        <div className="text-xs md:text-lg font-bold text-black mb-1 leading-tight">
                                                            <span className="block">ml-tlv: דוגמיות בשמי נישה</span>
                                                            <span className="block">ודיקאנטים מקוריים</span>
                                                        </div>
                                                        <div className="text-[6px] md:text-[8px] text-gray-700 mb-2 opacity-80 max-w-[200px] md:max-w-[300px] leading-relaxed">
                                                            הדרך החכמה לגלות בשמי נישה יוקרתיים. מגוון דוגמיות יוקרה ודיקאנטים (דיקנטים) של הבשמים הנחשקים בעולם.
                                                        </div>
                                                        <div className="w-16 h-4 md:w-24 md:h-6 mx-auto border border-black rounded-full flex items-center justify-center text-[6px] md:text-[8px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors">קנה עכשיו</div>
                                                    </div>

                                                    <div className="absolute inset-0 bg-red-500/5"></div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="text-gray-400 z-10">לא הוזן קישור להצגה</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-gray-200 pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-md"
                >
                    {saving ? 'שומר...' : 'שמור את כל הבאנרים'}
                    <Save size={20} />
                </button>
            </div>
        </div>
    );
}
