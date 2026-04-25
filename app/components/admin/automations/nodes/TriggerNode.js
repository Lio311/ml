"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-yellow-500/30 p-4 rounded-3xl min-w-[200px] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-500/10 p-2 rounded-2xl text-yellow-500 relative">
          <Zap size={24} fill="currentColor" />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Trigger</span>
          <select 
            className="text-sm font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none w-full"
            value={data.triggerType || 'new_order'}
            onChange={(e) => data.onChange?.(e.target.value)}
          >
            <option value="new_order">הזמנה חדשה</option>
            <option value="order_status_changed">סטטוס הזמנה השתנה</option>
            <option value="new_user">לקוח חדש נרשם</option>
            <option value="abandoned_cart">עגלה נטושה (24 שעות)</option>
            <option value="product_restock">מוצר חזר למלאי</option>
            <option value="product_out_of_stock">מוצר אזל מהמלאי</option>
            <option value="coupon_used">שימוש בקופון</option>
            <option value="custom">אחר / מותאם אישית...</option>
          </select>
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
        className="w-3 h-3 !bg-yellow-500 !border-2 !border-white shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});
