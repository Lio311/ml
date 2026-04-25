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
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-blue-500 hover:scale-125 transition-transform -left-2"
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
            <option value="email">שליחת מייל ללקוח</option>
            <option value="sms">שליחת SMS ללקוח</option>
            <option value="admin_notify">התראה למנהל (מייל/פוץ')</option>
            <option value="coupon">יצירת קופון אישי</option>
            <option value="tag">הוספת תגית ללקוח</option>
            <option value="webhook">שליחת Webhook (חיבור ל-Make/Zapier)</option>
            <option value="order_note">הוספת הערה פנימית להזמנה</option>
            <option value="custom">אחר / מותאם אישית...</option>
          </select>
          {(data.actionType === 'custom' || data.actionType === 'tag' || data.actionType === 'order_note') && (
            <input 
              type="text"
              placeholder="הכנס פרטים..."
              className="mt-2 text-[11px] border-b border-gray-200 focus:border-blue-500 outline-none w-full py-1"
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
        style={{ width: '16px', height: '16px', border: '4px solid white', boxShadow: '0 0 0 1px #3b82f6' }}
        className="!bg-blue-500 hover:scale-125 transition-transform cursor-crosshair -right-2"
      />
    </div>
  );
});
