"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Check, X, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

export default function DiscoverySetsClient({ products, initialSearch, canEdit }) {
    const router = useRouter();
    const [search, setSearch] = useState(initialSearch);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const defaultForm = {
        brand: "",
        model: "",
        single_price: "",
        volume_label: "",
        image_url: "",
        description: "",
        stock: 0,
        active: true,
        show_on_home: true
    };
    const [form, setForm] = useState(defaultForm);

    const handleSearch = (e) => {
        e.preventDefault();
        router.push(`/admin/discovery-sets?q=${encodeURIComponent(search)}`);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setForm(defaultForm);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setForm({
            brand: product.brand || "",
            model: product.model || "",
            single_price: product.single_price || "",
            volume_label: product.volume_label || "",
            image_url: product.image_url || "",
            description: product.description || "",
            stock: product.stock || 0,
            active: product.active ?? true,
            show_on_home: product.show_on_home ?? true
        });
        setIsModalOpen(true);
    };

    const saveProduct = async () => {
        if (!form.brand || !form.model || !form.single_price) {
            toast.error("יש למלא מותג, שם מוצר ומחיר");
            return;
        }

        setIsLoading(true);
        try {
            const method = editingProduct ? "PUT" : "POST";
            const body = { ...form };
            if (editingProduct) body.id = editingProduct.id;

            const res = await fetch("/api/admin/discovery-sets", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("שגיאה בשמירת המוצר");

            toast.success("המוצר נשמר בהצלחה!");
            setIsModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בשמירה");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק מוצר זה?")) return;

        try {
            const res = await fetch(`/api/admin/discovery-sets?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("שגיאה במחיקה");
            
            toast.success("המוצר נמחק");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("שגיאה במחיקה");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">דיסקברי סט ודוגמיות</h1>
                    <p className="text-sm text-gray-500 mt-1">ניהול מוצרים עם מחיר אחיד וכמות מותאמת אישית</p>
                </div>
                
                {canEdit && (
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-[#050505] text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-xl font-medium"
                    >
                        <Plus size={18} />
                        הוסף פריט חדש
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        placeholder="חיפוש לפי שם, מותג..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#050505] focus:border-transparent outline-none transition-all"
                    />
                    <button type="submit" className="bg-gray-100 text-gray-700 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                        <Search size={20} />
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-sm border-b border-gray-100">
                                <th className="p-4 font-semibold w-16 text-center">תמונה</th>
                                <th className="p-4 font-semibold">שם הפריט</th>
                                <th className="p-4 font-semibold">מותג</th>
                                <th className="p-4 font-semibold">מחיר</th>
                                <th className="p-4 font-semibold">תיאור כמות</th>
                                <th className="p-4 font-semibold text-center">מלאי</th>
                                <th className="p-4 font-semibold text-center">סטטוס</th>
                                {canEdit && <th className="p-4 font-semibold text-center w-24">פעולות</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-gray-500">
                                        לא נמצאו פריטים
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden relative flex items-center justify-center mx-auto">
                                                {product.image_url ? (
                                                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{product.model}</td>
                                        <td className="p-4 text-gray-600">{product.brand}</td>
                                        <td className="p-4 font-medium">₪{product.single_price || 0}</td>
                                        <td className="p-4 text-gray-600">{product.volume_label || "-"}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {product.active ? (
                                                <span className="text-green-500 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-200">פעיל</span>
                                            ) : (
                                                <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded text-xs font-medium border border-gray-200">טיוטה</span>
                                            )}
                                        </td>
                                        {canEdit && (
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingProduct ? "עריכת פריט" : "הוספת פריט חדש"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">מותג</label>
                                    <input
                                        type="text"
                                        value={form.brand}
                                        onChange={e => setForm({...form, brand: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="לדוגמה: Creed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">שם הפריט</label>
                                    <input
                                        type="text"
                                        value={form.model}
                                        onChange={e => setForm({...form, model: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="לדוגמה: Discovery Set Men"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">מחיר (₪)</label>
                                    <input
                                        type="number"
                                        value={form.single_price}
                                        onChange={e => setForm({...form, single_price: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">תיאור כמות/נוזל</label>
                                    <input
                                        type="text"
                                        value={form.volume_label}
                                        onChange={e => setForm({...form, volume_label: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="לדוגמה: 5 בקבוקונים של 2 מ״ל"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">מלאי זמין</label>
                                    <input
                                        type="number"
                                        value={form.stock}
                                        onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">קישור לתמונה</label>
                                    <input
                                        type="text"
                                        value={form.image_url}
                                        onChange={e => setForm({...form, image_url: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">תיאור</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                />
                            </div>

                            <div className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={e => setForm({...form, active: e.target.checked})}
                                        className="w-4 h-4 text-[#050505] rounded border-gray-300 focus:ring-[#050505]"
                                    />
                                    <span className="text-sm font-medium">פעיל באתר</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.show_on_home}
                                        onChange={e => setForm({...form, show_on_home: e.target.checked})}
                                        className="w-4 h-4 text-[#050505] rounded border-gray-300 focus:ring-[#050505]"
                                    />
                                    <span className="text-sm font-medium">הצג בדף הבית</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                                disabled={isLoading}
                            >
                                ביטול
                            </button>
                            <button
                                onClick={saveProduct}
                                disabled={isLoading}
                                className="px-6 py-2.5 bg-[#050505] text-white font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Check size={18} />
                                )}
                                שמור פריט
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
