"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    Plus, 
    Play, 
    Settings, 
    Trash2, 
    ToggleLeft, 
    ToggleRight, 
    Zap, 
    Clock, 
    History,
    Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import CreateWorkflowModal from "../../components/admin/automations/CreateWorkflowModal";

export default function AutomationsClient() {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const res = await fetch('/api/admin/automations');
            if (res.ok) {
                const data = await res.json();
                setWorkflows(data);
            }
        } catch (err) {
            toast.error("שגיאה בטעינת אוטומציות");
        } finally {
            setLoading(false);
        }
    };

    const toggleWorkflow = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/automations/${id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentStatus })
            });
            if (res.ok) {
                toast.success(currentStatus ? "אוטומציה כובתה" : "אוטומציה הופעלה");
                fetchWorkflows();
            }
        } catch (err) {
            toast.error("שגיאה בעדכון הסטטוס");
        }
    };

    const createWorkflow = async (name) => {
        try {
            const res = await fetch('/api/admin/automations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                const newWorkflow = await res.json();
                toast.success("אוטומציה נוצרה בהצלחה");
                window.location.href = `/admin/automations/${newWorkflow.id}`;
            }
        } catch (err) {
            toast.error("שגיאה ביצירת אוטומציה");
        }
    };

    const deleteWorkflow = async (id) => {
        toast((t) => (
            <div className="flex flex-col gap-4 p-2 text-right" dir="rtl">
                <p className="font-bold text-gray-900">האם אתה בטוח שברצונך למחוק אוטומציה זו?</p>
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const res = await fetch(`/api/admin/automations/${id}`, {
                                    method: 'DELETE'
                                });
                                if (res.ok) {
                                    toast.success("אוטומציה נמחקה");
                                    fetchWorkflows();
                                }
                            } catch (err) {
                                toast.error("שגיאה במחיקת האוטומציה");
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-600/20"
                    >
                        מחק עכשיו
                    </button>
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    if (!mounted) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 text-right" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                        אוטומציות
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">נהל תהליכים אוטומטיים חכמים לחיסכון בזמן</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} />
                    אוטומציה חדשה
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { 
                        label: "אוטומציות פעילות", 
                        value: workflows.filter(w => w.is_active).length, 
                        icon: Zap, 
                        color: "text-blue-600", 
                        bgColor: "bg-blue-50" 
                    },
                    { 
                        label: "הרצות ב-24 שעות", 
                        value: workflows.filter(w => w.last_run && new Date(w.last_run) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length, 
                        icon: History, 
                        color: "text-purple-600", 
                        bgColor: "bg-purple-50" 
                    },
                    { 
                        label: "זמן שנחסך (חודשי)", 
                        value: `${Math.round(workflows.reduce((acc, w) => acc + (w.total_runs || 0) * 2.5, 0) / 60)}h`, 
                        icon: Clock, 
                        color: "text-green-600", 
                        bgColor: "bg-green-50" 
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Workflow List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-gray-500 font-bold">טוען נתונים...</p>
                </div>
            ) : workflows.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {workflows.map((workflow) => (
                        <div 
                            key={workflow.id}
                            className="group bg-white border border-gray-200 p-5 rounded-3xl hover:border-blue-500/30 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={`${workflow.is_active ? 'text-blue-600' : 'text-gray-300'}`}>
                                        <Zap size={24} fill={workflow.is_active ? "currentColor" : "none"} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{workflow.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                <History size={12} />
                                                נוצר ב-{new Date(workflow.created_at || new Date()).toLocaleDateString('he-IL')}
                                            </span>
                                            {workflow.last_run ? (
                                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    • הרצה אחרונה: {new Date(workflow.last_run).toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                                    • טרם הורץ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                                            workflow.is_active 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' 
                                            : 'bg-gray-50 border-gray-100 text-gray-400'
                                        }`}
                                    >
                                        {workflow.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{workflow.is_active ? 'פעיל' : 'כבוי'}</span>
                                    </button>

                                    <Link 
                                        href={`/admin/automations/${workflow.id}`}
                                        className="text-gray-400 hover:text-gray-900 transition-all p-1"
                                    >
                                        <Settings size={20} />
                                    </Link>
                                    
                                    <button 
                                        onClick={() => deleteWorkflow(workflow.id)}
                                        className="text-gray-400 hover:text-red-600 transition-all p-1"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                    <div className="p-6 rounded-full bg-gray-50 text-gray-300 mb-6">
                        <Zap size={60} strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">אין אוטומציות עדיין</h3>
                    <p className="text-gray-500 max-w-xs mb-8">התחל לבנות את התהליך האוטומטי הראשון שלך וחסוך זמן יקר!</p>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all"
                    >
                        צור עכשיו
                    </button>
                </div>
            )}

            <CreateWorkflowModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={createWorkflow}
            />
        </div>
    );
}
