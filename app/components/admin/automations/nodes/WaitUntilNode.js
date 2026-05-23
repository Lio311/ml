"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Timer } from 'lucide-react';
import AutomationDropdown from '../AutomationDropdown';

const eventOptions = [
  { value: "email_opened", label: "פתיחת מייל" },
  { value: "link_clicked", label: "קליק על קישור" },
  { value: "order_placed", label: "ביצוע הזמנה" },
  { value: "product_viewed", label: "צפייה במוצר" },
];

const durationOptions = [
  { value: "hours", label: "שעות" },
  { value: "days", label: "ימים" },
  { value: "weeks", label: "שבועות" },
];

const WaitUntilNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-red-400/30 p-5 rounded-[2rem] min-w-[240px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-white shadow-sm -left-1.5"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-red-400/10 p-3 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
          <Timer size={24} />
        </div>
        <div className="flex flex-col flex-1 w-full space-y-3">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">המתנה עד ל...</span>
          
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">המתן לאירוע</label>
            <AutomationDropdown 
              value={data.eventName || 'email_opened'}
              onChange={(val) => data.onChangeParams?.('eventName', val)}
              options={eventOptions}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">זמן המתנה מקסימלי</label>
            <div className="flex gap-2 items-center">
              <input 
                type="number"
                placeholder="3"
                className="w-16 text-[11px] font-bold border-b border-gray-100 focus:border-red-400 outline-none py-1 text-center"
                value={data.waitValue || ''}
                onChange={(e) => data.onChangeParams?.('waitValue', e.target.value)}
              />
              <div className="flex-1">
                <AutomationDropdown 
                  value={data.waitUnit || 'days'}
                  onChange={(val) => data.onChangeParams?.('waitUnit', val)}
                  options={durationOptions}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Output True (Event Happened) */}
      <div className="absolute -right-2 top-[30%] flex items-center translate-x-full pr-2">
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#22c55e', width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          className="hover:scale-125 transition-transform cursor-crosshair"
        />
        <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 ml-2">קרה</span>
      </div>

      {/* Output False (Timeout) */}
      <div className="absolute -right-2 top-[70%] flex items-center translate-x-full pr-2">
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#ef4444', width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          className="hover:scale-125 transition-transform cursor-crosshair"
        />
        <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 ml-2">עבר הזמן</span>
      </div>
    </div>
  );
});

export default WaitUntilNode;

WaitUntilNode.displayName = 'WaitUntilNode';
