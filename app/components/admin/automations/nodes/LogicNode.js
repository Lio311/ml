"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, HelpCircle } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-[#0a0a0a] border-2 border-purple-500/50 p-4 rounded-3xl min-w-[200px] shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all">
      <Handle
        type="target"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-[#050505] shadow-[0_0_10px_#a855f7]"
      />

      <div className="flex items-center gap-3">
        <div className="bg-purple-500/10 p-2 rounded-2xl text-purple-500">
          <GitBranch size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Logic</span>
          <span className="text-sm font-bold text-white leading-none">האם סכום {'>'} 500?</span>
        </div>
        <HelpCircle size={14} className="mr-auto text-gray-600 cursor-help" />
      </div>

      {/* True Branch */}
      <div className="absolute -left-3 top-1/3 flex items-center gap-1 group">
          <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">TRUE</span>
          <Handle
            type="source"
            position={Position.Left}
            id="true"
            isConnectable={isConnectable}
            className="!static w-3 h-3 !bg-green-500 !border-2 !border-[#050505] shadow-[0_0_10px_#22c55e] hover:scale-125 transition-transform"
          />
      </div>

      {/* False Branch */}
      <div className="absolute -left-3 bottom-1/3 flex items-center gap-1 group">
          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">FALSE</span>
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            isConnectable={isConnectable}
            className="!static w-3 h-3 !bg-red-500 !border-2 !border-[#050505] shadow-[0_0_10px_#ef4444] hover:scale-125 transition-transform"
          />
      </div>
    </div>
  );
});
