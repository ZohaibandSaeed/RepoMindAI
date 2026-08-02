import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HighLevelNodeData } from '../types';
import { Layout, Server, Database, Cpu, Globe, Settings, Layers, ExternalLink } from 'lucide-react';

interface Props {
  data: HighLevelNodeData;
  selected?: boolean;
}

const TYPE_CONFIG: Record<
  string,
  { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  frontend: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Layout },
  backend: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Server },
  database: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Database },
  service: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Cpu },
  api: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Globe },
  config: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Settings },
  middleware: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: Layers },
  external: { bg: 'bg-[#E4E3E0]', text: 'text-[#141414]', icon: ExternalLink },
};

export const HighLevelNode = memo(({ data, selected }: Props) => {
  const config = TYPE_CONFIG[data.type] || TYPE_CONFIG.backend;
  const Icon = config.icon;

  return (
    <div
      className={`relative w-72 bg-white border-2 border-[#141414] p-3 font-mono transition-all ${
        selected ? 'shadow-[8px_8px_0_0_#141414] bg-yellow-50/50 -translate-y-1' : 'shadow-[4px_4px_0_0_#141414]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[#141414] !border !border-white"
      />

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#141414] text-white">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#141414] truncate max-w-[140px] uppercase tracking-tight">{data.label}</h3>
            {data.layer && <span className="text-[9px] uppercase font-bold text-[#141414]/50 block">{data.layer}</span>}
          </div>
        </div>
        <span className="px-1.5 py-0.5 bg-[#141414] text-white text-[9px] font-bold uppercase tracking-wider">
          {data.type}
        </span>
      </div>

      <p className="text-[11px] text-[#141414]/80 leading-snug line-clamp-2 mb-2 font-sans">{data.description}</p>

      {data.tech && (
        <div className="pt-2 border-t border-[#141414]/20 flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#141414]/60 uppercase font-bold">TECH:</span>
          <span className="px-1.5 py-0.5 bg-yellow-300 text-[#141414] font-bold uppercase border border-[#141414]">
            {data.tech}
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#141414] !border !border-white"
      />
    </div>
  );
});

HighLevelNode.displayName = 'HighLevelNode';
