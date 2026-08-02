import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Download,
  Loader2,
  AlertCircle,
  X,
  Code
} from 'lucide-react';

interface TestCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl: string;
  targetFile: string;
  githubToken?: string;
  geminiToken?: string;
}

export const TestCasesModal: React.FC<TestCasesModalProps> = ({
  isOpen,
  onClose,
  repoUrl,
  targetFile,
  githubToken,
  geminiToken,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCasesMarkdown, setTestCasesMarkdown] = useState<string | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && targetFile && !testCasesMarkdown && !loading && !error) {
      generateTests();
    }
  }, [isOpen, targetFile]);

  const generateTests = async () => {
    if (!repoUrl || !targetFile) return;
    setLoading(true);
    setError(null);
    setTestCasesMarkdown(null);
    try {
      const res = await axios.post('/api/generate-tests', {
        repo_url: repoUrl,
        github_token: githubToken || undefined,
        gemini_token: geminiToken || undefined,
        target_file: targetFile
      });
      setTestCasesMarkdown(res.data.testsMarkdown);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || e.message || 'Failed to generate test cases.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // We already added @media print in index.css to only show .printable-content
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm print:static print:block print:bg-transparent print:p-0">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#E4E3E0] w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#141414] shadow-[12px_12px_0_0_#141414] font-sans overflow-hidden print:max-h-none print:h-auto print:shadow-none print:border-none print:block print:w-full print:max-w-none print:bg-transparent"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#141414] flex items-center justify-between bg-white shrink-0 no-print">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[#141414] text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg uppercase tracking-tight text-[#141414] flex items-center gap-2">
                  Test Case Generator <span className="px-1.5 py-0.5 bg-yellow-300 text-[10px] font-mono border border-[#141414]">AI</span>
                </h2>
                <p className="text-xs font-mono text-[#141414]/70 mt-0.5 truncate max-w-md">
                  Target: {targetFile}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={loading || !testCasesMarkdown}
                className="px-3 py-1.5 bg-[#141414] text-white text-[10px] font-bold uppercase border border-[#141414] hover:bg-[#333333] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 bg-white text-[#141414] border border-[#141414] hover:bg-[#141414] hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-[#F9F9F8] p-6 relative print:overflow-visible print:h-auto print:block print:bg-transparent print:p-0">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                <Loader2 className="w-10 h-10 animate-spin text-[#141414]" />
                <div>
                  <p className="text-sm font-mono uppercase font-bold text-[#141414]">Analyzing Code & Writing Tests...</p>
                  <p className="text-xs text-[#141414]/60 max-w-sm mt-1">
                    The AI is parsing {targetFile} to generate Edge Cases, Unit Tests, and proper mocks.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-rose-100 border-2 border-rose-900 text-rose-950 p-5 shadow-[4px_4px_0_0_#141414] max-w-md mx-auto mt-10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-rose-700" />
                  <h3 className="font-bold text-sm uppercase">Generation Failed</h3>
                </div>
                <p className="text-xs font-mono">{error}</p>
                <button
                  onClick={generateTests}
                  className="mt-4 px-4 py-2 bg-rose-900 text-white text-xs font-bold uppercase hover:bg-rose-950 transition-colors"
                >
                  Retry Generation
                </button>
              </div>
            ) : testCasesMarkdown ? (
              <div 
                ref={pdfContentRef}
                className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0_0_#141414] max-w-3xl mx-auto printable-content"
              >
                {/* PDF Header overlay - invisible on web, looks good on PDF */}
                <div className="border-b-2 border-[#141414] pb-4 mb-6 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold uppercase tracking-tighter">Test Report</h1>
                    <p className="font-mono text-xs text-[#141414]/70 mt-1">Generated by GitVisualizer AI</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold bg-[#141414] text-white px-2 py-0.5 inline-block">
                      {targetFile.split('/').pop()}
                    </p>
                    <p className="text-[10px] text-[#141414]/50 mt-1">{new Date().toLocaleString()}</p>
                  </div>
                </div>

                <div className="prose prose-sm prose-pre:bg-[#141414] prose-pre:text-[#F9F9F8] prose-pre:border prose-pre:border-[#141414] prose-a:text-[#2563EB] max-w-none text-[#141414] prose-pre:overflow-x-auto prose-pre:whitespace-pre-wrap break-words">
                  <ReactMarkdown>{testCasesMarkdown}</ReactMarkdown>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
