"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import AutomationDropdown from '../AutomationDropdown';

const triggerOptions = [
  { value: "new_order", label: "הזמנה חדשה" },
  { value: "order_status_changed", label: "סטטוס הזמנה השתנה" },
  { value: "new_user", label: "לקוח חדש נרשם" },
  { value: "abandoned_cart", label: "עגלה נטושה (24 שעות)" },
  { value: "product_restock", label: "מוצר חזר למלאי" },
  { value: "product_out_of_stock", label: "מוצר אזל מהמלאי" },
  { value: "coupon_used", label: "שימוש בקופון" },
  { value: "contact_form", label: "טופס צור קשר נשלח" },
  { value: "review_submitted", label: "לקוח פרסם ביקורת" },
];

const statusOptions = [
  { value: "pending", label: "ממתין לתשלום" },
  { value: "processing", label: "בטיפול" },
  { value: "on-hold", label: "בהמתנה" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
  { value: "refunded", label: "זוכה" },
  { value: "failed", label: "נכשל" },
  { value: "ready-for-pickup", label: "מוכן לאיסוף" },
  { value: "shipped", label: "נשלח" },
];

const TriggerNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-yellow-500/30 p-5 rounded-[2rem] min-w-[220px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-yellow-500/10 p-3 rounded-2xl text-yellow-500 group-hover:scale-110 transition-transform">
          <Zap size={24} fill="currentColor" />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">גורם (Trigger)</span>
          <AutomationDropdown 
            value={data.triggerType || 'new_order'}
            onChange={(val) => data.onChange?.(val)}
            options={triggerOptions}
          />
          {data.triggerType === 'order_status_changed' && (
            <div className="mt-3 w-full">
              <AutomationDropdown 
                value={data.customTrigger || 'completed'}
                onChange={(val) => data.onChangeCustom?.(val)}
                options={statusOptions}
                placeholder="בחר סטטוס..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Output Connection Point (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-yellow-500 hover:scale-125 transition-transform cursor-crosshair -right-2"
      />
    </div>
  );
});

export default TriggerNode;
