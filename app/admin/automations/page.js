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
    Search,
    ChevronRight,
    Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import CreateWorkflowModal from "../../components/admin/automations/CreateWorkflowModal";

export default function AutomationsPage() {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
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

    const filteredWorkflows = workflows.filter(w => 
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
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
                    { label: "אוטומציות פעילות", value: workflows.filter(w => w.is_active).length, icon: Zap, color: "text-blue-600", bgColor: "bg-blue-50" },
                    { label: "הרצות ב-24 שעות", value: "0", icon: History, color: "text-purple-600", bgColor: "bg-purple-50" },
                    { label: "זמן שנחסך (חודשי)", value: "0h", icon: Clock, color: "text-green-600", bgColor: "bg-green-50" },
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

            {/* Search & Filter */}
            <div className="relative max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text"
                    placeholder="חפש אוטומציה..."
                    className="w-full bg-white border border-gray-200 rounded-2xl py-3 pr-12 pl-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Workflow List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-gray-500 font-bold">טוען נתונים...</p>
                </div>
            ) : filteredWorkflows.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredWorkflows.map((workflow) => (
                        <div 
                            key={workflow.id}
                            className="group bg-white border border-gray-200 p-5 rounded-3xl hover:border-blue-500/30 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-2xl ${workflow.is_active ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{workflow.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                <History size={12} />
                                                נוצר ב-{new Date(workflow.created_at).toLocaleDateString('he-IL')}
                                            </span>
                                            {workflow.last_run && (
                                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    • הרצה אחרונה לפני 5 דקות
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                                            workflow.is_active 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' 
                                            : 'bg-gray-100 border-gray-200 text-gray-500'
                                        }`}
                                    >
                                        {workflow.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        <span className="text-xs font-black uppercase tracking-widest">{workflow.is_active ? 'פעיל' : 'כבוי'}</span>
                                    </button>

                                    <Link 
                                        href={`/admin/automations/${workflow.id}`}
                                        className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 border border-gray-200 transition-all"
                                    >
                                        <Settings size={20} />
                                    </Link>
                                    
                                    <button className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all">
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
