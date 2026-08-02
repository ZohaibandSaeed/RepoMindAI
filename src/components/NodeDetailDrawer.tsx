import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  X,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Code2,
  BookOpen,
  MessageSquare,
  Send,
  Loader2,
  Globe2,
  Wand2,
} from 'lucide-react';
import { TestCasesModal } from './TestCasesModal';
import { RefactorModal } from './RefactorModal';

interface NodeDetailDrawerProps {
  node: any | null;
  onClose: () => void;
  repoName: string;
  repoOwner: string;
  defaultBranch: string;
  allNodes: any[];
  allEdges: any[];
  onSelectNodeByPath: (nodeId: string) => void;
  githubToken: string;
  geminiToken: string;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  repoName,
  repoOwner,
  defaultBranch,
  allNodes,
  allEdges,
  onSelectNodeByPath,
  githubToken,
  geminiToken,
}) => {
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [aiChat, setAiChat] = useState<{ q: string; a: string }[]>([]);
  const [askingAi, setAskingAi] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState(false);

  // Fetch AI explanation on node change
  useEffect(() => {
    if (!node) {
      setExplanation(null);
      setAiChat([]);
      return;
    }

    const fetchExplanation = async () => {
      setLoadingAi(true);
      try {
        const res = await axios.post('/api/explain-node', {
          repoName: `${repoOwner}/${repoName}`,
          nodeName: node.label || node.id,
          nodePath: node.path || node.id,
          nodeType: node.type || node.fileType || 'module',
          contextSummary: node.summary || node.description || '',
          gemini_token: geminiToken || undefined,
        });
        setExplanation(res.data);
      } catch (e) {
        console.error('Failed to fetch AI explanation:', e);
      } finally {
        setLoadingAi(false);
      }
    };

    fetchExplanation();
  }, [node, repoName, repoOwner, geminiToken]);

  if (!node) return null;

  const nodePath = node.path || node.id;
  const githubUrl =
    node.githubUrl || `https://github.com/${repoOwner}/${repoName}/blob/${defaultBranch}/${nodePath}`;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(nodePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract incoming and outgoing dependencies
  const incomingEdges = allEdges.filter((e) => e.target === node.id);
  const outgoingEdges = allEdges.filter((e) => e.source === node.id);

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const q = userQuery.trim();
    setUserQuery('');
    setAskingAi(true);

    try {
      const res = await axios.post('/api/explain-node', {
        repoName: `${repoOwner}/${repoName}`,
        nodeName: node.label,
        nodePath: nodePath,
        nodeType: node.type || node.fileType,
        contextSummary: `User Question: ${q}. Context: ${node.summary || node.description}`,
        gemini_token: geminiToken || undefined,
      });

      setAiChat((prev) => [...prev, { q, a: res.data.detailedPurpose || res.data.summary }]);
    } catch {
      setAiChat((prev) => [...prev, { q, a: 'Sorry, unable to answer at this moment.' }]);
    } finally {
      setAskingAi(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white border-l border-[#141414] shadow-[-10px_0_30px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden text-[#141414] font-sans"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#141414] flex items-start justify-between gap-4 bg-[#E4E3E0]">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold bg-[#141414] text-white">
                {node.type || node.fileType || 'Node'}
              </span>
              <h2 className="font-serif italic text-xl text-[#141414] truncate">{node.label}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#141414]/70">
              <span className="truncate">{nodePath}</span>
              <button
                onClick={handleCopyPath}
                className="p-1 text-[#141414] hover:bg-[#141414] hover:text-white transition-colors cursor-pointer border border-[#141414]"
                title="Copy Path"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRefactorModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5 text-xs font-mono font-bold uppercase cursor-pointer border border-[#141414] shadow-[2px_2px_0_0_#141414]"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refactor</span>
            </button>
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-[#141414] transition-all flex items-center gap-1.5 text-xs font-mono font-bold uppercase cursor-pointer border border-[#141414] shadow-[2px_2px_0_0_#141414]"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tests</span>
            </button>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#222222] text-white transition-all flex items-center gap-1.5 text-xs font-mono font-bold uppercase cursor-pointer border border-[#141414]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 bg-white border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              [Close]
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-[#141414]">
          {/* AI Explanation Box */}
          <div className="bg-[#F0EFEC] border border-[#141414] p-4 shadow-[4px_4px_0_0_#141414] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#141414]">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#141414] text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-mono text-xs font-bold uppercase text-[#141414]">AI Architectural Summary</h3>
              </div>
              {loadingAi && <Loader2 className="w-4 h-4 text-[#141414] animate-spin" />}
            </div>

            <p className="text-xs font-serif leading-relaxed text-[#141414]">
              {explanation?.summary || node.summary || node.description || 'Analyzing node responsibilities and logic...'}
            </p>

            {explanation?.detailedPurpose && (
              <div className="p-3 bg-white border border-[#141414] text-xs space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-[#141414]/50 block">Detailed Purpose</span>
                <p className="leading-relaxed font-sans">{explanation.detailedPurpose}</p>
              </div>
            )}

            {/* Easy Urdu / Simple Summary Translation Card */}
            {explanation?.simplifiedUrduExplanation && (
              <div className="p-3 bg-emerald-50 border border-[#141414] text-xs text-[#141414] space-y-1 font-mono">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-800">
                  <Globe2 className="w-3 h-3" /> Easy Language Breakdown
                </div>
                <p className="italic font-sans">{explanation.simplifiedUrduExplanation}</p>
              </div>
            )}

            {/* Key Responsibilities */}
            {explanation?.keyResponsibilities?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-mono uppercase font-bold text-[#141414] block">Key Responsibilities:</span>
                <ul className="space-y-1 text-xs text-[#141414]/80">
                  {explanation.keyResponsibilities.map((resp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#141414] font-bold">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Incoming & Outgoing Dependencies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Incoming */}
            <div className="p-3 bg-white border border-[#141414] space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[#141414] border-b border-[#141414]/20 pb-1">
                <span className="flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-[#141414]" /> Incoming
                </span>
                <span className="px-1 bg-[#141414] text-white text-[9px]">{incomingEdges.length}</span>
              </div>
              {incomingEdges.length === 0 ? (
                <p className="text-[10px] text-[#141414]/50 italic">No incoming imports</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {incomingEdges.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onSelectNodeByPath(e.source)}
                      className="w-full text-left p-1 bg-[#E4E3E0] hover:bg-[#141414] hover:text-white text-[10px] font-mono text-[#141414] border border-[#141414] truncate cursor-pointer transition-colors block uppercase font-semibold"
                    >
                      ← {e.source}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div className="p-3 bg-white border border-[#141414] space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[#141414] border-b border-[#141414]/20 pb-1">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#141414]" /> Outgoing
                </span>
                <span className="px-1 bg-[#141414] text-white text-[9px]">{outgoingEdges.length}</span>
              </div>
              {outgoingEdges.length === 0 ? (
                <p className="text-[10px] text-[#141414]/50 italic">No outgoing imports</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {outgoingEdges.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onSelectNodeByPath(e.target)}
                      className="w-full text-left p-1 bg-[#E4E3E0] hover:bg-[#141414] hover:text-white text-[10px] font-mono text-[#141414] border border-[#141414] truncate cursor-pointer transition-colors block uppercase font-semibold"
                    >
                      → {e.target}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive AI Chat Assistant for this Node */}
          <div className="p-4 bg-[#E4E3E0] border border-[#141414] space-y-3 font-mono">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#141414]" />
              <h4 className="font-bold text-xs uppercase text-[#141414]">Ask AI about this node</h4>
            </div>

            {/* Micro chat conversation history */}
            {aiChat.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-white border border-[#141414] text-xs">
                {aiChat.map((chat, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="font-bold text-[#141414]">Q: {chat.q}</p>
                    <p className="text-[#141414]/80 pl-2 border-l-2 border-[#141414] font-serif">A: {chat.a}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAskAi} className="flex items-center gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={`Ask question about ${node.label}...`}
                className="flex-1 px-3 py-1.5 bg-white border border-[#141414] text-xs text-[#141414] placeholder-[#141414]/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={askingAi || !userQuery.trim()}
                className="p-2 bg-[#141414] hover:bg-[#333333] disabled:opacity-50 text-white transition-all cursor-pointer"
              >
                {askingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-[#141414] bg-[#E4E3E0]">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#141414] text-white py-2.5 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#222222] transition-colors"
          >
            View on GitHub
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.aside>

      {/* Test Cases Modal */}
      <TestCasesModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        repoUrl={`https://github.com/${repoOwner}/${repoName}`}
        targetFile={nodePath}
        githubToken={githubToken}
        geminiToken={geminiToken}
      />

      {/* Refactor Modal */}
      <RefactorModal
        isOpen={isRefactorModalOpen}
        onClose={() => setIsRefactorModalOpen(false)}
        repoUrl={`https://github.com/${repoOwner}/${repoName}`}
        targetFile={nodePath}
        githubToken={githubToken}
        geminiToken={geminiToken}
      />
    </AnimatePresence>
  );
};
