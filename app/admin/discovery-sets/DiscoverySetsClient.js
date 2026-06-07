"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Edit2, Trash2, Check, X, Image as ImageIcon, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

export default function DiscoverySetsClient({ products: initialProducts, initialSearch, canEdit }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [portalNode, setPortalNode] = useState(null);
    const [products, setProducts] = useState(initialProducts || []);
    const [search, setSearch] = useState(initialSearch);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tempGen, setTempGen] = useState({ numberOfSamples: "", sampleSize: "" });

    useEffect(() => {
        setProducts(initialProducts || []);
    }, [initialProducts]);

    useEffect(() => {
        const node = document.createElement("div");
        node.id = "discovery-sets-modal-root";
        document.body.appendChild(node);
        setPortalNode(node);
        setMounted(true);
        return () => {
            if (node && document.body.contains(node)) {
                document.body.removeChild(node);
            }
        };
    }, []);

    const defaultForm = {
        brand: "",
        model: "",
        single_price: "",
        volume_label: "",
        image_url: "",
        description: "",
        stock: 0,
        active: true,
        show_on_home: true,
        discovery_type: "discovery_set",
        image_url_2: "",
        image_url_3: ""
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
            show_on_home: product.show_on_home ?? true,
            discovery_type: product.discovery_type || "discovery_set",
            image_url_2: product.image_url_2 || "",
            image_url_3: product.image_url_3 || ""
        });
        setTempGen({ numberOfSamples: "", sampleSize: "" });
        setIsModalOpen(true);
    };

    const generateDescription = () => {
        if (!form.brand) {
            toast.error("יש למלא מותג קודם");
            return;
        }
        
        let generatedDesc = "";
        let generatedVolume = "";

        if (form.discovery_type === "discovery_set") {
            if (!tempGen.numberOfSamples || !tempGen.sampleSize) {
                toast.error("יש למלא כמות דוגמיות וגודל");
                return;
            }
            generatedVolume = `${tempGen.numberOfSamples} בקבוקונים של ${tempGen.sampleSize} מ״ל`;
            generatedDesc = `גלו את עולמו הקסום של המותג ${form.brand} עם ערכת ההתנסות הרשמית והיוקרתית. הערכה כוללת ${tempGen.numberOfSamples} דוגמיות בנפח ${tempGen.sampleSize} מ״ל כל אחת, המאפשרות לכם לחוות את הניחוחות המובילים והאהובים ביותר של בית הבושם. הזדמנות מושלמת למצוא את חותם הריח הבא שלכם בנוחות של הבית, לפני התחייבות לבקבוק בגודל מלא.`;
        } else {
            if (!tempGen.sampleSize) {
                toast.error("יש למלא גודל דוגמית");
                return;
            }
            generatedVolume = `${tempGen.sampleSize} מ״ל`;
            generatedDesc = `דוגמית רשמית ומקורית של המותג ${form.brand} בנפח ${tempGen.sampleSize} מ״ל. הדרך המושלמת והבטוחה להתנסות בניחוח היוקרתי על העור שלכם לאורך זמן, ולגלות איך הוא מתפתח במהלך היום לפני שמתחייבים לבקבוק המלא.`;
        }

        setForm({ ...form, description: generatedDesc, volume_label: generatedVolume });
        toast.success("תיאור נוצר בהצלחה!");
    };

    const saveProduct = async () => {
        if (!form.brand || !form.model || !form.single_price) {
            toast.error("יש למלא מותג, שם מוצר ומחיר");
            return;
        }

        setIsLoading(true);
        try {
            const method = editingProduct ? "PUT" : "POST";
            const body = editingProduct ? { ...editingProduct, ...form } : { ...form };
            if (editingProduct) body.id = editingProduct.id;

            const res = await fetch("/api/admin/discovery-sets", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "שגיאה בשמירת המוצר");
            }

            toast.success("המוצר נשמר בהצלחה!");
            setIsModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "שגיאה בשמירה");
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
                                <th className="p-4 font-semibold">סוג</th>
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
                                            <Link href={`/product/${product.slug || product.id}`} target="_blank" className="block w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden relative flex items-center justify-center mx-auto hover:opacity-80 transition-opacity">
                                                {product.image_url ? (
                                                    <Image src={product.image_url} alt={product.name || product.model} fill className="object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                                )}
                                            </Link>
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                            <Link href={`/product/${product.slug || product.id}`} target="_blank" className="hover:text-blue-600 hover:underline transition-colors">
                                                {product.model}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-gray-600">{product.discovery_type === 'official_sample' ? 'דוגמית רשמית' : 'דיסקברי סט'}</td>
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
                                                <div className="flex justify-center gap-2 transition-opacity">
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
            {mounted && portalNode && isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] relative">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingProduct ? "עריכת פריט" : "הוספת פריט חדש"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">מותג</label>
                                    <input
                                        type="text"
                                        value={form.brand}
                                        onChange={e => setForm({ ...form, brand: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">שם הפריט</label>
                                    <input
                                        type="text"
                                        value={form.model}
                                        onChange={e => setForm({ ...form, model: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">מחיר (₪)</label>
                                    <input
                                        type="number"
                                        value={form.single_price}
                                        onChange={e => setForm({ ...form, single_price: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">סוג המוצר</label>
                                    <select
                                        value={form.discovery_type}
                                        onChange={e => setForm({ ...form, discovery_type: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
                                    >
                                        <option value="discovery_set">דיסקברי סט</option>
                                        <option value="official_sample">דוגמית רשמית של החברה</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">מלאי זמין</label>
                                    <input
                                        type="number"
                                        value={form.stock}
                                        onChange={e => setForm({ ...form, stock: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">קישור לתמונה ראשית</label>
                                    <input
                                        type="url"
                                        value={form.image_url}
                                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">תמונה 2 (אופציונלי)</label>
                                    <input
                                        type="url"
                                        value={form.image_url_2}
                                        onChange={e => setForm({ ...form, image_url_2: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">תמונה 3 (אופציונלי)</label>
                                    <input
                                        type="url"
                                        value={form.image_url_3}
                                        onChange={e => setForm({ ...form, image_url_3: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                <label className="block text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <Wand2 size={16} /> מחולל תיאור אוטומטי
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">כמות דוגמיות בערכה</label>
                                        <input
                                            type="number"
                                            value={tempGen.numberOfSamples}
                                            onChange={e => setTempGen({ ...tempGen, numberOfSamples: e.target.value })}
                                            placeholder="לדוגמה: 5"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">גודל דוגמית (מ"ל)</label>
                                        <input
                                            type="number"
                                            value={tempGen.sampleSize}
                                            onChange={e => setTempGen({ ...tempGen, sampleSize: e.target.value })}
                                            placeholder="לדוגמה: 2"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={generateDescription}
                                    className="mt-3 w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                >
                                    החל אוטומטית (ייצור טקסט)
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">טקסט כותרת מלאי זמין (מוצג ללקוח)</label>
                                <input
                                    type="text"
                                    value={form.volume_label}
                                    onChange={e => setForm({ ...form, volume_label: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                    placeholder="לדוגמה: 5 בקבוקונים של 2 מ״ל"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">תיאור (HTML)</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all h-32 resize-none"
                                    dir="rtl"
                                />
                            </div>
                            
                            <div className="flex items-center gap-6">
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

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-start gap-3 shrink-0">
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
                </div>, portalNode
            )}
        </div>
    );
}
