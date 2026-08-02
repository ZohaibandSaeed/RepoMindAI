import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  MessageSquare,
  Send,
  Loader2,
  Terminal,
  Bot
} from 'lucide-react';
import { RepoAnalysisResult } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: RepoAnalysisResult | null;
  geminiToken?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  analysisResult,
  geminiToken,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAsking]);

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || !analysisResult) return;

    const q = userQuery.trim();
    setUserQuery('');
    setChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    setIsAsking(true);

    try {
      const res = await axios.post('/api/chat', {
        repoName: `${analysisResult.owner}/${analysisResult.repo}`,
        repoData: {
          highLevelGraph: analysisResult.highLevelGraph,
          fileGraph: analysisResult.fileGraph
        },
        chatHistory: chatHistory,
        message: q,
        gemini_token: geminiToken || undefined
      });

      setChatHistory((prev) => [...prev, { role: 'model', text: res.data.reply }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsAsking(false);
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
          className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white border-l border-[#141414] shadow-[-10px_0_30px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden text-[#141414] font-sans"
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#141414] flex items-center justify-between bg-[#E4E3E0]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[#141414] text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif italic text-xl text-[#141414] leading-none">Repo Chat</h2>
                <p className="text-[10px] font-mono text-[#141414]/70 mt-1 uppercase">
                  {analysisResult ? `${analysisResult.owner}/${analysisResult.repo}` : 'No repo loaded'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 bg-white border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              [Close]
            </button>
          </div>

          {/* Drawer Body - Chat Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#F9F9F8]"
          >
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50 p-4">
                <MessageSquare className="w-8 h-8 text-[#141414]" />
                <p className="text-sm font-mono uppercase font-bold">Ask anything about this repo</p>
                <p className="text-xs font-sans max-w-xs">
                  I have the structural context of the repository. Try asking where authentication is handled, or what the main entry points are.
                </p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col space-y-1 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#141414]/50 px-1">
                    {msg.role === 'user' ? 'You' : 'AI Agent'}
                  </span>
                  <div className={`p-3 text-sm font-sans leading-relaxed border border-[#141414] shadow-[2px_2px_0_0_#141414] ${msg.role === 'user' ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            
            {isAsking && (
              <div className="flex flex-col space-y-1 max-w-[90%] mr-auto items-start">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#141414]/50 px-1">
                  AI Agent
                </span>
                <div className="p-3 text-sm bg-white border border-[#141414] shadow-[2px_2px_0_0_#141414] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#141414]" />
                  <span className="font-mono text-xs">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Footer */}
          <div className="p-4 border-t border-[#141414] bg-[#E4E3E0]">
            <form onSubmit={handleAskAi} className="flex flex-col gap-2 relative">
              <div className="flex items-stretch relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]">
                  <Terminal className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder={analysisResult ? "Ask about architecture, auth, etc..." : "Load a repo first"}
                  disabled={!analysisResult || isAsking}
                  className="flex-1 pl-9 pr-3 py-3 bg-white border border-[#141414] text-sm text-[#141414] placeholder-[#141414]/50 focus:outline-none focus:ring-1 focus:ring-[#141414] disabled:opacity-50 font-mono"
                />
                <button
                  type="submit"
                  disabled={isAsking || !userQuery.trim() || !analysisResult}
                  className="px-4 bg-[#141414] hover:bg-[#333333] disabled:opacity-50 text-white transition-all cursor-pointer border-y border-r border-[#141414]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
