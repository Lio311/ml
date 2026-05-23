"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitPullRequest } from 'lucide-react';

const MergeNode = memo(({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-teal-400/30 p-5 rounded-[2rem] min-w-[200px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      {/* Multiple Inputs */}
      <div className="absolute -left-2 top-[30%]">
        <Handle
          type="target"
          position={Position.Left}
          id="in1"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#2dd4bf', width: '12px', height: '12px', border: '2px solid white' }}
          className="hover:scale-125 transition-transform"
        />
      </div>
      <div className="absolute -left-2 top-[50%]">
        <Handle
          type="target"
          position={Position.Left}
          id="in2"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#2dd4bf', width: '12px', height: '12px', border: '2px solid white' }}
          className="hover:scale-125 transition-transform"
        />
      </div>
      <div className="absolute -left-2 top-[70%]">
        <Handle
          type="target"
          position={Position.Left}
          id="in3"
          isConnectable={isConnectable}
          style={{ backgroundColor: '#2dd4bf', width: '12px', height: '12px', border: '2px solid white' }}
          className="hover:scale-125 transition-transform"
        />
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-teal-400/10 p-3 rounded-2xl text-teal-500 group-hover:scale-110 transition-transform">
          <GitPullRequest size={24} />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">איחוד (Merge)</span>
          <h4 className="text-xs font-bold text-gray-900 mt-1">חיבור נתיבים</h4>
          <p className="text-[9px] text-gray-400 mt-2 font-medium">איסוף מסלולים להמשך אחד</p>
        </div>
      </div>

      {/* Single Output */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-teal-400 hover:scale-125 transition-transform cursor-crosshair -right-2"
      />
    </div>
  );
});

export default MergeNode;

MergeNode.displayName = 'MergeNode';
