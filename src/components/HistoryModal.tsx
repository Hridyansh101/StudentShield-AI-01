import React from 'react';
import { X, History, Trash2, ArrowRight, ShieldCheck, Flame, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AuditHistoryItem, AuditResult } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditHistoryItem[];
  onSelectHistoryItem: (item: AuditResult) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const getScoreDisplay = (score: number) => {
    if (score > 85) {
      return (
        <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" />
          {score}/100 Critical
        </span>
      );
    }
    if (score > 60) {
      return (
        <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          {score}/100 High Risk
        </span>
      );
    }
    if (score > 25) {
      return (
        <span className="font-mono text-xs font-semibold text-yellow-600 dark:text-yellow-400 tabular-nums flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {score}/100 Caution
        </span>
      );
    }
    return (
      <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5" />
        {score}/100 Safe
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-slate-700/80">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Recent Document Audits
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit logs stored locally and privately in your browser session.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History list */}
        <div className="p-6 overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-400">No Audits in History Yet</p>
              <p className="text-xs text-slate-500">Scan any internship offer, lease, or email to see it saved here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold">{item.result.document_type}</span>
                    {item.result.audited_input?.imageBase64 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                        Screenshot
                      </span>
                    )}
                    {item.result.audited_input?.url && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        URL Scanned
                      </span>
                    )}
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-500 dark:text-slate-500 font-mono text-[11px] tabular-nums">
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
                    {item.result.one_line_summary}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getScoreDisplay(item.result.risk_score)}

                  <button
                    onClick={() => {
                      onSelectHistoryItem(item.result);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="View report"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/80 flex items-center justify-between">
          {history.length > 0 ? (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
