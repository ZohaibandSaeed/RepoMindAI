import { Node, Edge } from '@xyflow/react';
import { HighLevelNodeData, FileNodeData, GraphEdge } from '../types';

/**
 * Calculates topological grid positioning for React Flow nodes to eliminate overlaps
 * and produce a clean hierarchical diagram.
 */
export function calculateHighLevelLayout(
  rawNodes: HighLevelNodeData[],
  rawEdges: GraphEdge[]
): { nodes: Node[]; edges: Edge[] } {
  // Group nodes by visual layer / type
  const layerOrder: Record<string, number> = {
    frontend: 0,
    middleware: 1,
    api: 2,
    backend: 3,
    service: 4,
    database: 5,
    external: 6,
    config: 7,
  };

  const layers: Record<number, HighLevelNodeData[]> = {};

  rawNodes.forEach((n) => {
    const lIndex = layerOrder[n.type] ?? 3;
    if (!layers[lIndex]) layers[lIndex] = [];
    layers[lIndex].push(n);
  });

  const activeLayerIndices = Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b);

  const nodes: Node[] = [];
  const X_SPACING = 320;
  const Y_SPACING = 220;
  const X_OFFSET = 80;
  const Y_OFFSET = 80;

  activeLayerIndices.forEach((layerIdx, colIdx) => {
    const colNodes = layers[layerIdx];
    const totalInCol = colNodes.length;

    colNodes.forEach((node, rowIdx) => {
      // Center column vertically
      const yPos = Y_OFFSET + (rowIdx - (totalInCol - 1) / 2) * Y_SPACING + 150;
      const xPos = X_OFFSET + colIdx * X_SPACING;

      nodes.push({
        id: node.id,
        type: 'highLevelNode',
        position: { x: xPos, y: Math.max(20, yPos) },
        data: node as unknown as Record<string, unknown>,
      });
    });
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id || `${e.source}->${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label || '',
    animated: e.animated ?? true,
    style: { stroke: '#6366f1', strokeWidth: 2, ...e.style },
    labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', rx: 4, ry: 4 },
  }));

  return { nodes, edges };
}

export function calculateFileGraphLayout(
  rawNodes: FileNodeData[],
  rawEdges: GraphEdge[]
): { nodes: Node[]; edges: Edge[] } {
  // Group files by top-level folder
  const folders: Record<string, FileNodeData[]> = {};

  rawNodes.forEach((n) => {
    const fKey = n.folder || 'root';
    if (!folders[fKey]) folders[fKey] = [];
    folders[fKey].push(n);
  });

  const folderKeys = Object.keys(folders).sort();

  const nodes: Node[] = [];
  const COL_WIDTH = 340;
  const ROW_HEIGHT = 160;
  const START_X = 60;
  const START_Y = 60;

  folderKeys.forEach((fKey, colIdx) => {
    const fileList = folders[fKey];

    fileList.forEach((fNode, rowIdx) => {
      const x = START_X + colIdx * COL_WIDTH;
      const y = START_Y + rowIdx * ROW_HEIGHT;

      nodes.push({
        id: fNode.id,
        type: 'fileNode',
        position: { x, y },
        data: fNode as unknown as Record<string, unknown>,
      });
    });
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id || `${e.source}->${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label || '',
    animated: e.animated ?? false,
    style: { stroke: '#3b82f6', strokeWidth: 1.5, ...e.style },
    labelStyle: { fill: '#64748b', fontSize: 10 },
    labelBgStyle: { fill: '#0f172a', rx: 4, ry: 4 },
  }));

  return { nodes, edges };
}
