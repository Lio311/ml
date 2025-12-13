"use client";

import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useState } from "react";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, clearCart, subtotal, total, shippingCost, freeSamplesCount, nextTier } = useCart();
    const { isSignedIn, user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckout = async () => {
        setIsSubmitting(true);

        // Create Order via API
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems,
                    total: total,
                    freeSamples: freeSamplesCount
                })
            });

            if (res.ok) {
                clearCart();
                window.location.href = '/checkout/success';
            } else {
                const data = await res.json();
                alert(`אירעה שגיאה לצערי: ${data.error}`);
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            alert('אירעה שגיאה. בדוק חיבור לרשת.');
            setIsSubmitting(false);
        }
    };


    if (cartItems.length === 0) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">העגלה שלך ריקה</h1>
                <p className="text-gray-500 mb-8">נראה שעדיין לא בחרת ריחות שווים...</p>
                <Link href="/catalog" className="btn btn-primary">
                    חזרה לקטלוג
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container py-12">
                <h1 className="text-3xl font-bold mb-8">העגלה שלי</h1>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Items List */}
                    <div className="flex-1 space-y-6">
                        {cartItems.map((item) => (
                            <div key={`${item.id}-${item.size}`} className="flex items-center gap-4 border p-4 rounded-lg bg-white shadow-sm">
                                <div className="w-20 h-20 bg-white flex items-center justify-center text-2xl rounded overflow-hidden relative border border-gray-100">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span>🧴</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold">{item.name}</h3>
                                    <div className="text-sm text-gray-500">גודל: {item.size} מ"ל</div>
                                    <div className="text-sm font-bold mt-1">{item.price} ₪</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-100">-</button>
                                    <span className="w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-100">+</button>
                                </div>

                                <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 text-sm hover:underline">
                                    הסר
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary & Checkout */}
                    <div className="w-full lg:w-96">
                        <div className="bg-gray-50 p-6 rounded-xl border space-y-6">
                            <h2 className="text-xl font-bold border-b pb-4">סיכום הזמנה</h2>

                            <div className="flex justify-between text-lg">
                                <span>סכום ביניים</span>
                                <span>{subtotal} ₪</span>
                            </div>

                            <div className="flex justify-between text-lg">
                                <span>משלוח</span>
                                <span>{shippingCost} ₪</span>
                            </div>

                            {/* Free Samples Logic */}
                            <div className="bg-blue-50 p-4 rounded border border-blue-100 text-sm">
                                {freeSamplesCount > 0 ? (
                                    <div className="text-blue-800 font-bold mb-1">
                                        מגיע לך {freeSamplesCount} דוגמיות מתנה! 🎉
                                        <br />
                                        <span className="font-normal text-xs text-blue-600">
                                            (הצוות יבחר אותן בקפידה עבורך)
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-gray-600">
                                        הוסף ב-{nextTier} ₪ כדי לקבל <span className="font-bold">2 דוגמיות מתנה</span>
                                    </div>
                                )}

                                {nextTier > 0 && freeSamplesCount > 0 && freeSamplesCount < 6 && (
                                    <div className="mt-2 text-xs text-gray-500 border-t border-blue-200 pt-2">
                                        עוד {nextTier} ₪ למדרגה הבאה (+2 דוגמיות)
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between text-xl font-bold pt-4 border-t">
                                <span>סה״כ לתשלום</span>
                                <span>{total} ₪</span>
                            </div>

                            <div className="pt-4">
                                {isSignedIn ? (
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isSubmitting}
                                        className="btn btn-primary w-full py-4 text-lg"
                                    >
                                        {isSubmitting ? 'מעבד...' : 'בצע הזמנה'}
                                    </button>
                                ) : (
                                    <SignInButton mode="modal">
                                        <button className="btn btn-primary w-full py-4 text-lg">
                                            התחבר כדי להזמין
                                        </button>
                                    </SignInButton>
                                )}
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    * התשלום מתבצע מול נציג לאחר אישור ההזמנה
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
