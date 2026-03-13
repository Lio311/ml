'use client';

import { useState } from 'react';

export default function DeleteOrderButton({ orderId, deleteAction }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleDelete = async (formData) => {
        try {
            await deleteAction(formData);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to delete order:", error);
            alert("שגיאה במחיקת ההזמנה");
        }
    };

    return (
        <div className="mt-1">
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-red-500 text-xs underline hover:text-red-700 transition-colors"
            >
                מחק הזמנה
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2 text-gray-900 font-serif tracking-tight">האם אתם בטוחים?</h3>
                        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                            מחיקת הזמנה <span className="font-bold text-gray-900">#{orderId}</span> היא פעולה סופית ולא ניתן לבטל אותה לאחר מכן. המלאי יוחזר למערכת באופן אוטומטי.
                        </p>
                        
                        <div className="flex gap-3">
                            <form action={handleDelete} className="flex-1">
                                <input type="hidden" name="orderId" value={orderId} />
                                <button
                                    type="submit"
                                    className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                                >
                                    כן, מחק
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
