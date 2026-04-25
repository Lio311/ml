"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, HelpCircle } from 'lucide-react';

import AutomationDropdown from '../AutomationDropdown';

const fieldOptions = [
  { value: "total_amount", label: "סכום הזמנה" },
  { value: "items_count", label: "כמות פריטים" },
  { value: "customer_city", label: "עיר לקוח" },
  { value: "coupon_code", label: "קוד קופון" },
  { value: "customer_orders", label: "מספר הזמנות קודמות" },
  { value: "shipping_method", label: "שיטת משלוח" },
  { value: "product_category", label: "קטגוריית מוצר" },
  { value: "order_weight", label: "משקל חבילה" },
  { value: "custom", label: "אחר (טקסט חופשי)" },
];

const operatorOptions = [
  { value: "gt", label: "גדול מ- ( > )" },
  { value: "lt", label: "קטן מ- ( < )" },
  { value: "gte", label: "גדול או שווה ( >= )" },
  { value: "lte", label: "קטן או שווה ( <= )" },
  { value: "eq", label: "שווה בדיוק ל- ( = )" },
  { value: "neq", label: "לא שווה ל- ( != )" },
  { value: "contains", label: "מכיל את הטקסט" },
  { value: "not_contains", label: "לא מכיל את הטקסט" },
  { value: "starts_with", label: "מתחיל ב-" },
  { value: "ends_with", label: "מסתיים ב-" },
];

const LogicNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-purple-500/30 p-5 rounded-[2rem] min-w-[260px] shadow-xl hover:shadow-2xl transition-all relative group" dir="rtl">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-4 !h-4 !bg-purple-500 !border-4 !border-white shadow-md -left-2"
      />

      <div className="flex flex-col gap-5 text-center">
        <div className="flex flex-col items-center gap-3 border-b border-gray-100 pb-4">
          <div className="bg-purple-500 text-white p-3 rounded-2xl shadow-lg shadow-purple-100 group-hover:scale-110 transition-transform">
            <GitBranch size={24} />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none block mb-1">תנאי (Condition)</span>
            <h4 className="text-sm font-bold text-gray-900 leading-none mt-1">לוגיקת התניה</h4>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Field Select */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">שדה לבדיקה</label>
            <AutomationDropdown 
              value={data.logicField || 'total_amount'}
              onChange={(val) => data.onChangeLogic?.('logicField', val)}
              options={fieldOptions}
            />
          </div>

          {/* Operator Select */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">פעולת תנאי</label>
            <AutomationDropdown 
              value={data.logicOperator || 'gt'}
              onChange={(val) => data.onChangeLogic?.('logicOperator', val)}
              options={operatorOptions}
            />
          </div>

          {/* Value Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">ערך להשוואה</label>
            <input 
              type="text"
              placeholder="הכנס ערך לבדיקה..."
              className="w-full text-[11px] font-medium border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-center"
              value={data.logicValue || ''}
              onChange={(e) => data.onChangeLogic?.('logicValue', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* True Branch Handle */}
      <div className="absolute -right-2 top-[30%] flex items-center">
        <span className="text-[9px] font-black text-green-600 ml-2 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">TRUE</span>
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#22c55e', width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          className="hover:scale-125 transition-transform cursor-crosshair"
        />
      </div>

      {/* False Branch Handle */}
      <div className="absolute -right-2 top-[70%] flex items-center">
        <span className="text-[9px] font-black text-red-600 ml-2 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">FALSE</span>
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#ef4444', width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          className="hover:scale-125 transition-transform cursor-crosshair"
        />
      </div>
    </div>
  );
});

export default LogicNode;
