"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  applyEdgeChanges, 
  applyNodeChanges,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, ChevronLeft, Plus, Zap, Box, GitBranch } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import LogicNode from './nodes/LogicNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
};

const initialNodes = [];
const initialEdges = [];

let id = 0;
const getId = () => `node_${Date.now()}_${id++}`;

export default function WorkflowEditor({ workflowId, initialData }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState(initialData?.nodes || initialNodes);
  const [edges, setEdges] = useState(initialData?.edges || initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    []
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node`, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const saveWorkflow = async () => {
    try {
      const res = await fetch(`/api/admin/automations/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });
      if (res.ok) {
        toast.success("אוטומציה נשמרה!");
      }
    } catch (err) {
      toast.error("שגיאה בשמירה");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden">
      {/* Editor Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/admin/automations'}
            className="p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-black tracking-tight text-lg">{initialData?.name || "אוטומציה חדשה"}</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none">Workflow Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all border border-white/5">
            <Play size={16} className="text-green-500 fill-green-500" />
            בדיקה
          </button>
          <button 
            onClick={saveWorkflow}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all active:scale-95"
          >
            <Save size={16} />
            שמור שינויים
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Nodes Sidebar */}
        <aside className="w-64 border-l border-white/5 bg-[#0a0a0a] p-6 flex flex-col gap-6 z-10 overflow-y-auto order-last">
          <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">ספרית רכיבים</h3>
              
              <div className="space-y-3">
                <NodeTemplate type="trigger" label="טריגר" icon={Zap} color="text-yellow-500" />
                <NodeTemplate type="action" label="פעולה" icon={Box} color="text-blue-500" />
                <NodeTemplate type="logic" label="לוגיקה" icon={GitBranch} color="text-purple-500" />
              </div>
          </div>

          <div className="mt-auto border-t border-white/5 pt-6">
             <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-[11px] text-gray-400 font-medium">
                <p>גרור רכיבים למשטח העבודה כדי להתחיל לבנות את האוטומציה שלך.</p>
             </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background color="#333" gap={20} variant="dots" />
            <Controls className="bg-black/80 border-white/10" />
            <MiniMap 
                nodeStrokeColor={(n) => n.type === 'trigger' ? '#eab308' : n.type === 'action' ? '#3b82f6' : '#a855f7'}
                nodeColor={(n) => n.type === 'trigger' ? '#eab30820' : n.type === 'action' ? '#3b82f620' : '#a855f720'}
                maskColor="rgb(0,0,0,0.6)"
                style={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

function NodeTemplate({ type, label, icon: Icon, color }) {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`group flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all ${color}`}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <Icon size={20} />
      <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{label}</span>
      <Plus size={14} className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
