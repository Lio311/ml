"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, HelpCircle } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-purple-500/30 p-4 rounded-3xl min-w-[200px] shadow-sm hover:shadow-md transition-all">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-white shadow-sm"
      />

      <div className="flex items-center gap-3">
        <div className="bg-purple-500/10 p-2 rounded-2xl text-purple-500">
          <GitBranch size={24} />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Logic</span>
          <select 
            className="text-sm font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none w-full"
            value={data.logicType || 'amount_gt_500'}
            onChange={(e) => data.onChange?.(e.target.value)}
          >
            <option value="amount_gt_500">האם סכום {'>'} 500?</option>
            <option value="is_new_customer">האם לקוח חדש?</option>
            <option value="has_coupon">האם השתמש בקופון?</option>
            <option value="location_tlv">האם מאזור ת"א?</option>
            <option value="custom">אחר / מותאם אישית...</option>
          </select>
          {data.logicType === 'custom' && (
            <input 
              type="text"
              placeholder="הכנס לוגיקה..."
              className="mt-2 text-xs border-b border-gray-200 focus:border-purple-500 outline-none w-full py-1"
              value={data.customLogic || ''}
              onChange={(e) => data.onChangeCustom?.(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* True Branch Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={isConnectable}
        style={{ top: '30%', backgroundColor: '#22c55e' }}
        className="!w-4 !h-4 !border-2 !border-white shadow-sm"
      />
      <div className="absolute right-2 top-[30%] -translate-y-1/2">
        <span className="text-[8px] font-bold text-green-600">TRUE</span>
      </div>

      {/* False Branch Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        isConnectable={isConnectable}
        style={{ top: '70%', backgroundColor: '#ef4444' }}
        className="!w-4 !h-4 !border-2 !border-white shadow-sm"
      />
      <div className="absolute right-2 top-[70%] -translate-y-1/2">
        <span className="text-[8px] font-bold text-red-600">FALSE</span>
      </div>
    </div>
  );
});
