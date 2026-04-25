"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Send, Mail, MessageSquare, Ticket, Tag, FlaskConical } from 'lucide-react';

import AutomationDropdown from '../AutomationDropdown';

const actionOptions = [
  { value: "email", label: "שליחת מייל ללקוח" },
  { value: "sms", label: "שליחת SMS ללקוח" },
  { value: "admin_notify", label: "התראה למנהל (מייל/פוץ')" },
  { value: "coupon", label: "יצירת קופון אישי" },
  { value: "tag", label: "הוספת תגית ללקוח" },
  { value: "webhook", label: "שליחת Webhook (חיבור ל-Make/Zapier)" },
  { value: "order_note", label: "הוספת הערה פנימית להזמנה" },
  { value: "custom", label: "אחר / מותאם אישית..." },
];

const icons = {
    email: Mail,
    sms: MessageSquare,
    coupon: Ticket,
    tag: Tag,
    product: FlaskConical,
    default: Box
};

const ActionNode = memo(({ data, isConnectable }) => {
  const Icon = icons[data.actionType] || icons.default;

  return (
    <div className="bg-white border-2 border-blue-500/30 p-4 rounded-3xl min-w-[220px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-blue-500 hover:scale-125 transition-transform -left-2"
      />

      <div className="flex items-center gap-4 flex-row-reverse">
        <div className="bg-blue-500/10 p-2.5 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
          <Icon size={22} />
        </div>
        <div className="flex flex-col flex-1 text-right">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">פעולה (Action)</span>
          <AutomationDropdown 
            value={data.actionType || 'email'}
            onChange={(val) => data.onChange?.(val)}
            options={actionOptions}
          />
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

export default ActionNode;
