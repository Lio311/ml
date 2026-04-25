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
import { Save, Play, ChevronRight, Plus, Zap, Box, GitBranch } from 'lucide-react';
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
            <Play size={16} className="text-green-500 fill-green-500" />
            בדיקה
          </button>
          <button 
            onClick={saveWorkflow}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <Save size={16} />
            שמור שינויים
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative flex-row">
        {/* Canvas Area (Left side) */}
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

        {/* Nodes Sidebar (Right side) */}
        <aside className="w-72 border-l border-white/10 bg-black p-6 flex flex-col gap-6 z-10 overflow-y-auto">
          <div className="space-y-4 text-right">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">ספרית רכיבים</h3>
              
              <div className="space-y-3">
                <NodeTemplate type="trigger" label="טריגר" icon={Zap} color="text-yellow-500" />
                <NodeTemplate type="action" label="פעולה" icon={Box} color="text-blue-500" />
                <NodeTemplate type="logic" label="לוגיקה" icon={GitBranch} color="text-purple-500" />
              </div>
          </div>

          <div className="mt-auto border-t border-white/10 pt-6">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-gray-400 font-medium text-right">
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
      className={`group flex flex-col items-center gap-3 p-5 bg-white/[0.03] border border-white/10 rounded-[2rem] cursor-grab active:cursor-grabbing hover:bg-white/10 hover:border-white/20 hover:shadow-2xl transition-all ${color}`}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
        <Icon size={22} />
      </div>
      <div className="text-center">
        <span className="text-sm font-bold text-white block">{label}</span>
        <Plus size={14} className="mx-auto mt-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
