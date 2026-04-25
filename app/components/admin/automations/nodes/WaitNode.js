"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Clock } from 'lucide-react';
import AutomationDropdown from '../AutomationDropdown';

const durationOptions = [
  { value: "minutes", label: "דקות" },
  { value: "hours", label: "שעות" },
  { value: "days", label: "ימים" },
  { value: "weeks", label: "שבועות" },
];

const WaitNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-orange-400/30 p-5 rounded-[2rem] min-w-[220px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-white shadow-sm -left-1.5"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-orange-400/10 p-3 rounded-2xl text-orange-500 group-hover:rotate-12 transition-transform">
          <Clock size={24} />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">המתנה (Wait)</span>
          
          <div className="flex gap-2 items-center">
            <input 
              type="number"
              placeholder="0"
              className="w-16 text-[11px] font-bold border-b border-gray-100 focus:border-orange-400 outline-none py-1 text-center"
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

      {/* Output */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-orange-400 hover:scale-125 transition-transform cursor-crosshair -right-2"
      />
    </div>
  );
});

export default WaitNode;
