"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, HelpCircle } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-purple-500/30 p-4 rounded-3xl min-w-[200px] shadow-sm hover:shadow-md transition-all">
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
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Logic</span>
          <span className="text-sm font-bold text-gray-900 leading-none">האם סכום {'>'} 500?</span>
        </div>
      </div>

      {/* True Branch (Right side) */}
      <div className="absolute -right-3 top-1/3 flex items-center flex-row-reverse gap-1 group">
          <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">TRUE</span>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            isConnectable={isConnectable}
            className="!static w-3 h-3 !bg-green-500 !border-2 !border-white shadow-sm hover:scale-125 transition-transform"
          />
      </div>

      {/* False Branch (Right side) */}
      <div className="absolute -right-3 bottom-1/3 flex items-center flex-row-reverse gap-1 group">
          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">FALSE</span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            isConnectable={isConnectable}
            className="!static w-3 h-3 !bg-red-500 !border-2 !border-white shadow-sm hover:scale-125 transition-transform"
          />
      </div>
    </div>
  );
});
