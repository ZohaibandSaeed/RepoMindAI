import React, { useState } from 'react';
import { ViewMode } from '../types';
import { GitGraph, Layers, Network, Search, Loader2, Sparkles, Key, Github, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  githubToken: string;
  setGithubToken: (token: string) => void;
  onToggleChat: () => void;
  onToggleSecurity: () => void;
  isSecurityOpen: boolean;
  geminiToken: string;
  setGeminiToken: (token: string) => void;
}

const PRESETS = [
  { label: 'Express.js', url: 'https://github.com/expressjs/express' },
  { label: 'React', url: 'https://github.com/facebook/react' },
  { label: 'Tailwind CSS', url: 'https://github.com/tailwindlabs/tailwindcss' },
  { label: 'Next.js', url: 'https://github.com/vercel/next.js' },
  { label: 'shadcn/ui', url: 'https://github.com/shadcn-ui/ui' },
];

export const Navbar: React.FC<NavbarProps> = ({
  repoUrl,
  setRepoUrl,
  onAnalyze,
  isLoading,
  viewMode,
  setViewMode,
  githubToken,
  setGithubToken,
  onToggleChat,
  isChatOpen,
  onToggleSecurity,
  isSecurityOpen,
  geminiToken,
  setGeminiToken,
}) => {
  const [showTokenModal, setShowTokenModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onAnalyze(repoUrl.trim());
    }
  };

  return (
    <header className="z-30 bg-[#E4E3E0] border-b border-[#141414] px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-[#141414] text-white flex items-center justify-center font-bold rounded-sm shadow-[2px_2px_0_0_#141414]">
            <GitGraph className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold uppercase tracking-tighter text-lg text-[#141414]">RepoMind AI</h1>
              <span className="text-[9px] font-mono font-bold uppercase bg-[#141414] text-white px-2 py-0.5 border border-[#141414] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-yellow-300" /> AI Engine
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#141414]/70 uppercase tracking-tight">Repo Architecture & Dependency Grid</p>
          </div>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl w-full">
          <div className="flex items-center bg-white border border-[#141414] px-2 py-1 shadow-[3px_3px_0_0_#141414]">
            <span className="text-[#141414]/50 mr-2 text-xs font-mono font-bold select-none">URL</span>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="flex-1 outline-none text-xs font-mono text-[#141414] bg-transparent"
            />
            <button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              className="ml-2 text-[10px] font-bold uppercase bg-[#141414] hover:bg-[#222222] text-white px-3 py-1.5 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-[#141414] bg-white shadow-[2px_2px_0_0_#141414]">
            <button
              onClick={() => setViewMode('high-level')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'high-level'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#E4E3E0]'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Architecture
            </button>
            <button
              onClick={() => setViewMode('dependency')}
              className={`px-3 py-1.5 text-xs font-bold uppercase border-l border-[#141414] transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'dependency'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#E4E3E0]'
                }`}
            >
              <Network className="w-3.5 h-3.5" />
              File Graph
            </button>
          </div>

          <button
            onClick={() => setShowTokenModal(!showTokenModal)}
            title="Configure GitHub Personal Access Token"
            className="p-1.5 bg-white border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white transition-all cursor-pointer shadow-[2px_2px_0_0_#141414]"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleChat}
            title="Chat with AI"
            className={`p-1.5 border border-[#141414] font-mono text-xs font-bold uppercase transition-all cursor-pointer shadow-[2px_2px_0_0_#141414] flex items-center gap-1 ${isChatOpen
                ? 'bg-[#141414] text-white'
                : 'bg-white text-[#141414] hover:bg-[#141414] hover:text-white'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          <button
            onClick={onToggleSecurity}
            title="Security Audit"
            className={`p-1.5 border-y border-r border-[#141414] font-mono text-xs font-bold uppercase transition-all cursor-pointer shadow-[2px_2px_0_0_#141414] flex items-center gap-1 ${isSecurityOpen
                ? 'bg-[#141414] text-white'
                : 'bg-white text-[#141414] hover:bg-[#141414] hover:text-white'
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Audit</span>
          </button>

          {/* API Keys Configuration Toggle */}
          <button
            onClick={() => setShowTokenModal(true)}
            title="Configure API Keys"
            className={`p-1.5 border-y border-l border-[#141414] font-mono text-xs font-bold uppercase transition-all cursor-pointer shadow-[2px_2px_0_0_#141414] flex items-center gap-1 ${githubToken || geminiToken
                ? 'bg-emerald-500 text-white'
                : 'bg-[#141414] text-white hover:bg-[#222222]'
              }`}
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">{(githubToken || geminiToken) ? 'Keys Set' : 'Keys'}</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Pills */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-[#141414]/20 flex items-center justify-between text-xs overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[#141414]/60 text-[10px] font-mono font-bold uppercase mr-1">Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setRepoUrl(preset.url);
                onAnalyze(preset.url);
              }}
              disabled={isLoading}
              className="px-2 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[10px] font-mono font-semibold transition-all cursor-pointer shrink-0 uppercase"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-[#141414]/60 font-mono font-bold uppercase hidden sm:block">
          STATUS: ONLINE • GEMINI LLM ACTIVE
        </div>
      </div>

      {/* API Keys Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-[#141414]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#E4E3E0] border-2 border-[#141414] rounded-none max-w-md w-full p-5 shadow-[8px_8px_0_0_#141414] space-y-6">
            <div className="flex items-center justify-between border-b border-[#141414] pb-2">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#141414]" />
                <h3 className="font-bold text-[#141414] uppercase text-sm font-mono">Environment Keys</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-[#141414] font-mono text-sm font-bold hover:bg-[#141414] hover:text-white px-2 py-0.5 border border-[#141414]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#141414] mb-1.5 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" />
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-[#141414] text-xs font-mono placeholder-[#141414]/40 focus:outline-none focus:bg-yellow-50"
                />
                <p className="text-[10px] text-[#141414]/60 mt-1 font-mono">
                  Optional. Required for large repositories to bypass GitHub API rate limits (60/hr).
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#141414] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiToken}
                  onChange={(e) => setGeminiToken(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-white border border-[#141414] text-xs font-mono placeholder-[#141414]/40 focus:outline-none focus:bg-yellow-50"
                />
                <p className="text-[10px] text-[#141414]/60 mt-1 font-mono">
                  Optional. Use your own Gemini key to bypass rate limits. Resets when tab is closed.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTokenModal(false)}
              className="w-full bg-[#141414] text-white py-2 text-xs font-mono font-bold uppercase tracking-wider border border-[#141414] hover:bg-[#222222] transition-colors shadow-[2px_2px_0_0_#141414]"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
