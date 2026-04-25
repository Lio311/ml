"use client";

import { useState, useEffect } from "react";
import { X, Zap, Loader2 } from "lucide-react";

export default function CreateWorkflowModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName("");
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        setLoading(true);
        await onCreate(name);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Modal content */}
            <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                            <Zap size={32} fill="currentColor" className="opacity-80" />
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">אוטומציה חדשה</h2>
                    <p className="text-gray-500 mb-8 font-medium">תן שם לתהליך האוטומטי החדש שלך כדי להתחיל לבנות אותו.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 mr-1 uppercase tracking-widest">שם האוטומציה</label>
                            <input 
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="למשל: הודעת ברוך הבא ללקוח חדש"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg font-medium"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:bg-white/5 transition-all"
                                disabled={loading}
                            >
                                ביטול
                            </button>
                            <button 
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    "צור אוטומציה"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
