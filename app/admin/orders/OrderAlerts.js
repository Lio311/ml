"use client";

import { useEffect, useState } from 'react';

export default function OrderAlerts({ order }) {
    const [orangeAlert, setOrangeAlert] = useState(null);

    // Red Alert: Duplicate products in the same order
    const validIds = order.items?.map(i => i.product_id || i.id).filter(id => id && !String(id).startsWith('bundle-')) || [];
    const uniqueIds = new Set(validIds);
    const hasRedAlert = uniqueIds.size !== validIds.length;

    useEffect(() => {
        const checkHistory = async () => {
            if (!order.customer_details?.email && !order.customer_details?.phone) return;
            try {
                const res = await fetch('/api/admin/orders/check-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: order.customer_details?.email,
                        phone: order.customer_details?.phone,
                        items: order.items,
                        currentOrderId: order.id
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.hasDuplicates) {
                        setOrangeAlert(data.duplicateNames.join(', '));
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkHistory();
    }, [order]);

    if (!hasRedAlert && !orangeAlert) return null;

    return (
        <div className="flex flex-col gap-1 mt-2">
            {hasRedAlert && (
                <div className="text-[10px] bg-red-50 text-red-700 p-1.5 rounded border border-red-200 font-bold flex items-center gap-1 w-fit ml-auto mr-0">
                    <span className="text-red-500">🔴</span>
                    <span>ייתכן ובוצעה טעות בהזמנה (כפילות מוצרים)</span>
                </div>
            )}
            {orangeAlert && (
                <div className="text-[10px] bg-orange-50 text-orange-700 p-1.5 rounded border border-orange-200 font-bold flex flex-col items-start gap-0.5 w-fit ml-auto mr-0 text-right">
                    <div className="flex items-center gap-1">
                        <span className="text-orange-500">🟠</span>
                        <span>בושם זה כבר הוזמן בעבר על ידי הלקוח:</span>
                    </div>
                    <span className="font-normal text-right">{orangeAlert}</span>
                </div>
            )}
        </div>
    );
}
