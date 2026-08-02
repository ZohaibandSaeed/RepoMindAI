import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ViewMode, RepoAnalysisResult } from '../types';
import { HighLevelNode } from './HighLevelNode';
import { CustomNode } from './CustomNode';
import { calculateHighLevelLayout, calculateFileGraphLayout } from '../utils/layout';
import { ArchitectureLegend } from './ArchitectureLegend';
import { Search, RotateCcw, Filter, Sparkles, Layers, Network } from 'lucide-react';

interface GraphCanvasProps {
  data: RepoAnalysisResult;
  viewMode: ViewMode;
  onSelectNode: (nodeData: any) => void;
  selectedNodeId?: string;
  repoUrl?: string;
  githubToken?: string;
}

const nodeTypes = {
  highLevelNode: HighLevelNode,
  fileNode: CustomNode,
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  viewMode,
  onSelectNode,
  selectedNodeId,
  repoUrl,
  githubToken,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Heatmap State
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, number> | null>(null);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);

  // Toggle Heatmap Logic
  const toggleHeatmap = async () => {
    if (isHeatmapActive) {
      setIsHeatmapActive(false);
      return;
    }

    setIsHeatmapActive(true);

    // Fetch heatmap data if not already fetched for this session
    if (!heatmapData && viewMode === 'dependency' && data?.fileGraph?.nodes) {
      setIsHeatmapLoading(true);
      try {
        const filePaths = data.fileGraph.nodes.map((n: any) => n.path).filter(Boolean);
        const res = await fetch('/api/heatmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo_url: repoUrl,
            github_token: githubToken,
            nodes: filePaths,
          }),
        });
        const json = await res.json();
        if (json.heatmapData) {
          setHeatmapData(json.heatmapData);
        }
      } catch (err) {
        console.error('Failed to fetch heatmap data:', err);
      } finally {
        setIsHeatmapLoading(false);
      }
    }
  };

  // Recalculate graph layout whenever viewMode or data changes
  useEffect(() => {
    if (!data) return;

    let computedNodes: Node[] = [];
    let computedEdges: Edge[] = [];

    if (viewMode === 'high-level' && data.highLevelGraph) {
      const { nodes: hNodes, edges: hEdges } = calculateHighLevelLayout(
        data.highLevelGraph.nodes,
        data.highLevelGraph.edges
      );
      computedNodes = hNodes;
      computedEdges = hEdges;
    } else if (viewMode === 'dependency' && data.fileGraph) {
      const { nodes: fNodes, edges: fEdges } = calculateFileGraphLayout(
        data.fileGraph.nodes,
        data.fileGraph.edges
      );
      computedNodes = fNodes;
      computedEdges = fEdges;
    }

    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [data, viewMode, setNodes, setEdges]);

  // Handle filtering nodes based on search query or category
  const filteredNodes = useMemo(() => {
    let maxCommits = 0;
    if (isHeatmapActive && heatmapData) {
      maxCommits = Math.max(...Object.values(heatmapData), 1);
    }

    if (!searchQuery.trim() && selectedCategory === 'all') {
      return nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
        data: {
          ...n.data,
          heatmapScore: isHeatmapActive && heatmapData && n.data.path ? (heatmapData[n.data.path as string] || 0) / maxCommits : undefined,
          commitCount: isHeatmapActive && heatmapData && n.data.path ? heatmapData[n.data.path as string] : undefined,
          isHeatmapActive,
        },
      }));
    }

    const q = searchQuery.toLowerCase().trim();

    return nodes.map((n) => {
      const d = n.data as any;
      const labelMatch = (d.label || '').toLowerCase().includes(q);
      const pathMatch = (d.path || '').toLowerCase().includes(q);
      const descMatch = (d.description || d.summary || '').toLowerCase().includes(q);
      const matchesSearch = labelMatch || pathMatch || descMatch;

      const categoryMatch =
        selectedCategory === 'all' ||
        d.type === selectedCategory ||
        d.fileType === selectedCategory;

      const isMatch = matchesSearch && categoryMatch;

      return {
        ...n,
        selected: n.id === selectedNodeId,
        data: {
          ...n.data,
          heatmapScore: isHeatmapActive && heatmapData && n.data.path ? (heatmapData[n.data.path as string] || 0) / maxCommits : undefined,
          commitCount: isHeatmapActive && heatmapData && n.data.path ? heatmapData[n.data.path as string] : undefined,
          isHeatmapActive,
        },
        style: {
          ...n.style,
          opacity: isMatch ? 1 : 0.25,
          transition: 'opacity 0.2s ease',
        },
      };
    });
  }, [nodes, searchQuery, selectedCategory, selectedNodeId, isHeatmapActive, heatmapData]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode({
        ...node.data,
        id: node.id,
        nodeType: viewMode === 'high-level' ? (node.data.type as string) : (node.data.fileType as string),
      });
    },
    [onSelectNode, viewMode]
  );

  return (
    <div className="relative w-full h-[750px] min-h-[500px] border border-[#141414] bg-[#F0EFEC] overflow-hidden shadow-[6px_6px_0_0_#141414]">
      {/* Grid Overlay Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#141414 1.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        className="git-visualizer-canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#141414" />
        <Controls className="!bg-white !border-[#141414] !text-[#141414] !rounded-none overflow-hidden !shadow-[2px_2px_0_0_#141414]" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'highLevelNode') return '#141414';
            return '#333333';
          }}
          maskColor="rgba(228, 227, 224, 0.75)"
          className="!bg-white !border-[#141414] !rounded-none overflow-hidden !shadow-[2px_2px_0_0_#141414]"
        />

        {/* Top Control Panel overlay for Searching and Filtering inside Canvas */}
        <Panel position="top-left" className="m-4">
          <div className="flex items-center gap-2 bg-white border border-[#141414] p-1.5 shadow-[3px_3px_0_0_#141414] flex-wrap font-mono">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#141414]/60 absolute left-2.5" />
              <input
                type="text"
                placeholder="Search nodes in canvas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#E4E3E0] border border-[#141414] text-xs text-[#141414] placeholder-[#141414]/50 focus:outline-none w-48 font-mono"
              />
            </div>

            {/* Category filter dropdown */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#141414] ml-1" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#E4E3E0] border border-[#141414] text-xs text-[#141414] font-bold px-2 py-1 focus:outline-none cursor-pointer uppercase font-mono"
              >
                <option value="all">ALL LAYERS / TYPES</option>
                <option value="frontend">FRONTEND</option>
                <option value="backend">BACKEND</option>
                <option value="database">DATABASE</option>
                <option value="api">API SERVICE</option>
                <option value="service">SERVICES</option>
                <option value="tsx">.TSX REACT</option>
                <option value="ts">.TS CODE</option>
                <option value="py">.PY PYTHON</option>
                <option value="json">.JSON CONFIG</option>
              </select>
            </div>

            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-2 py-1 text-[10px] text-white bg-[#141414] hover:bg-[#333333] uppercase font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> RESET
              </button>
            )}
          </div>
        </Panel>

        {/* Top Right Mode Indicator & Heatmap Toggle */}
        <Panel position="top-right" className="m-4">
          <div className="flex items-center gap-2">
            {viewMode === 'dependency' && (
              <button
                onClick={toggleHeatmap}
                disabled={isHeatmapLoading}
                className={`flex items-center gap-2 border border-[#141414] px-3 py-1.5 shadow-[3px_3px_0_0_#141414] text-xs font-mono font-bold uppercase transition-colors ${
                  isHeatmapActive
                    ? 'bg-rose-600 text-white border-rose-900'
                    : 'bg-white text-[#141414] hover:bg-gray-100'
                }`}
              >
                {isHeatmapLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <span>🔥</span>
                )}
                <span>Heatmap {isHeatmapActive ? 'ON' : 'OFF'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-white border border-[#141414] px-3 py-1.5 shadow-[3px_3px_0_0_#141414] text-xs font-mono font-bold uppercase text-[#141414]">
              {viewMode === 'high-level' ? (
                <>
                  <Layers className="w-4 h-4 text-[#141414]" />
                  <span>Architecture Mode</span>
                </>
              ) : (
                <>
                  <Network className="w-4 h-4 text-[#141414]" />
                  <span>Dependency Mode ({nodes.length} files)</span>
                </>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Floating Legend */}
      <ArchitectureLegend viewMode={viewMode} />
    </div>
  );
};
