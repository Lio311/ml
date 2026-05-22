"use client";

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Edit2, Eye, EyeOff, X, Instagram, Tag, Bell, Megaphone, MessageCircle, ChevronDown, Image as ImageIcon, Loader2 } from 'lucide-react';

const TEMPLATES = [
    { id: 'instagram', label: 'אינסטגרם', icon: '📸', defaultColors: { primary: '#dc2743', gradient: ['#f09433','#e6683c','#dc2743','#cc2366','#bc1888'], text: '#ffffff' }, defaultIcon: 'instagram' },
    { id: 'sale', label: 'מבצע / הנחה', icon: '🏷️', defaultColors: { primary: '#10b981', gradient: ['#10b981','#059669','#047857'], text: '#ffffff' }, defaultIcon: 'tag' },
    { id: 'announcement', label: 'עדכון כללי', icon: '📢', defaultColors: { primary: '#3b82f6', gradient: ['#3b82f6','#2563eb','#1d4ed8'], text: '#ffffff' }, defaultIcon: 'bell' },
    { id: 'custom', label: 'מותאם אישית', icon: '✨', defaultColors: { primary: '#8b5cf6', gradient: ['#8b5cf6','#7c3aed','#6d28d9'], text: '#ffffff' }, defaultIcon: 'megaphone' },
];

const ICONS = [
    { id: 'instagram', label: 'Instagram', component: Instagram },
    { id: 'tag', label: 'תגית', component: Tag },
    { id: 'bell', label: 'פעמון', component: Bell },
    { id: 'megaphone', label: 'מגפון', component: Megaphone },
    { id: 'message', label: 'הודעה', component: MessageCircle },
];

const FREQUENCIES = [
    { id: 'daily', label: 'פעם ביום' },
    { id: 'weekly', label: 'פעם בשבוע' },
    { id: 'once', label: 'פעם אחת' },
    { id: 'always', label: 'תמיד' },
];

function getIconComponent(iconId) {
    return ICONS.find(i => i.id === iconId)?.component || MessageCircle;
}

function buildGradientCSS(colors) {
    if (colors?.gradient?.length >= 2) {
        return `linear-gradient(135deg, ${colors.gradient.join(', ')})`;
    }
    return colors?.primary || '#8b5cf6';
}

