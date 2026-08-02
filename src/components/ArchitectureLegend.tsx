import React from 'react';
import { ViewMode } from '../types';
import { MousePointerClick, Move } from 'lucide-react';

interface LegendProps {
  viewMode: ViewMode;
}

export const ArchitectureLegend: React.FC<LegendProps> = ({ viewMode }) => {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white border border-[#141414] p-3 shadow-[4px_4px_0_0_#141414] max-w-xs w-full text-xs font-mono space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#141414]">
        <span className="font-bold text-[#141414] tracking-wide text-[10px] uppercase">
          {viewMode === 'high-level' ? 'LAYER SPECIFICATIONS' : 'FILE TYPE LEGEND'}
        </span>
        <span className="text-[9px] text-[#141414]/50 uppercase font-bold">[LEGEND]</span>
      </div>

      {viewMode === 'high-level' ? (
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> FRONTEND UI
          </div>
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> API GATEWAY
          </div>
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> BACKEND SERVICES
          </div>
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> DATA STORE
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> .TSX / REACT
          </div>
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> .TS / CODE
          </div>
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> .PY / PYTHON
          </div>
          <div className="flex items-center gap-1.5 text-[#141414]">
            <span className="w-2.5 h-2.5 bg-[#141414]"></span> .JSON / CONFIG
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-[#141414]/20 flex items-center justify-between text-[9px] text-[#141414]/70 font-bold uppercase">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3 h-3 text-[#141414]" /> CLICK NODE
        </span>
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-[#141414]" /> PAN / ZOOM
        </span>
      </div>
    </div>
  );
};
