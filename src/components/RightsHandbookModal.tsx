import React from 'react';
import { X, Scale, ShieldCheck, PhoneCall, ExternalLink, HelpCircle } from 'lucide-react';
import { STUDENT_RIGHTS_GUIDE } from '../data/presets';

interface RightsHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightsHandbookModal: React.FC<RightsHandbookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700/80">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Student Rights & Consumer Protection Handbook
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statutory legal protections against predatory hiring bonds, deposit theft, and extortion.
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

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Quick Helpline Strip */}
          <div className="bg-cyan-50 dark:bg-[#070a12] p-4 rounded-xl border border-cyan-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <PhoneCall className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span><strong>National Cyber Fraud & Consumer Helplines:</strong> Dial <strong>1930</strong> (Cyber Crime) or <strong>1915</strong> (Consumer Helpline).</span>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-medium shrink-0"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Legal Rights Cards */}
          <div className="space-y-3.5">
            {STUDENT_RIGHTS_GUIDE.map((guide, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{guide.title}</span>
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 px-2 py-0.5 rounded font-medium">
                    {guide.authority}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {guide.summary}
                </p>

                <ul className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  {guide.keyPoints.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-[#070a12] border border-amber-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-slate-200 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Cardinal Rule of Student Hiring</span>
            </div>
            <p className="leading-relaxed">
              If an internship demands money from you before you start, it is 100% not a real job. If an employer threatens legal action over an unconscionable bond, consult your college's legal aid cell or a consumer advocate immediately before paying a single rupee.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
