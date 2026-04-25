"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import AutomationDropdown from '../AutomationDropdown';

const triggerOptions = [
  { value: "new_order", label: "הזמנה חדשה" },
  { value: "order_status_changed", label: "סטטוס הזמנה השתנה" },
  { value: "new_user", label: "לקוח חדש נרשם" },
  { value: "abandoned_cart", label: "עגלה נטושה (24 שעות)" },
  { value: "product_restock", label: "מוצר חזר למלאי" },
  { value: "product_out_of_stock", label: "מוצר אזל מהמלאי" },
  { value: "coupon_used", label: "שימוש בקופון" },
  { value: "custom", label: "אחר / מותאם אישית..." },
];

const TriggerNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-yellow-500/30 p-4 rounded-3xl min-w-[220px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      <div className="flex items-center gap-4 flex-row-reverse">
        <div className="bg-yellow-500/10 p-2.5 rounded-2xl text-yellow-500 group-hover:scale-110 transition-transform">
          <Zap size={22} fill="currentColor" />
        </div>
        <div className="flex flex-col flex-1 text-right">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">גורם (Trigger)</span>
          <AutomationDropdown 
            value={data.triggerType || 'new_order'}
            onChange={(val) => data.onChange?.(val)}
            options={triggerOptions}
          />
          {(data.triggerType === 'custom' || data.triggerType === 'order_status_changed') && (
            <input 
              type="text"
              placeholder={data.triggerType === 'order_status_changed' ? "הכנס סטטוס..." : "הכנס טריגר..."}
              className="mt-2 text-[11px] border-b border-gray-200 focus:border-yellow-500 outline-none w-full py-1"
              value={data.customTrigger || ''}
              onChange={(e) => data.onChangeCustom?.(e.target.value)}
            />
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
