"use client";

import Image from "next/image";

export default function CartItem({ item, updateQuantity, removeFromCart, activeVendorId }) {
    return (
        <div key={`${item.id}-${item.size}`} className={`flex items-center gap-4 border p-4 rounded-lg bg-white shadow-sm relative ${item.isPrize ? 'border-amber-300 bg-amber-50' : ''}`}>
            <div className="w-20 h-20 bg-white flex items-center justify-center text-2xl rounded overflow-hidden relative border border-gray-100 flex-shrink-0">
                {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill className="object-contain" sizes="80px" />
                ) : (
                    <span>{item.isPrize ? '🎁' : '🧴'}</span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{item.name}</h3>
                <div className="text-sm text-gray-500">גודל: {item.size === 'set' ? 'סט' : `${String(item.size).replace(/ml$/i, '')} מ"ל`}</div>
                <div className={`text-sm font-bold mt-1 ${item.isPrize ? 'text-green-600' : 'text-primary'}`}>{item.price} ₪ {item.isPrize && '(פרס)'}</div>
            </div>

            {!item.isPrize && (
                <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, activeVendorId)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">-</button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, activeVendorId)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">+</button>
                </div>
            )}

            <button onClick={() => removeFromCart(item.id, item.size, activeVendorId)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition" aria-label="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            </button>
        </div>
    );
}
