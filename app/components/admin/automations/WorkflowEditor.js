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
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Editor Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/admin/automations'}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-black tracking-tight text-lg text-gray-900">{initialData?.name || "אוטומציה חדשה"}</h1>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">Workflow Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm transition-all text-gray-700">
            בדיקה
            <Play size={16} className="text-green-600 fill-green-600" />
          </button>
          <button 
            onClick={saveWorkflow}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            שמור שינויים
            <Save size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas Area (Left side) */}
        <div className="flex-1 relative h-full bg-[#f8fafc]" ref={reactFlowWrapper}>
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
            <Background color="#cbd5e1" gap={20} variant="dots" />
            <Controls className="bg-white border-gray-200 shadow-sm" />
            <MiniMap 
                nodeStrokeColor={(n) => n.type === 'trigger' ? '#eab308' : n.type === 'action' ? '#3b82f6' : '#a855f7'}
                nodeColor={(n) => n.type === 'trigger' ? '#eab30820' : n.type === 'action' ? '#3b82f620' : '#a855f720'}
                maskColor="rgb(255,255,255,0.6)"
                style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
            />
          </ReactFlow>
        </div>

        {/* Nodes Sidebar (Right side) */}
        <aside className="w-72 border-r border-gray-200 bg-gray-50 p-6 flex flex-col gap-6 z-10 overflow-y-auto">
          <div className="space-y-4 text-right">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ספרית רכיבים</h3>
              
              <div className="space-y-3">
                <NodeTemplate type="trigger" label="טריגר" icon={Zap} color="text-yellow-600" />
                <NodeTemplate type="action" label="פעולה" icon={Box} color="text-blue-600" />
                <NodeTemplate type="logic" label="לוגיקה" icon={GitBranch} color="text-purple-600" />
              </div>
          </div>

          <div className="mt-auto border-t border-gray-200 pt-6">
             <div className="bg-white border border-gray-200 rounded-2xl p-4 text-[11px] text-gray-500 font-medium text-right">
                <p>גרור רכיבים למשטח העבודה כדי להתחיל לבנות את האוטומציה שלך.</p>
             </div>
          </div>
        </aside>
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
      className={`group flex items-center flex-row-reverse gap-3 p-4 bg-white border border-gray-200 rounded-2xl cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-sm transition-all ${color}`}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className="bg-gray-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
        <Icon size={18} />
      </div>
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <Plus size={14} className="mr-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
