"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function OrdersClient() {
    const { addToCart } = useCart();
    const { isLoaded, isSignedIn } = useUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        async function fetchOrders() {
            try {
                const res = await fetch('/api/user/orders');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) return <div className="py-20 text-center">טוען...</div>;

    if (!isSignedIn) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">התחבר כדי לצפות בהזמנות שלך</h1>
                <Link href="/sign-in" className="btn btn-primary">התחברות</Link>
            </div>
        );
    }

    if (loading) return <div className="py-20 text-center">טוען הזמנות...</div>;

    return (
        <div className="container py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">ההזמנות שלי</h1>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-lg text-gray-500 mb-4">עדיין לא ביצעת הזמנות.</p>
                    <Link href="/catalog" className="text-blue-600 underline">התחל לקנות</Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-6 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-4 border-b pb-4">
                                <div>
                                    <div className="font-bold text-lg">הזמנה #{order.id}</div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString('he-IL')} בשעה {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-xl">{order.total_amount} ₪</div>
                                    <div className={`text-sm px-2 py-1 rounded-full inline-block mt-1 ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {
                                            order.status === 'pending' ? 'ממתין' :
                                                order.status === 'processing' ? 'בטיפול' :
                                                    order.status === 'shipped' ? 'נשלח' :
                                                        order.status === 'completed' ? 'הושלם' :
                                                            order.status === 'cancelled' ? 'בוטל' :
                                                                order.status
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 py-4">
                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl">🧴</div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700" dir="ltr">
                                                    {item.size.toString().includes('ml') ? item.size : `${item.size} ml`}
                                                </span>
                                                <span className="text-xs">
                                                    כמות: {item.quantity}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="font-medium text-gray-900 flex flex-col items-end gap-2">
                                            <div>{item.price * item.quantity} ₪</div>
                                            <button
                                                onClick={() => {
                                                    // Add to cart (assuming item has id, name, etc)
                                                    addToCart({
                                                        id: item.id,
                                                        name: item.name,
                                                        image_url: item.image_url,
                                                        // Use old stock or standard default? 
                                                        // We'll trust backend validation at checkout.
                                                        stock: item.stock || 20
                                                    }, item.size, item.price);
                                                    alert('המוצר נוסף לסל בהצלחה! 🛒');
                                                }}
                                                className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition shadow-sm flex items-center gap-1"
                                            >
                                                <span>↻</span> הזמן שוב
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {order.free_samples_count > 0 && (
                                <div className="mt-4 text-sm text-blue-600 font-bold bg-blue-50 p-2 rounded">
                                    🎁 כולל {order.free_samples_count} דוגמיות מתנה
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
