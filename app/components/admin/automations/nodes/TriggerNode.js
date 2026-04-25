"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-yellow-500/30 p-4 rounded-3xl min-w-[200px] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-500/10 p-2 rounded-2xl text-yellow-500 relative">
          <Zap size={24} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Trigger</span>
          <span className="text-sm font-bold text-gray-900 leading-none">הזמנה חדשה</span>
        </div>
      </div>

      {/* Output Connection Point (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-yellow-500 !border-2 !border-white shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});