function PopupPreview({ popup, small = false, activeTab = 'he' }) {
    const IconComp = getIconComponent(popup.content?.icon || 'message');
    const grad = buildGradientCSS(popup.colors);
    const sz = small ? 'scale-75 origin-top-right' : '';

    const title = activeTab === 'en' ? (popup.content?.title_en || popup.content?.title) : popup.content?.title;
    const description = activeTab === 'en' ? (popup.content?.description_en || popup.content?.description) : popup.content?.description;
    const buttonText = activeTab === 'en' ? (popup.content?.buttonText_en || popup.content?.buttonText) : popup.content?.buttonText;

    return (
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-xs w-full ${sz}`} dir={activeTab === 'en' ? 'ltr' : 'rtl'}>
            <div className="h-20 opacity-10" style={{ background: grad }} />
            <div className="relative -mt-14 p-5 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full p-0.5 mb-3 shadow-lg" style={{ background: grad }}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        {popup.content?.imageUrl ? (
                            <img src={popup.content.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <IconComp className="w-7 h-7" style={{ color: popup.colors?.primary || '#8b5cf6' }} />
                        )}
                    </div>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: popup.colors?.primary }}>{title || 'כותרת'}</h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">{description || 'תיאור...'}</p>
                <div className="w-full py-2 rounded-xl text-white text-xs font-bold text-center" style={{ background: grad }}>
                    {buttonText || 'לחץ כאן'}
                </div>
            </div>
        </div>
    );
}

function PopupModal({ popup, onSave, onClose }) {
    const isNew = !popup;
    const [form, setForm] = useState(() => {
        if (popup) return JSON.parse(JSON.stringify(popup));
        const tpl = TEMPLATES[0];
        return {
            id: `popup_${Date.now()}`,
            name: '',
            enabled: true,
            template: tpl.id,
            delay: 3000,
            frequency: 'daily',
            colors: { ...tpl.defaultColors },
            content: { title: '', description: '', buttonText: '', buttonUrl: '', icon: tpl.defaultIcon, imageUrl: '' },
            createdAt: new Date().toISOString()
        };
    });

    const [activeTab, setActiveTab] = useState('he');

    const set = (path, val) => {
        setForm(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let obj = next;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = val;
            return next;
        });
    };

    const applyTemplate = (tplId) => {
        const tpl = TEMPLATES.find(t => t.id === tplId);
        if (!tpl) return;
        set('template', tplId);
        setForm(prev => ({
            ...prev,
            template: tplId,
            colors: { ...tpl.defaultColors },
            content: { ...prev.content, icon: tpl.defaultIcon }
        }));
    };

    const handleGradientChange = (idx, val) => {
        const newGrad = [...(form.colors?.gradient || [])];
        newGrad[idx] = val;
        set('colors.gradient', newGrad);
    };

    const addGradientStop = () => {
        set('colors.gradient', [...(form.colors?.gradient || []), '#888888']);
    };

    const removeGradientStop = (idx) => {
        const g = [...(form.colors?.gradient || [])];
        if (g.length <= 2) return;
        g.splice(idx, 1);
        set('colors.gradient', g);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold">{isNew ? 'פופאפ חדש' : 'עריכת פופאפ'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
                    <div className="lg:col-span-3 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">תבנית</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {TEMPLATES.map(tpl => (
                                    <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                                        className={`p-3 rounded-xl border-2 text-center transition-all text-sm ${form.template === tpl.id ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <span className="text-lg block mb-1">{tpl.icon}</span>{tpl.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">שם הפופאפ (פנימי)</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="לדוגמה: פופאפ אינסטגרם" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                            <div className="flex border-b border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setActiveTab('he')}
                                    className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'he' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                                >
                                    עברית
                                </button>
                                <button
                                    onClick={() => setActiveTab('en')}
                                    className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'en' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                                >
                                    English
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">כותרת ({activeTab === 'en' ? 'EN' : 'HE'})</label>
                                        <input type="text" value={activeTab === 'en' ? form.content.title_en || '' : form.content.title} onChange={e => set(activeTab === 'en' ? 'content.title_en' : 'content.title', e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${activeTab === 'en' ? 'text-left' : 'text-right'}`} dir={activeTab === 'en' ? 'ltr' : 'rtl'} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">טקסט כפתור ({activeTab === 'en' ? 'EN' : 'HE'})</label>
                                        <input type="text" value={activeTab === 'en' ? form.content.buttonText_en || '' : form.content.buttonText} onChange={e => set(activeTab === 'en' ? 'content.buttonText_en' : 'content.buttonText', e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${activeTab === 'en' ? 'text-left' : 'text-right'}`} dir={activeTab === 'en' ? 'ltr' : 'rtl'} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">תיאור ({activeTab === 'en' ? 'EN' : 'HE'})</label>
                                    <textarea rows={2} value={activeTab === 'en' ? form.content.description_en || '' : form.content.description} onChange={e => set(activeTab === 'en' ? 'content.description_en' : 'content.description', e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${activeTab === 'en' ? 'text-left' : 'text-right'}`} dir={activeTab === 'en' ? 'ltr' : 'rtl'} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">קישור כפתור (URL)</label>
                                <input type="text" dir="ltr" value={form.content.buttonUrl} onChange={e => set('content.buttonUrl', e.target.value)} placeholder="https://..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">תמונה (URL, אופציונלי)</label>
                                <input type="text" dir="ltr" value={form.content.imageUrl || ''} onChange={e => set('content.imageUrl', e.target.value)} placeholder="https://... או /image.png" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">אייקון</label>
                            <div className="flex gap-2 flex-wrap">
                                {ICONS.map(ic => {
                                    const IC = ic.component;
                                    return (
                                        <button key={ic.id} onClick={() => set('content.icon', ic.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-sm ${form.content.icon === ic.id ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <IC size={16} /> {ic.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">צבעים</label>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">ראשי</span>
                                    <input type="color" value={form.colors.primary} onChange={e => set('colors.primary', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">טקסט</span>
                                    <input type="color" value={form.colors.text} onChange={e => set('colors.text', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-xs text-gray-500 mb-1 block">גרדיאנט</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(form.colors.gradient || []).map((c, i) => (
                                        <div key={i} className="relative group">
                                            <input type="color" value={c} onChange={e => handleGradientChange(i, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                                            {form.colors.gradient.length > 2 && (
                                                <button onClick={() => removeGradientStop(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] hidden group-hover:flex items-center justify-center">×</button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={addGradientStop} className="w-8 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-gray-400 text-lg">+</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">תדירות הצגה</label>
                                <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    {FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">השהייה (שניות)</label>
                                <input type="number" min={0} step={0.5} value={form.delay / 1000} onChange={e => set('delay', Math.max(0, parseFloat(e.target.value || 0) * 1000))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">תצוגה מקדימה</h3>
                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center min-h-[300px] border border-gray-100">
                                <PopupPreview popup={form} activeTab={activeTab} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold">ביטול</button>
                    <button onClick={() => { if(!form.name){ toast.error('חובה להזין שם'); return; } onSave(form); }}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-md transition-all">
                        {isNew ? 'צור פופאפ' : 'שמור שינויים'} <Save size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PopupsClient() {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPopup, setEditingPopup] = useState(null);

    const fetchPopups = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/popups');
            const data = await res.json();
            setPopups(data.popups || []);
        } catch { toast.error('שגיאה בטעינת פופאפים'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPopups(); }, [fetchPopups]);

    const saveAll = async (newList) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/popups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ popups: newList })
            });
            const data = await res.json();
            if (data.success) {
                setPopups(newList);
                toast.success('נשמר בהצלחה!');
            } else {
                toast.error(data.error || 'שגיאה');
            }
        } catch { toast.error('שגיאת תקשורת'); }
        finally { setSaving(false); }
    };

    const handleToggle = (id) => {
        const next = popups.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
        saveAll(next);
    };

    const handleDelete = (id) => {
        if (!confirm('למחוק את הפופאפ?')) return;
        saveAll(popups.filter(p => p.id !== id));
    };

    const handleSavePopup = (popup) => {
        const exists = popups.find(p => p.id === popup.id);
        const next = exists ? popups.map(p => p.id === popup.id ? popup : p) : [...popups, popup];
        saveAll(next);
        setModalOpen(false);
        setEditingPopup(null);
    };

    const openEdit = (popup) => { setEditingPopup(popup); setModalOpen(true); };
    const openNew = () => { setEditingPopup(null); setModalOpen(true); };

    if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">ניהול פופאפים</h1>
                    <p className="text-gray-500 mt-1 text-sm">יצירה, עריכה והפעלה/כיבוי של פופאפים באתר</p>
                </div>
                <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md">
                    <Plus size={18} /> פופאפ חדש
                </button>
            </div>

            {popups.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold mb-4">אין פופאפים עדיין</p>
                    <button onClick={openNew} className="text-blue-600 hover:underline font-bold">צור פופאפ ראשון →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {popups.map(popup => {
                        const IconComp = getIconComponent(popup.content?.icon);
                        const tpl = TEMPLATES.find(t => t.id === popup.template);
                        const grad = buildGradientCSS(popup.colors);

                        return (
                            <div key={popup.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${popup.enabled ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                                <div className="h-1.5" style={{ background: grad }} />
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${popup.colors?.primary}15` }}>
                                                <IconComp size={20} style={{ color: popup.colors?.primary }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{popup.name || 'ללא שם'}</h3>
                                                <span className="text-xs text-gray-400">{tpl?.label || popup.template}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggle(popup.id)} disabled={saving}
                                            className={`relative w-11 h-6 rounded-full transition-all ${popup.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${popup.enabled ? 'right-0.5' : 'right-[22px]'}`} />
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                                        <p className="font-semibold text-gray-700 line-clamp-1">{popup.content?.title || '—'}</p>
                                        <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{popup.content?.description || '—'}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                        <span>⏱ {(popup.delay || 0) / 1000}s</span>
                                        <span>🔄 {FREQUENCIES.find(f => f.id === popup.frequency)?.label || popup.frequency}</span>
                                        {popup.content?.imageUrl && <span className="flex items-center gap-0.5"><ImageIcon size={12} /> תמונה</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(popup)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-all">
                                            <Edit2 size={14} /> ערוך
                                        </button>
                                        <button onClick={() => handleDelete(popup.id)} disabled={saving} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modalOpen && (
                <PopupModal
                    popup={editingPopup}
                    onSave={handleSavePopup}
                    onClose={() => { setModalOpen(false); setEditingPopup(null); }}
                />
            )}
        </div>
    );
}
