import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ViewMode, RepoAnalysisResult } from './types';
import { Navbar } from './components/Navbar';
import { RepoStats } from './components/RepoStats';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { ChatDrawer } from './components/ChatDrawer';
import { SecurityDrawer } from './components/SecurityDrawer';
import {
  GitGraph,
  Sparkles,
  AlertCircle,
  Layers,
  Network,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderSearch,
} from 'lucide-react';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<RepoAnalysisResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('high-level');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [geminiToken, setGeminiToken] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const analyzeRepository = async (targetUrl: string) => {
    if (!targetUrl) return;
    setIsLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const response = await axios.post('/api/analyze-repo', {
        repo_url: targetUrl,
        github_token: githubToken || undefined,
        gemini_token: geminiToken || undefined,
      });

      setAnalysisResult(response.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      let msg = err.response?.data?.error || err.message || 'Failed to analyze repository.';
      if (typeof msg === 'object') {
        msg = msg.message || JSON.stringify(msg);
      }
      setError(String(msg));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    if (repoUrl) {
      analyzeRepository(repoUrl);
    }
  }, []);

  const handleSelectNodeByPath = (nodeId: string) => {
    if (!analysisResult) return;

    let found: any = null;
    if (viewMode === 'high-level' && analysisResult.highLevelGraph) {
      found = analysisResult.highLevelGraph.nodes.find((n) => n.id === nodeId);
    } else if (viewMode === 'dependency' && analysisResult.fileGraph) {
      found = analysisResult.fileGraph.nodes.find((n) => n.id === nodeId);
    }

    if (found) {
      setSelectedNode({
        ...found,
        id: found.id,
        nodeType: found.type || found.fileType,
      });
    }
  };

  const currentNodes =
    viewMode === 'high-level'
      ? analysisResult?.highLevelGraph?.nodes || []
      : analysisResult?.fileGraph?.nodes || [];

  const currentEdges =
    viewMode === 'high-level'
      ? analysisResult?.highLevelGraph?.edges || []
      : analysisResult?.fileGraph?.edges || [];

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Top Navigation */}
      <Navbar
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        onAnalyze={analyzeRepository}
        isLoading={isLoading}
        viewMode={viewMode}
        setViewMode={setViewMode}
        githubToken={githubToken}
        setGithubToken={setGithubToken}
        geminiToken={geminiToken}
        setGeminiToken={setGeminiToken}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isSecurityOpen={isSecurityOpen}
        onToggleSecurity={() => setIsSecurityOpen(!isSecurityOpen)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-100 border-2 border-rose-800 text-rose-950 px-4 py-3 shadow-[4px_4px_0_0_#141414] flex items-center justify-between font-mono">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs bg-rose-900 text-white px-2 py-0.5 font-bold uppercase cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border-2 border-[#141414] p-12 text-center space-y-4 shadow-[8px_8px_0_0_#141414]">
            <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#141414] border-t-yellow-400 animate-spin"></div>
            </div>
            <div className="space-y-1 font-mono">
              <h3 className="text-sm font-bold uppercase text-[#141414] flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#141414] animate-pulse" />
                Parsing Repository & Vectorizing Structure
              </h3>
              <p className="text-xs text-[#141414]/70 max-w-md mx-auto">
                Fetching GitHub tree layout, computing AST dependency graph, and requesting Gemini 3.6 Flash high-level architecture breakdown...
              </p>
            </div>
          </div>
        )}

        {/* Empty State / Hero Section */}
        {!isLoading && !analysisResult && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
            <div className="bg-white border-4 border-[#141414] p-8 md:p-12 shadow-[12px_12px_0_0_#141414] max-w-2xl w-full relative overflow-hidden">
              {/* Decorative background grid */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-black-400 border-4 border-[#141414] shadow-[4px_4px_0_0_#141414] mb-4 group hover:scale-105 transition-transform duration-300">
                  <GitGraph className="w-10 h-10 text-[#141414]" />
                </div>

                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#141414] leading-tight">
                  Visualize <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 border-b-4 border-emerald-600">Code</span> Like Never Before
                </h1>

                <p className="text-sm md:text-base font-mono text-[#141414]/70 max-w-lg mx-auto leading-relaxed">
                  Enter a GitHub Repository URL above to instantly generate an interactive AI-powered architecture map, detect security flaws, and write tests automatically.
                </p>

                <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t-2 border-[#141414]/10">
                  <div className="flex flex-col items-center gap-2 p-3">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    <span className="text-xs font-bold uppercase font-mono">AI Analysis</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-bold uppercase font-mono">Security Audit</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-bold uppercase font-mono">Auto Tests</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results View */}
        {!isLoading && analysisResult && (
          <div className="space-y-4">
            {/* Repo Summary Stats Header */}
            <RepoStats data={analysisResult} viewMode={viewMode} />

            {/* Architecture / Dependency Graph Canvas */}
            <GraphCanvas
              data={analysisResult}
              viewMode={viewMode}
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id}
              repoUrl={repoUrl}
              githubToken={githubToken}
            />

            {/* Interactive Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono">
              <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0_0_#141414] flex items-start gap-3">
                <div className="p-2 bg-[#141414] text-white shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#141414]">Architecture Map</h4>
                  <p className="text-[11px] text-[#141414]/70 leading-relaxed mt-0.5 font-sans">
                    Filters configuration noise to present macro dataflow (Client UI → API Router → Domain Services → DB).
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0_0_#141414] flex items-start gap-3">
                <div className="p-2 bg-[#141414] text-white shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#141414]">File Dependency Grid</h4>
                  <p className="text-[11px] text-[#141414]/70 leading-relaxed mt-0.5 font-sans">
                    Interactive file-level node graph mapping import hierarchies, estimated lines, and code complexity metrics.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0_0_#141414] flex items-start gap-3">
                <div className="p-2 bg-[#141414] text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#141414]">AI Analysis Sidebar</h4>
                  <p className="text-[11px] text-[#141414]/70 leading-relaxed mt-0.5 font-sans">
                    Click any node to inspect Gemini explanations, easy language breakdowns, and source links.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Right Slide-In AI Explanation Drawer */}
      {selectedNode && analysisResult && (
        <NodeDetailDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          repoName={analysisResult.repo}
          repoOwner={analysisResult.owner}
          defaultBranch={analysisResult.defaultBranch}
          allNodes={currentNodes}
          allEdges={currentEdges}
          onSelectNodeByPath={handleSelectNodeByPath}
          githubToken={githubToken}
          geminiToken={geminiToken}
        />
      )}

      {/* Global Repo Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        analysisResult={analysisResult}
        geminiToken={geminiToken}
      />

      {/* Security Audit Drawer */}
      <SecurityDrawer
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        repoUrl={repoUrl}
        githubToken={githubToken}
        geminiToken={geminiToken}
      />

      {/* Technical Dashboard Bottom Status Bar */}
      <footer className="h-8 border-t border-[#141414] bg-[#E4E3E0] flex items-center justify-between px-4 text-[10px] font-mono z-20 mt-8">
        <div className="flex items-center gap-4">
          <span className="font-bold">STATUS: READY</span>
          <span className="opacity-40">|</span>
          <span className="uppercase">REPO: {analysisResult ? `${analysisResult.owner}/${analysisResult.repo}` : 'NONE'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>NODES: {currentNodes.length}</span>
          <span className="opacity-40">|</span>
          <span>EDGES: {currentEdges.length}</span>
          <span className="opacity-40">|</span>
          <span className="font-bold text-emerald-800 uppercase">GEMINI_AGENT_ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
