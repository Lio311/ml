"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitMerge } from 'lucide-react';

const SplitNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-cyan-400/30 p-5 rounded-[2rem] min-w-[200px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white shadow-sm -left-1.5"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-cyan-400/10 p-3 rounded-2xl text-cyan-500 group-hover:scale-110 transition-transform">
          <GitMerge size={24} className="rotate-180" />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">פיצול (Split)</span>
          <h4 className="text-xs font-bold text-gray-900 mt-1">הרצה במקביל</h4>
          <p className="text-[9px] text-gray-400 mt-2 font-medium">המשך לכל הנתיבים בו זמנית</p>
        </div>
      </div>

      {/* Multiple Outputs */}
      <div className="absolute -right-2 top-[30%]">
        <Handle
          type="source"
          position={Position.Right}
          id="path1"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#22d3ee', width: '12px', height: '12px', border: '2px solid white' }}
          className="hover:scale-125 transition-transform"
        />
      </div>
      <div className="absolute -right-2 top-[50%]">
        <Handle
          type="source"
          position={Position.Right}
          id="path2"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#22d3ee', width: '12px', height: '12px', border: '2px solid white' }}
          className="hover:scale-125 transition-transform"
        />
      </div>
      <div className="absolute -right-2 top-[70%]">
        <Handle
          type="source"
          position={Position.Right}
          id="path3"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#22d3ee', width: '12px', height: '12px', border: '2px solid white' }}
          className="hover:scale-125 transition-transform"
        />
      </div>
    </div>
  );
});

export default SplitNode;
