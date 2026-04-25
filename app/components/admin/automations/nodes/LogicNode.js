"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, HelpCircle } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-purple-500 p-5 rounded-[2rem] min-w-[240px] shadow-xl hover:shadow-2xl transition-all relative">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-4 !h-4 !bg-purple-500 !border-4 !border-white shadow-md -left-2"
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="bg-purple-500 text-white p-2 rounded-xl shadow-lg shadow-purple-100">
            <GitBranch size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Condition</span>
            <h4 className="text-sm font-bold text-gray-900 leading-none mt-0.5">לוגיקת התניה</h4>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Field Select */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">שדה לבדיקה</label>
            <select 
              className="w-full text-[11px] font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl p-2 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
              value={data.logicField || 'total_amount'}
              onChange={(e) => data.onChangeLogic?.('logicField', e.target.value)}
            >
              <option value="total_amount">סכום הזמנה</option>
              <option value="items_count">כמות פריטים</option>
              <option value="customer_city">עיר לקוח</option>
              <option value="coupon_code">קוד קופון</option>
              <option value="customer_orders">מספר הזמנות קודמות</option>
              <option value="shipping_method">שיטת משלוח</option>
              <option value="product_category">קטגוריית מוצר</option>
              <option value="order_weight">משקל חבילה</option>
              <option value="custom">אחר (טקסט חופשי)</option>
            </select>
          </div>

          {/* Operator Select */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">תנאי</label>
            <select 
              className="w-full text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-xl p-2 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
              value={data.logicOperator || 'gt'}
              onChange={(e) => data.onChangeLogic?.('logicOperator', e.target.value)}
            >
              <option value="gt">גדול מ- ( &gt; )</option>
              <option value="lt">קטן מ- ( &lt; )</option>
              <option value="gte">גדול או שווה ( &gt;= )</option>
              <option value="lte">קטן או שווה ( &lt;= )</option>
              <option value="eq">שווה בדיוק ל- ( = )</option>
              <option value="neq">לא שווה ל- ( != )</option>
              <option value="contains">מכיל את הטקסט</option>
              <option value="not_contains">לא מכיל את הטקסט</option>
              <option value="starts_with">מתחיל ב-</option>
              <option value="ends_with">מסתיים ב-</option>
            </select>
          </div>

          {/* Value Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">ערך להשוואה</label>
            <input 
              type="text"
              placeholder="הכנס ערך לבדיקה..."
              className="w-full text-[11px] font-medium border border-gray-200 rounded-xl p-2 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
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
