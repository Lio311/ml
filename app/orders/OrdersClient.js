"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import { MapPin, Package, Gift, RefreshCw, MessageSquare, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import OrderReviewPrompt from '../components/OrderReviewPrompt';
import { useLanguage } from '../context/LanguageContext';
import Image from 'next/image';

export default function OrdersClient() {
    const { t, locale } = useLanguage();
    const { addToCart } = useCart();
    const { isLoaded, isSignedIn } = useUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openReviewId, setOpenReviewId] = useState(null);

    const toggleReview = (orderId) => {
        setOpenReviewId(prev => prev === orderId ? null : orderId);
    };

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

        async function fetchUnreadCount() {
            try {
                const res = await fetch('/api/inbox/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.count);
                }
            } catch (error) {
                console.error("Failed to fetch unread count", error);
            }
        }

        fetchOrders();
        fetchUnreadCount();
        
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) return <div className="py-20 text-center">{t('orders.loading')}</div>;

    if (!isSignedIn) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">{t('orders.login_prompt')}</h1>
                <Link href="/sign-in" className="btn btn-primary">{t('orders.login_btn')}</Link>
            </div>
        );
    }

    if (loading) return <div className="py-20 text-center">{t('orders.loading_orders')}</div>;

    return (
        <div className="container py-12 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
                <Link href="/inbox" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition relative" title={t('orders.inbox_title')}>
                    <MessageSquare className="w-6 h-6 text-gray-700" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-lg text-gray-500 mb-4">{t('orders.no_orders')}</p>
                    <Link href="/catalog" className="text-blue-600 underline">{t('orders.start_shopping')}</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-6 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2 border-b pb-4">
                                <div>
                                    <div className="font-bold text-lg flex items-center gap-2">
                                        {t('orders.order_number').replace('{id}', order.id)}
                                        {order.catalog_id && (
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded border border-yellow-200" title={t('orders.external_supplier_desc')}>
                                                {t('orders.external_supplier')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <span>
                                            {locale === 'he' ? (
                                                `${new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')} | ${new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                                            ) : (
                                                `${new Date(order.created_at).toLocaleDateString('en-US')} at ${new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                                            )}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        {order.delivery_method === 'self_pickup' ? (
                                            <span className="text-black font-bold flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-pink-500" /> {t('orders.self_pickup')}
                                            </span>
                                        ) : (
                                            <span className="text-black font-bold flex items-center gap-1.5">
                                                <Package className="w-4 h-4 text-blue-500" /> {t('orders.shipping')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="font-bold text-xl">{order.total_amount} ₪</div>
                                    {(order.status === 'completed' || order.status === 'הושלם') && !order.has_review && (
                                        <button 
                                            onClick={() => toggleReview(order.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm border ${
                                                openReviewId === order.id 
                                                ? 'bg-black text-white border-black' 
                                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                            }`}
                                            title={t('common.orders.review.write_review')}
                                        >
                                            <Star className={`w-4 h-4 ${openReviewId === order.id ? 'fill-white' : 'fill-amber-500 text-amber-500'}`} />
                                            {t('common.orders.review.write_review')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <OrderStatusTimeline status={order.status} />

                            {(order.status === 'completed' || order.status === 'הושלם') && openReviewId === order.id && (
                                <div className="mt-4 animate-fadeIn">
                                    <OrderReviewPrompt 
                                        orderId={order.id} 
                                        initialHasSubmitted={order.has_review} 
                                    />
                                </div>
                            )}

                            <div className="divide-y">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 py-2">
                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border relative">
                                            {item.image_url ? (
                                                <Image src={item.image_url} alt={(item.name || (item.brand + ' ' + item.model)) || "Product"} fill sizes="64px" className="object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl">🧴</div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">{item.name || (item.brand + ' ' + item.model)}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700" dir="ltr">
                                                    {item.size.toString().includes('ml') ? item.size : `${item.size} ml`}
                                                </span>
                                                <span className="text-xs">
                                                    {t('orders.quantity')}: {item.quantity}
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
                                                        name: item.name || (item.brand + ' ' + item.model),
                                                        image_url: item.image_url,
                                                        // Use old stock or standard default? 
                                                        // We'll trust backend validation at checkout.
                                                        stock: item.stock || 20
                                                    }, item.size, item.price);
                                                    toast.success(t('orders.added_to_cart'));
                                                }}
                                                className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition shadow-sm flex items-center gap-1.5 w-full justify-center"
                                            >
                                                {t('orders.order_again')} <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                            
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <Link href={`/inbox?order_id=${order.id}${order.catalog_id ? `&catalog_id=${order.catalog_id}` : ''}`} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {t('orders.order_inquiry')}
                                </Link>
                                
                                {order.free_samples_count > 0 && (
                                    <div className="text-sm text-black flex items-center gap-2 font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <Gift className="w-4 h-4 text-amber-500" />
                                        {t('orders.includes_samples').replace('{count}', order.free_samples_count)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
