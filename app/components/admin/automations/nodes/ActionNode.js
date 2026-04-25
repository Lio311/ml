"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Send, Mail, MessageSquare, Ticket, RefreshCw } from 'lucide-react';

import AutomationDropdown from '../AutomationDropdown';

const actionOptions = [
  { value: "email", label: "שליחת מייל ללקוח" },
  { value: "admin_notify", label: "התראה למנהל (מייל/פוץ')" },
  { value: "coupon", label: "יצירת קופון אישי" },
  { value: "change_status", label: "שנה סטטוס הזמנה" },
  { value: "order_note", label: "הוספת הערה פנימית להזמנה" },
];

const icons = {
    email: Mail,
    admin_notify: Send,
    coupon: Ticket,
    change_status: RefreshCw,
    order_note: MessageSquare,
    default: Box
};

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

const ActionNode = memo(({ data, isConnectable }) => {
  const Icon = icons[data.actionType] || icons.default;

  return (
    <div className="bg-white border-2 border-blue-500/30 p-5 rounded-[2rem] min-w-[220px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-blue-500 hover:scale-125 transition-transform -left-2"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">פעולה (Action)</span>
          <AutomationDropdown 
            value={data.actionType || 'email'}
            onChange={(val) => data.onChange?.(val)}
            options={actionOptions}
          />
          {data.actionType === 'change_status' && (
            <div className="mt-3">
               <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">בחר סטטוס יעד:</label>
               <AutomationDropdown 
                 value={data.targetStatus || 'processing'}
                 onChange={(val) => data.onChangeParams?.('targetStatus', val)}
                 options={statusOptions}
               />
            </div>
          )}

          {data.actionType === 'order_note' && (
            <input 
              type="text"
              placeholder="הכנס פרטים..."
              className="mt-3 text-[11px] border-b border-gray-200 focus:border-blue-500 outline-none w-full py-1 text-center"
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
