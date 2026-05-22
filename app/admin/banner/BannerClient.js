"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, Video, AlignCenter, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';

// Default content shown in editor when no content has been saved yet.
// This mirrors the hardcoded fallback in page.js / HeroCarousel.
const DEFAULT_CONTENT_HE = `<p style="text-align:center"><span style="font-family: Assistant, sans-serif; font-size: 0.75em; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase;">גלה את בושם החתימה שלך</span></p><p style="text-align:center"><span style="font-family: 'Gveret Levin', 'Dancing Script', cursive; font-size: 2.5em; font-weight: bold;">ml-tlv: דוגמיות בשמי נישה</span></p><p style="text-align:center"><span style="font-family: 'Gveret Levin', 'Dancing Script', cursive; font-size: 2.5em; font-weight: bold;">ודיקאנטים מקוריים</span></p><p style="text-align:center"><span style="font-family: Assistant, sans-serif; font-size: 1em;">הדרך החכמה לגלות בשמי נישה יוקרתיים. מגוון דוגמיות יוקרה ודיקאנטים של הבשמים הנחשקים בעולם. הזמינו דוגמיות לפני רכישת בקבוק מלא.</span></p>`;
const DEFAULT_CONTENT_EN = `<p style="text-align:center"><span style="font-family: Assistant, sans-serif; font-size: 0.75em; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase;">Discover your signature scent</span></p><p style="text-align:center"><span style="font-family: 'Gveret Levin', 'Dancing Script', cursive; font-size: 2.5em; font-weight: bold;">ml-tlv: Niche Perfume Samples</span></p><p style="text-align:center"><span style="font-family: 'Gveret Levin', 'Dancing Script', cursive; font-size: 2.5em; font-weight: bold;">&amp; Original Decants</span></p><p style="text-align:center"><span style="font-family: Assistant, sans-serif; font-size: 1em;">The smart way to explore luxury niche perfumes. Sample before you commit to a full bottle.</span></p>`;

