import pool from '@/app/lib/db';
import { verifyReviewToken } from '@/app/lib/reviewToken';
import OrderStatusTimeline from '@/app/components/OrderStatusTimeline';
import OrderReviewPrompt from '@/app/components/OrderReviewPrompt';
import Image from 'next/image';
import { Package, MapPin, XCircle } from 'lucide-react';
import Link from 'next/link';
import { auth as clerkAuth } from '@clerk/nextjs/server';

export const metadata = {
    title: 'דירוג הזמנה - ml_tlv',
    description: 'דירוג הזמנה מהיר',
};

export default async function PublicReviewPage(props) {
    const searchParams = await props.searchParams;
    const { id, token } = searchParams;

    if (!id || !token) {
        return <InvalidTokenMessage message="קישור שגוי או חסר פרטים. אנא לחץ על הקישור המדויק שנשלח במייל." />;
    }

    const verifiedOrderId = verifyReviewToken(token);

    if (!verifiedOrderId || String(verifiedOrderId) !== String(id)) {
        return <InvalidTokenMessage message="הקישור שלך לדירוג פג תוקף (תקף ל-7 ימים) או שאינו תקין. ניתן לדרג את ההזמנה דרך האזור האישי שלך באתר." />;
    }

    try {
        const client = await pool.connect();
        try {
            const res = await client.query(
                `SELECT * FROM orders WHERE id = $1`,
                [id]
            );

            if (res.rows.length === 0) {
                return <InvalidTokenMessage message="הזמנה לא נמצאה." />;
            }

            const order = res.rows[0];

            return (
                <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
                    <div className="w-full max-w-2xl">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">דירוג קנייה ⭐️</h1>
                            <p className="text-gray-600">שמחים שחזרת לשתף אותנו בחוות דעתך.</p>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                            <div className="p-4 md:p-6 pb-2">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg">הזמנה #{(order.order_number || order.id).toString().slice(-6)}</h3>
                                            {order.is_external_supplier && (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded border border-yellow-200">
                                                    ספק חיצוני
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <span>
                                                {`${new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')} | ${new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            {order.delivery_method === 'self_pickup' ? (
                                                <span className="text-black font-bold flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-pink-500" /> איסוף עצמי
                                                </span>
                                            ) : (
                                                <span className="text-black font-bold flex items-center gap-1.5">
                                                    <Package className="w-4 h-4 text-blue-500" /> משלוח
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="font-bold text-2xl">{order.total_amount} ₪</div>
                                    </div>
                                </div>
                                <OrderStatusTimeline status={order.status} />
                                
                                {order.has_review ? (
                                    <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-bold border border-green-200">
                                        תודה! כבר דירגת את ההזמנה הזו בעבר.
                                    </div>
                                ) : (
                                    <OrderReviewPrompt 
                                        orderId={order.id} 
                                        initialHasSubmitted={order.has_review} 
                                        reviewToken={token}
                                    />
                                )}
                                
                                <div className="divide-y mt-2">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 py-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border relative">
                                                {item.image_url ? (
                                                    <Image src={item.image_url} alt={(item.name || (item.brand + ' ' + item.model)) || "Product"} fill sizes="64px" className="object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl">🧴</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 leading-tight">{item.name || (item.brand + ' ' + item.model)}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-3 mt-1.5">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-xs text-gray-700" dir="ltr">
                                                        {item.size.toString().includes('ml') ? item.size : `${item.size} ml`}
                                                    </span>
                                                    <span className="text-xs">
                                                        כמות: {item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="font-bold text-gray-900">{item.price} ₪</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-sm text-gray-500">
                            <Link href="/" className="hover:text-black hover:underline transition-colors">
                                חזרה לעמוד הבית &gt;&gt;
                            </Link>
                        </div>
                    </div>
                </main>
            );
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Error loading public review page:", e);
        return <InvalidTokenMessage message="שגיאת מערכת. אנא נסה שוב מאוחר יותר." />;
    }
}

function InvalidTokenMessage({ message }) {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">אופס!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex flex-col gap-3">
                    <Link href="/orders" className="bg-black text-white rounded-xl py-3 px-4 font-bold hover:bg-gray-800 transition-colors">
                        מעבר לאזור האישי
                    </Link>
                    <Link href="/" className="text-gray-500 hover:text-black font-medium transition-colors">
                        חזרה לדף הבית
                    </Link>
                </div>
            </div>
        </main>
    );
}
