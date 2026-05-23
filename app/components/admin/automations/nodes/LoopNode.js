"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { RefreshCw } from 'lucide-react';
import AutomationDropdown from '../AutomationDropdown';

const loopOptions = [
  { value: "items", label: "פריטים בהזמנה" },
  { value: "categories", label: "קטגוריות מוצרים" },
  { value: "last_orders", label: "הזמנות אחרונות" },
];

const LoopNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-indigo-400/30 p-5 rounded-[2rem] min-w-[220px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white shadow-sm -left-1.5"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-indigo-400/10 p-3 rounded-2xl text-indigo-500 group-hover:rotate-180 transition-transform duration-700">
          <RefreshCw size={24} />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">לולאה (Loop)</span>
          
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">רוץ על רשימת:</label>
            <AutomationDropdown 
              value={data.loopOver || 'items'}
              onChange={(val) => data.onChangeParams?.('loopOver', val)}
              options={loopOptions}
            />
          </div>
        </div>
      </div>

      {/* Output (For each item) */}
      <div className="absolute -right-2 top-[50%] flex items-center translate-x-full pr-2">
        <Handle
          type="source"
          position={Position.Right}
          id="item"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#818cf8', width: '14px', height: '14px', border: '3px solid white' }}
          className="hover:scale-125 transition-transform"
        />
        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 ml-2 whitespace-nowrap">עבור כל פריט</span>
      </div>
    </div>
  );
});

export default LoopNode;

LoopNode.displayName = 'LoopNode';
