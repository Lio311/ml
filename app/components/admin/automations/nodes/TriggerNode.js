"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-[#0a0a0a] border-2 border-yellow-500/50 p-4 rounded-3xl min-w-[200px] shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-500/10 p-2 rounded-2xl text-yellow-500 relative">
          <Zap size={24} fill="currentColor" className="animate-pulse" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping opacity-75" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Trigger</span>
          <span className="text-sm font-bold text-white leading-none">הזמנה חדשה</span>
        </div>
      </div>

      {/* Output Connection Point */}
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-yellow-500 !border-4 !border-[#050505] shadow-[0_0_10px_#eab308] hover:scale-125 transition-transform"
      />
    </div>
  );
});
