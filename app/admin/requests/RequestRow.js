
"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2, Loader2, Save, History } from 'lucide-react';
import { deleteRequest, updateRequest } from './actions';

export default function RequestRow({ req, canEdit }) {
    const [brand, setBrand] = useState(req.brand);
    const [model, setModel] = useState(req.model);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        const loadingToast = toast.loading('מעדכן בקשה...');
        try {
            const res = await updateRequest(req.id, brand, model);
            if (res.success) {
                toast.success('הבקשה עודכנה בהצלחה');
            } else {
                toast.error(res.error || 'שגיאה בעדכון');
            }
        } catch (error) {
            toast.error('שגיאת תקשורת');
        } finally {
            toast.dismiss(loadingToast);
            setIsUpdating(false);
        }
    };

    const confirmDelete = () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-in fade-in zoom-in-95 duration-300' : 'animate-out fade-out zoom-out-95 duration-300'} flex flex-col gap-4 p-6 min-w-[320px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto`} dir="rtl">
                <div className="flex items-center gap-3 mb-1">
                    <div className="bg-red-50 text-red-600 p-2 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <p className="font-black text-gray-900 text-sm">מחיקת בקשה</p>
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-gray-600 text-xs leading-relaxed">האם אתה בטוח שברצונך למחוק את הבקשה של:</p>
                    <p className="font-black text-gray-900 text-xs truncate max-w-[280px]">{req.user_email}</p>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                    >
                        ביטול
                    </button>
                    <button 
                        onClick={async () => { 
                            toast.dismiss(t.id);
                            executeDelete();
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
                    >
                        מחק לצמיתות
                    </button>
                </div>
            </div>
        ), { duration: 8000, position: 'top-center' });
    };

    const executeDelete = async () => {
        setIsDeleting(true);
        const loadingToast = toast.loading('מוחק בקשה...');
        try {
            const res = await deleteRequest(req.id);
            if (res.success) {
                toast.success('הבקשה נמחקה');
            } else {
                toast.error(res.error || 'שגיאה במחיקה');
            }
        } catch (error) {
            toast.error('שגיאת תקשורת');
        } finally {
            toast.dismiss(loadingToast);
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Desktop View */}
            <tr className={`hover:bg-gray-50/50 transition-colors ${isDeleting ? 'opacity-30 pointer-events-none' : ''}`}>
                <td className="p-4 text-xs font-bold text-gray-400">{req.id}</td>
                <td className="p-4 text-sm font-bold text-gray-900 text-right truncate max-w-[200px]">{req.user_email || 'לא ידוע'}</td>

                <td className="p-4 text-center">
                    {canEdit ? (
                        <input
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm w-40 text-center focus:border-black focus:ring-0 outline-none transition-colors font-bold bg-white"
                        />
                    ) : (
                        <span className="text-gray-900 font-bold">{req.brand}</span>
                    )}
                </td>

                <td className="p-4 text-center">
                    {canEdit ? (
                        <input
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm w-40 text-center focus:border-black focus:ring-0 outline-none transition-colors font-bold bg-white"
                        />
                    ) : (
                        <span className="text-gray-900 font-bold">{req.model}</span>
                    )}
                </td>

                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(req.created_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>

                <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                            <>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'עדכן'}
                                </button>

                                <button
                                    onClick={confirmDelete}
                                    className="text-red-500 hover:text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl transition-all active:scale-95"
                                    title="מחק"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        {!canEdit && <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">צפייה בלבד</span>}
                    </div>
                </td>
            </tr>

            {/* Mobile View - Note: In a real app we'd probably separate these components or handle visibility via CSS as before */}
            <div className="md:hidden bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                            #{req.id}
                        </div>
                        <div className="text-sm font-black text-gray-900 leading-tight truncate max-w-[180px]">{req.user_email || 'לא ידוע'}</div>
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 pt-0.5">
                        {new Date(req.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 opacity-60">מותג</label>
                        {canEdit ? (
                            <input
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full border-2 border-gray-200/50 bg-white rounded-xl px-3 py-2 text-sm font-bold focus:border-black outline-none transition-colors"
                            />
                        ) : (
                            <div className="text-sm font-black text-gray-900">{req.brand}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 opacity-60">דגם</label>
                        {canEdit ? (
                            <input
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full border-2 border-gray-200/50 bg-white rounded-xl px-3 py-2 text-sm font-bold focus:border-black outline-none transition-colors"
                            />
                        ) : (
                            <div className="text-sm font-black text-gray-900">{req.model}</div>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100/50 mt-1">
                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 h-11 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'עדכן'}
                        </button>

                        <button
                            onClick={confirmDelete}
                            className="w-14 h-11 flex items-center justify-center text-red-500 bg-red-50 rounded-2xl border border-red-100/50 active:scale-95 transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
