"use client";

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Send, Mail, MessageSquare, Ticket, Tag, FlaskConical } from 'lucide-react';

const icons = {
    email: Mail,
    sms: MessageSquare,
    coupon: Ticket,
    tag: Tag,
    product: FlaskConical,
    default: Box
};

export default memo(({ data, isConnectable }) => {
  const Icon = icons[data.actionType] || icons.default;

  return (
    <div className="bg-[#0a0a0a] border-2 border-blue-500/50 p-4 rounded-3xl min-w-[200px] shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
      <Handle
        type="target"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-[#050505] shadow-[0_0_10px_#3b82f6]"
      />

      <div className="flex items-center gap-3">
        <div className="bg-blue-500/10 p-2 rounded-2xl text-blue-500">
          <Icon size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Action</span>
          <span className="text-sm font-bold text-white leading-none">שליחת מייל</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-[#050505] shadow-[0_0_10px_#3b82f6] hover:scale-125 transition-transform"
      />
    </div>
  );
});
