import React from 'react';
import { X, Sparkles, ArrowRight, ShieldAlert, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';
import { PRESET_CASES } from '../data/presets';
import { PresetCase } from '../types';

interface PresetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetCase) => void;
}

export const PresetGalleryModal: React.FC<PresetGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const getRiskBadge = (type: string) => {
    switch (type) {
      case 'CRITICAL SCAM':
        return (
          <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Critical Scam
          </span>
        );
      case 'HIGH RISK TRAP':
        return (
          <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            High Risk Trap
          </span>
        );
      case 'CAUTION':
        return (
          <span className="font-mono text-[11px] font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Caution
          </span>
        );
      default:
        return (
          <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe Benchmark
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-slate-700/80">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Case Study Archives: Real-World Student Scams
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any verified scenario below to load and run an immediate forensic audit.
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

        {/* Grid of cases */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_CASES.map((preset) => (
            <div
              key={preset.id}
              className="bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {preset.category}
                  </span>
                  {getRiskBadge(preset.riskType)}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {preset.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {preset.description}
                </p>

                <div className="pt-1">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 line-clamp-3">
                    {preset.inputText}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Audit This Scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/80 flex justify-end">
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
