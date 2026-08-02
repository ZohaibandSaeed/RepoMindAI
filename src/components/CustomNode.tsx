import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileNodeData } from '../types';
import { FileCode, FileJson, FileText, Code2, FolderGit2 } from 'lucide-react';

interface Props {
  data: FileNodeData;
  selected?: boolean;
}

const FILE_TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }> }> = {
  tsx: { icon: Code2 },
  ts: { icon: Code2 },
  jsx: { icon: Code2 },
  js: { icon: Code2 },
  py: { icon: FileCode },
  json: { icon: FileJson },
  css: { icon: FileText },
  html: { icon: FileText },
  md: { icon: FileText },
};

export const CustomNode = memo(({ data, selected }: Props) => {
  const ext = (data.fileType || 'txt').toLowerCase();
  const config = FILE_TYPE_CONFIG[ext] || { icon: FileCode };
  const Icon = config.icon;

  const isHeatmapActive = (data as any).isHeatmapActive;
  const heatmapScore = (data as any).heatmapScore ?? 0;
  const commitCount = (data as any).commitCount;

  // Calculate background color based on heatmapScore (0 to 1)
  // Cool: blue (e.g., #EFF6FF / blue-50) -> Hot: red (e.g., #FEE2E2 / red-100 to #EF4444 / red-500)
  let bgColor = 'bg-white';
  if (isHeatmapActive) {
    if (heatmapScore > 0.8) bgColor = 'bg-red-500 text-white';
    else if (heatmapScore > 0.5) bgColor = 'bg-red-300';
    else if (heatmapScore > 0.2) bgColor = 'bg-orange-200';
    else if (heatmapScore > 0) bgColor = 'bg-yellow-100';
    else bgColor = 'bg-blue-50'; // Very cold / no commits
  }

  return (
    <div
      className={`relative w-64 border-2 border-[#141414] p-3 font-mono transition-all cursor-pointer ${
        selected ? 'shadow-[8px_8px_0_0_#141414] -translate-y-1' : 'shadow-[4px_4px_0_0_#141414]'
      } ${isHeatmapActive ? bgColor : (selected ? 'bg-yellow-50/50' : 'bg-white')}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#141414] !border !border-white"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${isHeatmapActive && heatmapScore > 0.8 ? 'text-white' : 'text-[#141414]'}`} />
          <span className={`font-mono text-xs font-bold truncate ${isHeatmapActive && heatmapScore > 0.8 ? 'text-white' : 'text-[#141414]'}`}>{data.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {isHeatmapActive && commitCount !== undefined && (
            <span className="text-[9px] font-mono font-bold px-1 py-0.5 bg-rose-600 text-white border border-rose-900 flex items-center gap-0.5">
              🔥 {commitCount}
            </span>
          )}
          <span className="text-[9px] font-mono uppercase font-bold px-1 py-0.5 bg-[#141414] text-white">
            .{ext}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-[#141414]/60 font-mono mb-2 truncate">
        <FolderGit2 className="w-3 h-3 text-[#141414] shrink-0" />
        <span className="truncate">{data.folder || 'root'}</span>
      </div>

      <p className="text-[11px] text-[#141414]/80 line-clamp-2 leading-tight mb-2 font-sans">{data.summary}</p>

      {data.metrics && (
        <div className="flex items-center justify-between pt-1.5 border-t border-[#141414]/20 text-[10px] text-[#141414] font-mono">
          <span>
            LINES: <strong className="font-bold">{data.metrics.linesEst || '~'}</strong>
          </span>
          <span className="font-bold px-1.5 py-0.5 uppercase border border-[#141414] bg-[#E4E3E0] text-[9px]">
            {data.metrics.complexity || 'Low'} Complexity
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#141414] !border !border-white"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
