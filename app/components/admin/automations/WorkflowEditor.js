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
import { Save, Play, ChevronRight, Plus, Zap, Box, GitBranch, Clock, GitMerge, RefreshCw, Filter, Wrench, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import LogicNode from './nodes/LogicNode';
import WaitNode from './nodes/WaitNode';
import SplitNode from './nodes/SplitNode';
import LoopNode from './nodes/LoopNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  wait: WaitNode,
  split: SplitNode,
  loop: LoopNode,
};

const initialNodes = [];
const initialEdges = [];

let id = 0;
const getId = () => `node_${Date.now()}_${id++}`;

export default function WorkflowEditor({ workflowId, initialData }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState(initialData?.edges || initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Sync label with type for better UX
          const label = newData.triggerType || newData.actionType || newData.logicType || node.data.label;
          return { ...node, data: { ...node.data, ...newData, label } };
        }
        return node;
      })
    );
  }, []);

  // Initialize nodes with handlers
  useEffect(() => {
    if (initialData?.nodes) {
      const nodesWithHandlers = initialData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: (val) => {
            const key = node.type === 'trigger' ? 'triggerType' : node.type === 'action' ? 'actionType' : 'logicType';
            updateNodeData(node.id, { [key]: val });
          },
          onChangeCustom: (val) => {
            const key = node.type === 'trigger' ? 'customTrigger' : node.type === 'action' ? 'customAction' : 'customLogic';
            updateNodeData(node.id, { [key]: val });
          },
          onChangeLogic: (key, val) => {
            updateNodeData(node.id, { [key]: val });
          }
        }
      }));
      setNodes(nodesWithHandlers);
    }
  }, [initialData?.nodes, updateNodeData]);

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

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeId = getId();
      const newNode = {
        id: nodeId,
        type,
        position,
        data: { 
          label: `${type} node`, 
          config: {},
          onChange: (val) => {
            const key = type === 'trigger' ? 'triggerType' : type === 'action' ? 'actionType' : 'logicType';
            updateNodeData(nodeId, { [key]: val });
          },
          onChangeCustom: (val) => {
            const key = type === 'trigger' ? 'customTrigger' : type === 'action' ? 'customAction' : 'customLogic';
            updateNodeData(nodeId, { [key]: val });
          },
          onChangeLogic: (key, val) => {
            updateNodeData(nodeId, { [key]: val });
          }
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, updateNodeData]
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
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black z-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/admin/automations'}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <div className="text-right">
            <h1 className="font-black tracking-tight text-lg text-white">{initialData?.name || "אוטומציה חדשה"}</h1>
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] leading-none mt-1">Workflow Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all text-white border border-white/10">
            בדיקה
            <Play size={16} className="text-green-500 fill-green-500" />
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

      <div className="flex flex-1 overflow-hidden relative flex-row">
        {/* Nodes Sidebar (Right side in RTL because it's first child) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          {/* Components Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">ספריית רכיבים</label>
            <div className="space-y-2">
                <NodeTemplate type="trigger" label="טריגר" icon={Zap} color="text-yellow-500" />
                <NodeTemplate type="action" label="פעולה" icon={Box} color="text-blue-500" />
              </div>
          </div>

          {/* Logic & Advanced Section */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">לוגיקה ופונקציות</label>
            <div className="grid grid-cols-2 gap-2">
              <NodeTemplate type="logic" label="לוגיקה" icon={GitBranch} color="text-purple-500" />
              <NodeTemplate type="wait" label="השהיה" icon={Clock} color="text-orange-500" />
              <NodeTemplate type="split" label="פיצול" icon={GitMerge} color="text-cyan-500" />
              <NodeTemplate type="loop" label="לולאה" icon={RefreshCw} color="text-indigo-500" />
            </div>
          </div>

          <div className="mt-auto border-t border-white/10 pt-6">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-gray-400 font-medium text-right">
                <p>גרור רכיבים למשטח העבודה כדי להתחיל לבנות את האוטומציה שלך.</p>
             </div>
          </div>
        </aside>

        {/* Canvas Area (Left side in RTL because it's second child) */}
        <div className="flex-1 relative h-full bg-[#f1f5f9]" ref={reactFlowWrapper}>
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
      className="bg-transparent border-none p-0 cursor-grab active:cursor-grabbing"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className={`flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] border border-[#333] rounded-2xl hover:bg-[#222] hover:border-[#444] transition-none opacity-[0.99] ${color}`}>
        <div className="bg-[#2a2a2a] p-2 rounded-xl text-white">
          <Icon size={18} />
        </div>
        <div className="text-center">
          <span className="text-xs font-bold text-white block leading-none">{label}</span>
        </div>
      </div>
    </div>
  );
}
