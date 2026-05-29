"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, Video, AlignCenter, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
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
    // Map of banner index → measured outer container width (used to compute preview scale).
    const [previewWidths, setPreviewWidths] = useState({});
    const previewOuterRefs = useRef({});

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragState.isDragging) return;
            const { index, type, startX, startY, initialValX, initialValY } = dragState;
            const banner = banners[index];
            const isDesktop = (!banner.activeTab || banner.activeTab === 'desktop');

            // Real canvas dimensions rendered inside the scaled inner div
            const REAL_W = isDesktop ? 1920 : 390;
            const REAL_H = isDesktop ? 885 : 844;

            // The outer container's measured width → derive the CSS scale applied to the inner canvas.
            // Mouse deltas are in CSS pixel space (unscaled), so we divide by the scale to get
            // the equivalent delta in the 1920px coordinate system.
            const outerW = previewWidths[index] || (isDesktop ? 600 : 280);
            const previewScale = outerW / REAL_W;

            // Delta in real-canvas pixels
            const deltaYReal = (e.clientY - startY) / previewScale;
            const deltaXReal = (e.clientX - startX) / previewScale;

            // Convert to percentages of the real canvas
            const deltaY = (deltaYReal / REAL_H) * 100;
            const deltaX = (deltaXReal / REAL_W) * 100;
            
            if (type === 'box') {
                if (isDesktop) {
                    let newY = Math.min(100, Math.max(0, initialValY + deltaY));
                    
                    // In RTL (Hebrew), moving right (positive deltaX) gets closer to right edge -> contentX decreases
                    // In LTR (English), moving right (positive deltaX) gets further from left edge -> contentX increases
                    let newX = banner.contentLang === 'en' 
                        ? initialValX + deltaX 
                        : initialValX - deltaX;
                    
                    newX = Math.min(100, Math.max(0, newX));
                    
                    updateBanner(index, 'contentPositionDesktop', Math.round(newY));
                    updateBanner(index, 'contentPositionXDesktop', Math.round(newX));
                } else {
                    let newY = Math.min(100, Math.max(0, initialValY + deltaY));
                    updateBanner(index, 'contentPositionMobile', Math.round(newY));
                }
            } else if (type === 'bg') {
                const bgDelta = -deltaY;
                const minLimit = isDesktop ? -40 : -80;
                let newPos = Math.min(120, Math.max(minLimit, initialValY + bgDelta));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Callback ref: just stores the DOM element. ResizeObserver is set up in useEffect below.
    const registerPreviewOuter = useCallback((el, idx) => {
        previewOuterRefs.current[idx] = el;
    }, []);

    // Set up ResizeObservers for all preview outer containers after mount / when banner count changes.
    useEffect(() => {
        const observers = [];
        Object.entries(previewOuterRefs.current).forEach(([idx, el]) => {
            if (!el) return;
            // Record current width immediately
            setPreviewWidths(prev => {
                const w = el.offsetWidth;
                if (prev[idx] === w) return prev;
                return { ...prev, [idx]: w };
            });
            const observer = new ResizeObserver(([entry]) => {
                const w = Math.round(entry.contentRect.width);
                setPreviewWidths(prev => {
                    if (prev[idx] === w) return prev; // avoid re-render if same
                    return { ...prev, [idx]: w };
                });
            });
            observer.observe(el);
            observers.push(observer);
        });
        return () => observers.forEach(o => o.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [banners.length]);

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
                                <button 
                                    onClick={() => updateBanner(index, 'isCollapsed', banner.isCollapsed !== undefined ? !banner.isCollapsed : !banner.isHidden)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    {(banner.isCollapsed !== undefined ? banner.isCollapsed : banner.isHidden) ? <ChevronDown size={24} className="text-gray-500" /> : <ChevronUp size={24} className="text-gray-500" />}
                                </button>
                                <div className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center font-bold ${banner.isHidden ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {index + 1}
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold cursor-pointer" onClick={() => updateBanner(index, 'isCollapsed', banner.isCollapsed !== undefined ? !banner.isCollapsed : !banner.isHidden)}>
                                    באנר מספר {index + 1} {banner.isHidden && <span className="text-sm font-normal text-orange-600 mr-2">(מוסתר)</span>}
                                </h2>
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

                        {!(banner.isCollapsed !== undefined ? banner.isCollapsed : banner.isHidden) && (
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
                                                    min="-40" 
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
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold" dir="ltr">
                                                    <span>-40 למטה</span>
                                                    <span>50 אמצע</span>
                                                    <span>120 למעלה</span>
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
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">רוחב קובייה (מחשב)</label>
                                            <div className="px-2" dir="ltr">
                                                <input 
                                                    dir="ltr"
                                                    type="range" 
                                                    min="0" 
                                                    max="1200" 
                                                    step="10"
                                                    value={banner.boxWidthDesktop ?? 0}
                                                    onChange={(e) => updateBanner(index, 'boxWidthDesktop', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                    <span>אוטומטי (0)</span>
                                                    <span>רחב (1200px)</span>
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
                                                    min="-80" 
                                                    max="120" 
                                                    value={
                                                        banner.objectPositionMobile ?? 
                                                        (banner.objectPosition && banner.objectPosition.includes('%') ? parseInt(banner.objectPosition.split(' ')[1]) : 50)
                                                    }
                                                    onChange={(e) => updateBanner(index, 'objectPositionMobile', parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold" dir="ltr">
                                                    <span>-80 למטה</span>
                                                    <span>50 אמצע</span>
                                                    <span>120 למעלה</span>
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
                                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">רווח בין השורות</label>
                                                    <div className="px-2" dir="ltr">
                                                        <input 
                                                            dir="ltr"
                                                            type="range" 
                                                            min="10" 
                                                            max="30" 
                                                            value={banner.lineHeight ? parseInt(parseFloat(banner.lineHeight) * 10) : 15}
                                                            onChange={(e) => updateBanner(index, 'lineHeight', (parseInt(e.target.value) / 10).toString())}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                            <span>צפוף (1.0)</span>
                                                            <span>רגיל (1.5)</span>
                                                            <span>מרווח (3.0)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">מרחק כפתור מהטקסט</label>
                                                    <div className="px-2" dir="ltr">
                                                        <input 
                                                            dir="ltr"
                                                            type="range" 
                                                            min="0" 
                                                            max="100" 
                                                            value={banner.buttonMarginTop ?? 16}
                                                            onChange={(e) => updateBanner(index, 'buttonMarginTop', parseInt(e.target.value))}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-500 mt-1 font-bold">
                                                            <span>צמוד (0px)</span>
                                                            <span>רחוק (100px)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Button Colors */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">צבע טקסט כפתור</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={banner.btnTextColor || '#000000'}
                                                            onChange={(e) => updateBanner(index, 'btnTextColor', e.target.value)}
                                                            className="h-10 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
                                                        />
                                                        <span className="text-xs text-gray-500 font-mono" dir="ltr">{banner.btnTextColor || '#000000'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">צבע מסגרת כפתור</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={banner.btnBorderColor || '#000000'}
                                                            onChange={(e) => updateBanner(index, 'btnBorderColor', e.target.value)}
                                                            className="h-10 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
                                                        />
                                                        <span className="text-xs text-gray-500 font-mono" dir="ltr">{banner.btnBorderColor || '#000000'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* =====================================================================
                                PREVIEW — renders a full 1920×885px (desktop) or 390×844px (mobile)
                                inner canvas, then scales it down to fit the available column width.

                                Why this approach?
                                  • The content box CSS is IDENTICAL to HeroCarousel.js
                                    (same left/right, transform, transform-origin values).
                                  • The video uses the same object-position as the live site.
                                  • Everything is proportionally perfect — true 1:1 representation.

                                The outer div establishes the visual bounds (aspect-ratio + overflow:hidden).
                                The inner div is 1920px wide and scaled via CSS transform: scale(S)
                                where S = outerWidth / 1920.  A ResizeObserver keeps S up to date.
                            ===================================================================== */}
                            {(() => {
                                const isDesktop = (!banner.activeTab || banner.activeTab === 'desktop');

                                // Real canvas size (matches the live site's hero element)
                                const REAL_W = isDesktop ? 1920 : 390;
                                const REAL_H = isDesktop ? 885 : 844;

                                // Scale derived from measured outer container width
                                const outerW = previewWidths[index] || (isDesktop ? 600 : 280);
                                const previewScale = outerW / REAL_W;

                                // Values from saved banner data (same field names as HeroCarousel.js)
                                const bgYDesktop = banner.objectPositionDesktop ??
                                    (banner.objectPosition?.includes('%')
                                        ? parseInt(banner.objectPosition.split(' ')[1] || '50')
                                        : 50);
                                const bgYMobile = banner.objectPositionMobile ??
                                    (banner.objectPosition?.includes('%')
                                        ? parseInt(banner.objectPosition.split(' ')[1] || '50')
                                        : 50);
                                const yPercent = isDesktop ? bgYDesktop : bgYMobile;

                                const contentY = isDesktop ? (banner.contentPositionDesktop ?? 50) : (banner.contentPositionMobile ?? 80);
                                const contentX = isDesktop ? (banner.contentPositionXDesktop ?? 50) : 50;
                                const contentScale = isDesktop ? (banner.contentScaleDesktop ?? 100) : (banner.contentScaleMobile ?? 100);
                                const contentOpacity = isDesktop ? (banner.contentOpacityDesktop ?? 60) : (banner.contentOpacityMobile ?? 60);

                                // CSS variables — SAME as HeroCarousel.js
                                const cssVars = {
                                    '--active-bg-y-desktop': `${bgYDesktop}%`,
                                    '--active-bg-y-mobile': `${bgYMobile}%`,
                                    '--active-content-y-desktop': `${contentY}%`,
                                    '--active-content-y-mobile': `${contentY}%`,
                                    '--active-content-x-desktop': `${contentX}%`,
                                    '--active-content-scale-desktop': contentScale / 100,
                                    '--active-content-scale-mobile': contentScale / 100,
                                    '--active-content-opacity-desktop': contentOpacity / 100,
                                    '--active-content-opacity-mobile': contentOpacity / 100,
                                    '--active-content-display': banner.hideContentBox ? 'none' : 'block',
                                };

                                return (
                                    <>
                                        {/* Outer container: defines visual bounds */}
                                        <div
                                            ref={(el) => registerPreviewOuter(el, index)}
                                            className={`banner-preview-outer border border-gray-200 rounded-2xl overflow-hidden relative ${
                                                banner.isHidden ? 'opacity-40' : 'opacity-100'
                                            }`}
                                            style={{
                                                // Desktop: full column width (always ≤ 1920px so scale ≤ 1).
                                                // Mobile: cap at 320px max — the mobile canvas is 390px wide, so
                                                // without a cap the container could be wider than canvas causing
                                                // scale > 1 which makes fonts appear larger than on real site.
                                                width: isDesktop ? '100%' : undefined,
                                                maxWidth: isDesktop ? undefined : '320px',
                                                margin: isDesktop ? undefined : '0 auto',
                                                aspectRatio: `${REAL_W} / ${REAL_H}`,
                                                position: 'relative',
                                            }}
                                        >
                                            {/* Inner 1:1 canvas */}
                                            <div
                                                className="banner-slide"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: `${REAL_W}px`,
                                                    height: `${REAL_H}px`,
                                                    transformOrigin: 'top left',
                                                    transform: `scale(${previewScale})`,
                                                    ...cssVars,
                                                }}
                                            >
                                                {/* ── Background media ── */}
                                                <div
                                                    className="absolute inset-0 cursor-ns-resize"
                                                    onMouseDown={(e) => handleDragStart(e, index, 'bg', 0, yPercent)}
                                                >
                                                    {banner.url ? (
                                                        banner.type === 'video' ? (
                                                            <video
                                                                src={banner.url}
                                                                autoPlay loop muted playsInline
                                                                className="w-full h-full object-cover pointer-events-none"
                                                                style={{ objectPosition: `50% ${yPercent}%` }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={banner.url}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover pointer-events-none"
                                                                style={{ objectPosition: `50% ${yPercent}%` }}
                                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x885?text=Not+Found'; }}
                                                            />
                                                        )
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                            <span className="text-gray-400 text-2xl">לא הוזן קישור</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ── Simulated header (matches live site exactly) ──
                                                    Desktop: h-28 = 112px.  Mobile: h-20 = 80px. */}
                                                <div
                                                    className="absolute top-0 left-0 right-0 z-10 bg-white shadow-sm pointer-events-none flex items-center justify-between px-8"
                                                    style={{ height: isDesktop ? '112px' : '80px' }}
                                                >
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                        <div className="w-24 h-3 bg-gray-200 rounded"></div>
                                                    </div>
                                                    <span className="text-black font-bold tracking-widest text-2xl">ml-tlv.</span>
                                                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                </div>

                                                {/* ── Content box ──
                                                    Uses IDENTICAL CSS to HeroCarousel.js.
                                                    Because this canvas is 1920×885, all the %, px, em values
                                                    match 1:1 with the live site.  The outer scale() takes care
                                                    of shrinking everything to fit the admin column. */}
                                                {!banner.hideContentBox && (
                                                    <div
                                                        className="absolute z-20"
                                                        style={{
                                                            display: banner.hideContentBox ? 'none' : 'block',
                                                            top: `${contentY}%`,
                                                            // RTL: left + translate(-X%, -Y%)  |  LTR: right + translate(+X%, -Y%)
                                                            ...(banner.contentLang === 'en'
                                                                ? { right: `${contentX}%`, left: 'auto' }
                                                                : { left: `${contentX}%`, right: 'auto' }
                                                            ),
                                                            transform: banner.contentLang === 'en'
                                                                ? `translate(${contentX}%, -${contentY}%) scale(${contentScale / 100})`
                                                                : `translate(-${contentX}%, -${contentY}%) scale(${contentScale / 100})`,
                                                            transformOrigin: banner.contentLang === 'en'
                                                                ? `calc(100% - ${contentX}%) ${contentY}%`
                                                                : `${contentX}% ${contentY}%`,
                                                            // Width: use max-content (w-max equivalent) just like live site.
                                                            // On live site maxWidth is 130vw (so basically unbounded by container).
                                                            width: banner.boxWidthDesktop > 0
                                                                ? `${banner.boxWidthDesktop}px`
                                                                : 'max-content',
                                                            maxWidth: '130%',
                                                            cursor: 'move',
                                                        }}
                                                        onMouseDown={(e) => handleDragStart(e, index, 'box', contentX, contentY)}
                                                    >
                                                        {/* Glass background — matches live page.js EXACTLY:
                                                            px-3 py-2 for mobile, px-5 py-3 for desktop */}
                                                        <div
                                                            className={`content-box-bg rounded-2xl border border-white/20 shadow-2xl text-center ${
                                                                isDesktop ? 'px-5 py-3' : 'px-3 py-2'
                                                            }`}
                                                            style={{
                                                                backgroundColor: `rgba(255,255,255,${contentOpacity / 100})`,
                                                                backdropFilter: 'blur(12px)',
                                                                WebkitBackdropFilter: 'blur(12px)',
                                                                outline: dragState.isDragging && dragState.type === 'box' ? '3px solid #3b82f6' : 'none',
                                                            }}
                                                        >
                                                            {/* Content */}
                                                            {banner.contentLang === 'en' && banner.contentEn ? (
                                                                <div
                                                                    className="pointer-events-none whitespace-normal banner-text-content lang-en"
                                                                    style={{ lineHeight: banner.lineHeight || '1.5' }}
                                                                    dangerouslySetInnerHTML={{ __html: banner.contentEn }}
                                                                />
                                                            ) : (banner.contentLang !== 'en' && (banner.contentHe || banner.content)) ? (
                                                                <div
                                                                    className="pointer-events-none whitespace-normal banner-text-content lang-he"
                                                                    style={{ lineHeight: banner.lineHeight || '1.5' }}
                                                                    dangerouslySetInnerHTML={{ __html: banner.contentHe || banner.content }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="pointer-events-none whitespace-normal banner-text-content lang-he"
                                                                    dangerouslySetInnerHTML={{ __html: DEFAULT_CONTENT_HE }}
                                                                />
                                                            )}

                                                            {/* Button */}
                                                            <div
                                                                className="inline-block border px-12 py-5 font-bold tracking-widest uppercase rounded-full pointer-events-none"
                                                                style={{
                                                                    borderColor: banner.btnBorderColor || '#000000',
                                                                    color: banner.btnTextColor || '#000000',
                                                                    marginTop: `${banner.buttonMarginTop ?? (isDesktop ? 24 : 16)}px`,
                                                                    fontSize: '1rem',
                                                                }}
                                                            >
                                                                {banner.contentLang === 'en'
                                                                    ? (banner.btnTextEn || 'SHOP NOW')
                                                                    : (banner.btnTextHe || 'קנה עכשיו')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Label */}
                                                <div className="absolute top-4 right-4 z-30 bg-red-600 text-white px-4 py-1.5 rounded-lg text-xl font-bold shadow-md pointer-events-none">
                                                    אזור גלוי ({isDesktop ? 'מחשב' : 'מובייל'})
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                    </div>
                        )}
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
