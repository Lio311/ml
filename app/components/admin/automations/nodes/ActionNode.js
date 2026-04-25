"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Send, Mail, MessageSquare, Ticket, Tag, FlaskConical } from 'lucide-react';

const icons = {
    email: Mail,
    sms: MessageSquare,
    coupon: Ticket,
    tag: Tag,
    product: FlaskConical,
    default: Box
};

export default memo(({ data, isConnectable }) => {
  const Icon = icons[data.actionType] || icons.default;

  return (
    <div className="bg-white border-2 border-blue-500/30 p-4 rounded-3xl min-w-[200px] shadow-sm hover:shadow-md transition-all">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white shadow-sm"
      />

      <div className="flex items-center gap-3">
        <div className="bg-blue-500/10 p-2 rounded-2xl text-blue-500">
          <Icon size={24} />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Action</span>
          <select 
            className="text-sm font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none w-full"
            value={data.actionType || 'email'}
            onChange={(e) => data.onChange?.(e.target.value)}
          >
            <option value="email">שליחת מייל</option>
            <option value="sms">שליחת SMS</option>
            <option value="coupon">יצירת קופון</option>
            <option value="tag">הוספת תגית</option>
            <option value="product">המלצת מוצר</option>
            <option value="custom">אחר / מותאם אישית...</option>
          </select>
          {data.actionType === 'custom' && (
            <input 
              type="text"
              placeholder="הכנס פעולה..."
              className="mt-2 text-xs border-b border-gray-200 focus:border-blue-500 outline-none w-full py-1"
              value={data.customAction || ''}
              onChange={(e) => data.onChangeCustom?.(e.target.value)}
            />
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});
