import React from 'react';
import { RepoAnalysisResult, ViewMode } from '../types';
import { Star, GitFork, BookOpen, Code, FolderTree, Layers, ShieldCheck } from 'lucide-react';

interface RepoStatsProps {
  data: RepoAnalysisResult;
  viewMode: ViewMode;
}

export const RepoStats: React.FC<RepoStatsProps> = ({ data, viewMode }) => {
  return (
    <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0_0_#141414] mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={data.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-[#141414] hover:underline flex items-center gap-1.5"
          >
            {data.owner} / <span className="bg-[#141414] text-white px-1.5 py-0.5">{data.repo}</span>
          </a>
          <span className="text-[10px] font-mono px-2 py-0.5 uppercase font-bold border border-[#141414] bg-[#E4E3E0] text-[#141414]">
            {data.defaultBranch}
          </span>
          {data.language && (
            <span className="text-[10px] font-mono px-2 py-0.5 uppercase font-bold bg-[#141414] text-white border border-[#141414]">
              {data.language}
            </span>
          )}
        </div>
        <p className="text-xs text-[#141414]/70 max-w-2xl line-clamp-1 font-sans">{data.description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap text-xs text-[#141414]">
        <div className="flex items-center gap-1 bg-[#E4E3E0] px-2.5 py-1 border border-[#141414] font-mono font-bold text-[11px]">
          <Star className="w-3.5 h-3.5 text-[#141414]" />
          <span>{data.stars?.toLocaleString() ?? 0}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#E4E3E0] px-2.5 py-1 border border-[#141414] font-mono font-bold text-[11px]">
          <GitFork className="w-3.5 h-3.5 text-[#141414]" />
          <span>{data.forks?.toLocaleString() ?? 0}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#E4E3E0] px-2.5 py-1 border border-[#141414] font-mono font-bold text-[11px]">
          <FolderTree className="w-3.5 h-3.5 text-[#141414]" />
          <span>{data.fileGraph?.totalFilesParsed ?? 0} FILES</span>
        </div>
        <div className="flex items-center gap-1 bg-[#141414] text-white px-2.5 py-1 border border-[#141414] font-mono font-bold text-[11px] uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
          <span>{viewMode === 'high-level' ? 'Architecture View' : 'Dependency View'}</span>
        </div>
      </div>
    </div>
  );
};
