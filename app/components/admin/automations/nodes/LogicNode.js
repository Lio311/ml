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
        <div className="flex flex-col flex-1 gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Logic Builder</span>
          
          <div className="flex flex-col gap-1">
            {/* Field Select */}
            <select 
              className="text-[11px] font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded p-1 outline-none"
              value={data.logicField || 'total_amount'}
              onChange={(e) => data.onChangeLogic?.('logicField', e.target.value)}
            >
              <option value="total_amount">סכום הזמנה</option>
              <option value="items_count">כמות פריטים</option>
              <option value="customer_city">עיר לקוח</option>
              <option value="coupon_code">קוד קופון</option>
              <option value="customer_orders">מספר הזמנות קודמות</option>
              <option value="shipping_method">שיטת משלוח</option>
            </select>

            {/* Operator Select */}
            <select 
              className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded p-1 outline-none"
              value={data.logicOperator || 'gt'}
              onChange={(e) => data.onChangeLogic?.('logicOperator', e.target.value)}
            >
              <option value="gt">גדול מ- ( {'>'} )</option>
              <option value="lt">קטן מ- ( {'<'} )</option>
              <option value="eq">שווה ל- ( = )</option>
              <option value="contains">מכיל את הטקסט</option>
              <option value="not_contains">לא מכיל את הטקסט</option>
            </select>

            {/* Value Input */}
            <input 
              type="text"
              placeholder="ערך..."
              className="text-[11px] border border-gray-200 rounded p-1 outline-none focus:border-purple-500"
              value={data.logicValue || ''}
              onChange={(e) => data.onChangeLogic?.('logicValue', e.target.value)}
            />
          </div>
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