export default function BannerClient() {
    const [banners, setBanners] = useState([{ type: 'video', url: '/hero-video.mp4', objectPosition: 'center' }]);
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dragState, setDragState] = useState({ isDragging: false, index: null, type: null, startX: 0, startY: 0, initialValX: 0, initialValY: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragState.isDragging) return;
            const { index, type, startX, startY, initialValX, initialValY } = dragState;
            const banner = banners[index];
            const isDesktop = (!banner.activeTab || banner.activeTab === 'desktop');
            
            const height = isDesktop ? 300 : 500;
            const width = isDesktop ? 600 : 280; 

            const deltaY = ((e.clientY - startY) / height) * 100;
            const deltaX = ((e.clientX - startX) / width) * 100;
            
            if (type === 'box') {
                if (isDesktop) {
                    let newY = Math.min(100, Math.max(0, initialValY + deltaY));
                    let newX = Math.min(100, Math.max(0, initialValX + deltaX));
                    updateBanner(index, 'contentPositionDesktop', Math.round(newY));
                    updateBanner(index, 'contentPositionXDesktop', Math.round(newX));
                } else {
                    let newY = Math.min(100, Math.max(0, initialValY + deltaY));
                    updateBanner(index, 'contentPositionMobile', Math.round(newY));
                }
            } else if (type === 'bg') {
                const bgDelta = -deltaY;
                let newPos = Math.min(120, Math.max(-20, initialValY + bgDelta));
                if (isDesktop) {
                    updateBanner(index, 'objectPositionDesktop', Math.round(newPos));
                } else {
                    updateBanner(index, 'objectPositionMobile', Math.round(newPos));
                }
            }
        };

        const handleMouseUp = () => {
            if (dragState.isDragging) {
                setDragState(prev => ({ ...prev, isDragging: false }));
            }
        };

        if (dragState.isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, banners]);

    const handleDragStart = (e, index, type, initialValX, initialValY) => {
        e.preventDefault();
        setDragState({
            isDragging: true,
            index,
            type,
            startX: e.clientX,
            startY: e.clientY,
            initialValX,
            initialValY
        });
    };

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
                setDataLoaded(true);
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
                                    <div className="mt-4 flex items-center gap-3">
                                        <button
                                            onClick={() => updateBanner(index, 'hideContentBox', !banner.hideContentBox)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${banner.hideContentBox ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                            title={banner.hideContentBox ? "הצג קובייה לבנה" : "הסתר קובייה לבנה"}
                                        >
                                            {banner.hideContentBox ? <EyeOff size={18} /> : <Eye size={18} />}
                                            <span className="text-sm font-semibold">{banner.hideContentBox ? 'הקובייה הלבנה מוסתרת' : 'הקובייה הלבנה מוצגת'}</span>
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
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">מיקוד אנכי — סרטון/תמונה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
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
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>למטה (-20)</span>
                                                    <span>אמצע (50)</span>
                                                    <span>למעלה (120)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">מיקום אופקי — קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentPositionXDesktop ?? 50}
                                                    onChange={(e) => updateBanner(index, 'contentPositionXDesktop', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>שמאל (0%)</span>
                                                    <span>אמצע (50%)</span>
                                                    <span>ימין (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">מיקום אנכי — קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentPositionDesktop ?? 50}
                                                    onChange={(e) => updateBanner(index, 'contentPositionDesktop', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>למעלה (0%)</span>
                                                    <span>אמצע (50%)</span>
                                                    <span>למטה (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">גודל קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="50" 
                                                    max="150" 
                                                    value={banner.contentScaleDesktop ?? 100}
                                                    onChange={(e) => updateBanner(index, 'contentScaleDesktop', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>קטן (50%)</span>
                                                    <span>רגיל (100%)</span>
                                                    <span>ענק (150%)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">שקיפות קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentOpacityDesktop ?? 60}
                                                    onChange={(e) => updateBanner(index, 'contentOpacityDesktop', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>שקוף (0%)</span>
                                                    <span>אטום (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">מיקוד אנכי — סרטון/תמונה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
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
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>למטה (-20)</span>
                                                    <span>אמצע (50)</span>
                                                    <span>למעלה (120)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">מיקום אנכי — קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentPositionMobile ?? 80}
                                                    onChange={(e) => updateBanner(index, 'contentPositionMobile', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>למעלה (0%)</span>
                                                    <span>אמצע (50%)</span>
                                                    <span>למטה (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">גודל קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="50" 
                                                    max="150" 
                                                    value={banner.contentScaleMobile ?? 100}
                                                    onChange={(e) => updateBanner(index, 'contentScaleMobile', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>קטן (50%)</span>
                                                    <span>רגיל (100%)</span>
                                                    <span>ענק (150%)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">שקיפות קובייה</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={banner.contentOpacityMobile ?? 60}
                                                    onChange={(e) => updateBanner(index, 'contentOpacityMobile', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>שקוף (0%)</span>
                                                    <span>אטום (100%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content Box Editor */}
                                {!banner.hideContentBox && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">עריכת טקסט וכפתור</h3>
                                            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                                                <button
                                                    onClick={() => updateBanner(index, 'contentLang', 'he')}
                                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${(!banner.contentLang || banner.contentLang === 'he') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    עברית
                                                </button>
                                                <button
                                                    onClick={() => updateBanner(index, 'contentLang', 'en')}
                                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${(banner.contentLang === 'en') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    English
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    טקסט ({(!banner.contentLang || banner.contentLang === 'he') ? 'עברית' : 'אנגלית'})
                                                </label>
                                                <div className={banner.contentLang === 'en' ? 'dir-ltr' : 'dir-rtl'}>
                                                    <RichTextEditor 
                                                        key={`editor-${index}-${banner.contentLang || 'he'}-${dataLoaded ? 'loaded' : 'loading'}`}
                                                        value={banner.contentLang === 'en' ? (banner.contentEn || DEFAULT_CONTENT_EN) : (banner.contentHe || banner.content || DEFAULT_CONTENT_HE)}
                                                        onChange={(val) => updateBanner(index, banner.contentLang === 'en' ? 'contentEn' : 'contentHe', val)}
                                                        dir={banner.contentLang === 'en' ? 'ltr' : 'rtl'}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        טקסט כפתור ({(!banner.contentLang || banner.contentLang === 'he') ? 'עברית' : 'אנגלית'})
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={banner.contentLang === 'en' ? (banner.btnTextEn || '') : (banner.btnTextHe || '')}
                                                        onChange={(e) => updateBanner(index, banner.contentLang === 'en' ? 'btnTextEn' : 'btnTextHe', e.target.value)}
                                                        placeholder={banner.contentLang === 'en' ? "Shop Now" : "קנה עכשיו"}
                                                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${banner.contentLang === 'en' ? 'text-left dir-ltr' : ''}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        קישור כפתור (משותף)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="ltr"
                                                        value={banner.btnLink || '/catalog'}
                                                        onChange={(e) => updateBanner(index, 'btnLink', e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                        const contentX = isDesktop ? (banner.contentPositionXDesktop ?? 50) : 50;
                                        // Virtual banner dimensions (matching real site)
                                        // Desktop: ~82vh of a 900px screen = ~738px tall
                                        // Preview container: 300px → scale = 300/738 ≈ 0.406
                                        const basePreviewScale = isDesktop ? 0.406 : 0.88;
                                        const userScale = isDesktop ? (banner.contentScaleDesktop ?? 100) / 100 : (banner.contentScaleMobile ?? 100) / 100;
                                        const finalScale = basePreviewScale * userScale;

                                        const contentOpacity = isDesktop ? (banner.contentOpacityDesktop ?? 60) : (banner.contentOpacityMobile ?? 60);

                                        return (
                                            <div className="relative w-full h-full">
                                                {/* Background layer (dimmed out) */}
                                                <div 
                                                    className={`absolute inset-0 w-full h-full cursor-ns-resize ${dragState.isDragging && dragState.type === 'bg' ? 'opacity-80' : ''}`}
                                                    onMouseDown={(e) => handleDragStart(e, index, 'bg', 0, yPercent)}
                                                >
                                                    {banner.type === 'video' ? (
                                                        <video
                                                            src={banner.url}
                                                            autoPlay loop muted playsInline
                                                            className="w-full h-full object-cover opacity-30 grayscale pointer-events-none"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={banner.url}
                                                            alt="Preview Background"
                                                            className="w-full h-full object-cover opacity-30 grayscale pointer-events-none"
                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=Image+Not+Found' }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Foreground layer (bright, exactly clipped to visible area) */}
                                                <div 
                                                    className="absolute inset-0 w-full h-full cursor-ns-resize"
                                                    style={{ clipPath: `inset(${topCutoff}% 0 ${bottomCutoff}% 0)` }}
                                                    onMouseDown={(e) => handleDragStart(e, index, 'bg', 0, yPercent)}
                                                >
                                                    {banner.type === 'video' ? (
                                                        <video
                                                            src={banner.url}
                                                            autoPlay loop muted playsInline
                                                            className="w-full h-full object-cover pointer-events-none"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={banner.url}
                                                            alt="Preview Foreground"
                                                            className="w-full h-full object-cover pointer-events-none"
                                                        />
                                                    )}
                                                </div>

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
                                                    {!banner.hideContentBox && (
                                                        <div 
                                                            className={`absolute backdrop-blur-md rounded-2xl ${isDesktop ? 'p-8 py-5' : 'p-4'} border border-white/20 shadow-2xl text-center transition-all duration-75 flex flex-col items-center cursor-move ${dragState.isDragging && dragState.type === 'box' ? 'ring-2 ring-blue-500 shadow-blue-500/50' : ''}`}
                                                            style={{
                                                                width: isDesktop ? 'max-content' : '90%',
                                                                maxWidth: isDesktop ? 'none' : '400px',
                                                                top: `${contentY}%`,
                                                                left: `${contentX}%`,
                                                                transform: `translate(-${contentX}%, -${contentY}%) scale(${finalScale})`,  
                                                                transformOrigin: `${contentX}% ${contentY}%`,
                                                                backgroundColor: `rgba(255, 255, 255, ${contentOpacity / 100})`,
                                                                pointerEvents: 'auto'
                                                            }}
                                                            onMouseDown={(e) => handleDragStart(e, index, 'box', contentX, contentY)}
                                                        >
                                                            {banner.contentLang === 'en' && banner.contentEn ? (
                                                                <div className={`pointer-events-none whitespace-normal px-0 pb-3 ${isDesktop ? 'max-w-none' : 'max-w-[280px] mx-auto text-sm'}`} dangerouslySetInnerHTML={{ __html: banner.contentEn }} />
                                                            ) : (banner.contentLang !== 'en' && (banner.contentHe || banner.content)) ? (
                                                                <div className={`pointer-events-none whitespace-normal px-0 pb-3 ${isDesktop ? 'max-w-none' : 'max-w-[280px] mx-auto text-sm'}`} dangerouslySetInnerHTML={{ __html: banner.contentHe || banner.content }} />
                                                            ) : (
                                                                <>
                                                                    {/* Placeholder fallback for backward compatibility */}
                                                                    <div className={`font-assistant tracking-[0.2em] text-gray-800 font-bold mb-1 opacity-90 uppercase pointer-events-none ${isDesktop ? 'text-sm' : 'text-xs'}`}>גלה את בושם החתימה שלך</div>
                                                                    <div className={`font-handwriting font-bold text-black ${isDesktop ? 'text-5xl mb-3' : 'text-[1.35rem] mb-2'} leading-tight tracking-wide pointer-events-none`}>
                                                                        <span className="block whitespace-nowrap">ml-tlv: דוגמיות בשמי נישה</span>
                                                                        <span className="block whitespace-nowrap">ודיקאנטים מקוריים</span>
                                                                    </div>
                                                                    <div className={`font-assistant text-gray-800 opacity-80 leading-relaxed pointer-events-none whitespace-normal ${isDesktop ? 'text-base mb-4 max-w-none' : 'text-xs mb-3 max-w-[280px] mx-auto'}`}>
                                                                        הדרך החכמה לגלות בשמי נישה יוקרתיים. מגוון דוגמיות יוקרה ודיקאנטים (דיקנטים) של הבשמים הנחשקים בעולם.
                                                                        <br className={isDesktop ? 'block' : 'hidden'} />
                                                                        הזמינו דוגמיות לפני רכישת בקבוק מלא.
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className={`inline-block border border-black text-black px-6 py-2.5 font-bold tracking-widest uppercase rounded-full pointer-events-none ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                                                                {banner.contentLang === 'en' ? (banner.btnTextEn || 'SHOP NOW') : (banner.btnTextHe || 'קנה עכשיו')}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
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
