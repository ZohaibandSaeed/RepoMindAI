import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode2,
  Lightbulb
} from 'lucide-react';

interface SecurityConcern {
  fileName: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
}

interface SecurityAuditData {
  deploymentScore: number;
  securityConcerns: SecurityConcern[];
  reviewSuggestions: string[];
}

interface SecurityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl: string;
  githubToken?: string;
  geminiToken?: string;
}

export const SecurityDrawer: React.FC<SecurityDrawerProps> = ({
  isOpen,
  onClose,
  repoUrl,
  githubToken,
  geminiToken
}) => {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<SecurityAuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch security audit when opened
  useEffect(() => {
    if (isOpen && !auditData && !loading && !error) {
      runAudit();
    }
  }, [isOpen]);

  const runAudit = async () => {
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/security-audit', {
        repo_url: repoUrl,
        github_token: githubToken || undefined,
        gemini_token: geminiToken || undefined
      });
      setAuditData(res.data);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || e.message || 'Failed to run security audit');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-rose-600';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#F9F9F8] border-l border-[#141414] shadow-[-10px_0_30px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden text-[#141414] font-sans"
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#141414] flex items-center justify-between bg-[#E4E3E0]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[#141414] text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif italic text-xl text-[#141414] leading-none">Security Audit</h2>
                <p className="text-[10px] font-mono text-[#141414]/70 mt-1 uppercase truncate max-w-[200px]">
                  {repoUrl || 'No repo selected'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-white border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer shadow-[2px_2px_0_0_#141414]"
            >
              [Close]
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70 p-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
                <p className="text-sm font-mono uppercase font-bold">Scanning Codebase...</p>
                <p className="text-xs font-sans max-w-xs">
                  Reviewing key files and structural patterns for security vulnerabilities and bad practices.
                </p>
              </div>
            ) : error ? (
              <div className="bg-rose-100 border border-rose-800 text-rose-950 p-4 shadow-[4px_4px_0_0_#141414] font-mono">
                <p className="text-xs font-bold mb-2">Error during audit:</p>
                <p className="text-xs">{error}</p>
                <button 
                  onClick={runAudit}
                  className="mt-3 px-3 py-1 bg-[#141414] text-white text-[10px] font-bold uppercase hover:bg-rose-900 transition-colors"
                >
                  Retry Scan
                </button>
              </div>
            ) : auditData ? (
              <>
                {/* Score Banner */}
                <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-6 text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#141414]" />
                  <p className="text-[10px] font-mono uppercase font-bold text-[#141414]/50 tracking-widest">
                    Deployment Readiness Score
                  </p>
                  <div className="flex items-end justify-center gap-1">
                    <span className={`text-5xl font-bold tracking-tighter ${getScoreColor(auditData.deploymentScore)}`}>
                      {auditData.deploymentScore}
                    </span>
                    <span className="text-xl font-bold text-[#141414]/30 pb-1">/100</span>
                  </div>
                </div>

                {/* Security Concerns List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-2">
                    <ShieldAlert className="w-4 h-4 text-[#141414]" />
                    <h3 className="font-mono text-sm font-bold uppercase tracking-tight">Identified Risks</h3>
                    <span className="ml-auto px-1.5 py-0.5 bg-[#141414] text-white text-[9px] font-mono">
                      {auditData.securityConcerns?.length || 0}
                    </span>
                  </div>
                  
                  {auditData.securityConcerns && auditData.securityConcerns.length > 0 ? (
                    <div className="space-y-3">
                      {auditData.securityConcerns.map((concern, idx) => (
                        <div key={idx} className="bg-white border border-[#141414] p-3 shadow-[2px_2px_0_0_#141414]">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <FileCode2 className="w-3.5 h-3.5 text-[#141414]/70 shrink-0" />
                              <span className="text-xs font-mono font-bold truncate">
                                {concern.fileName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 bg-[#F9F9F8] border border-[#141414]/20 px-1.5 py-0.5">
                              {getSeverityIcon(concern.severity)}
                              <span className="text-[9px] font-mono uppercase font-bold">{concern.severity}</span>
                            </div>
                          </div>
                          <p className="text-xs font-sans text-[#141414]/80 leading-relaxed border-l-2 border-[#141414]/20 pl-2">
                            {concern.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-900 text-emerald-900 font-mono text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>No major security concerns detected.</span>
                    </div>
                  )}
                </div>

                {/* Review Suggestions */}
                {auditData.reviewSuggestions && auditData.reviewSuggestions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-2">
                      <Lightbulb className="w-4 h-4 text-[#141414]" />
                      <h3 className="font-mono text-sm font-bold uppercase tracking-tight">Code Review Notes</h3>
                    </div>
                    <ul className="space-y-2">
                      {auditData.reviewSuggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-sans leading-relaxed">
                          <span className="text-[#141414] mt-0.5">•</span>
                          <span className="text-[#141414]/90">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-[#141414] bg-[#E4E3E0] flex justify-between items-center">
            <span className="text-[9px] font-mono text-[#141414]/60 uppercase">
              Powered by Gemini
            </span>
            <button
              onClick={runAudit}
              disabled={loading}
              className="px-3 py-1.5 bg-[#141414] text-white text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-[#333333] transition-colors disabled:opacity-50"
            >
              Run Again
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
