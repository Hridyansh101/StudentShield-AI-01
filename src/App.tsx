import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  KeyRound, 
  Scale, 
  BrainCircuit, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Header } from './components/Header';
import { AuditInputForm } from './components/AuditInputForm';
import { AuditResultsView } from './components/AuditResultsView';
import { RightsHandbookModal } from './components/RightsHandbookModal';
import { PresetGalleryModal } from './components/PresetGalleryModal';
import { HistoryModal } from './components/HistoryModal';
import { useTheme } from './context/ThemeContext';
import { AuditResult, AuditHistoryItem, PresetCase } from './types';
import { PRESET_CASES } from './data/presets';

const STORAGE_KEY = 'studentshield_audit_history_v1';

export default function App() {
  const { theme } = useTheme();
  const [currentResult, setCurrentResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<{
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    url?: string;
    categoryHint?: string;
  } | null>(null);

  // Modals
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // History state
  const [history, setHistory] = useState<AuditHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save full audit history, saving sanitized version without large images:', e);
      try {
        const lightweightHistory = history.map(item => ({
          ...item,
          result: {
            ...item.result,
            audited_input: item.result.audited_input ? {
              text: item.result.audited_input.text,
              imageBase64: item.result.audited_input.imageBase64 && item.result.audited_input.imageBase64.length < 250000
                ? item.result.audited_input.imageBase64
                : undefined,
              mimeType: item.result.audited_input.mimeType
            } : undefined
          }
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightHistory));
      } catch {}
    }
  }, [history]);

  const handleAudit = async (params: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    url?: string;
    categoryHint?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastParams(params);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: params.text,
          imageBase64: params.imageBase64,
          mimeType: params.mimeType,
          url: params.url,
          documentCategoryHint: params.categoryHint,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete security audit.');
      }

      const result: AuditResult = {
        ...json.data,
        engine: json.engine,
        notice: json.notice,
        audited_input: {
          text: params.text,
          imageBase64: params.imageBase64,
          mimeType: params.mimeType,
          url: params.url || json.data?.url_safety?.scanned_url,
          pageTitle: json.data?.url_safety?.page_title,
        },
      };
      setCurrentResult(result);

      // Save to history
      const newHistoryItem: AuditHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        previewTitle: result.one_line_summary || result.document_type,
        result,
      };

      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Audit failed:', err);
      let msg = err.message || 'An unexpected error occurred while analyzing the document.';
      try {
        if (typeof msg === 'string' && msg.includes('{') && msg.includes('error')) {
          const match = msg.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.error?.code === 429 || parsed.error?.status === 'RESOURCE_EXHAUSTED' || parsed.error?.message?.includes('quota')) {
              msg = 'Gemini quota limit reached. You can paste the text directly into the Text tab for immediate heuristic auditing, or explore the preset cases!';
            } else if (parsed.error?.message) {
              msg = parsed.error.message;
            }
          }
        }
      } catch {}
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: PresetCase) => {
    handleAudit({
      text: preset.inputText,
      categoryHint: preset.category,
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#070a12] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      theme === 'dark' ? 'bg-grid-pattern-dark' : 'bg-grid-pattern-light'
    }`}>
      
      {/* Navigation Header */}
      <Header
        onOpenHandbook={() => setIsHandbookOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onNewAudit={() => setCurrentResult(null)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800 dark:text-rose-200">Audit Request Notice</p>
                <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {lastParams && (
                <button
                  onClick={() => handleAudit(lastParams)}
                  disabled={isLoading}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Retrying...' : 'Retry Audit'}
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* View Switching: Input vs Active Result */}
        {currentResult ? (
          <AuditResultsView
            result={currentResult}
            onReset={() => setCurrentResult(null)}
          />
        ) : (
          <div className="space-y-10">
            
            {/* Hero / Value Proposition */}
            <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Student Consumer Defense & Cyber Audit System</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight [text-wrap:balance]">
                Forensic Fine-Print & Fraud Protection for Students
              </h1>

              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Scan internship offer letters, certificate hostage bonds, PG rent agreements, and campus phishing emails to detect deceptive traps before you sign or pay.
              </p>

              {/* 4 Forensic Dimensions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-left">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Financial Traps</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Training fees & deposit forfeitures</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-900 border border-rose-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Phishing Signals</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Spoofed HR & unpaid registration forms</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Legal Hostage</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Degree confiscation & exit penalty bonds</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-slate-900 border border-cyan-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 shrink-0">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Patterns</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Fake countdowns & silent auto-debits</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Input Form */}
            <AuditInputForm
              onAudit={handleAudit}
              isLoading={isLoading}
              onSelectPreset={(preset) => {
                handleSelectPreset(preset);
              }}
            />

            {/* Statutory Knowledge Base Citation Strip */}
            <div className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-medium">
                <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Statutory Benchmarks:</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                <span>UGC Student Regulations 2023</span>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">/</span>
                <span>Indian Contract Act Sec 27</span>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">/</span>
                <span>Consumer Protection Act 2019</span>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">/</span>
                <span>Model Tenancy Act</span>
              </div>
            </div>

            {/* Common Student Scams Archive Showcase */}
            <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs dark:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    <span>Real-World Scams Caught in the Wild</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Frequently reported predatory tactics targeting college students across Telegram, WhatsApp, and job boards.
                  </p>
                </div>

                <button
                  onClick={() => setIsPresetsOpen(true)}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore All 6 Cases</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                {PRESET_CASES.slice(0, 3).map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400">{preset.category}</span>
                        <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          {preset.riskType}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{preset.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{preset.description}</p>
                    </div>

                    <button
                      onClick={() => handleSelectPreset(preset)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Audit This Case</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Safeguards Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none space-y-2.5">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm">
                  <Scale className="w-4 h-4" />
                  <span>Did You Know? Holding Certificates is Illegal</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Under strict regulations by the University Grants Commission (UGC) and Indian Contract Law, employers cannot demand or withhold your original degree or marksheet. Giving up physical certificates leaves you vulnerable to extortion.
                </p>
                <button
                  onClick={() => setIsHandbookOpen(true)}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>Read full legal rights guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>The Golden Internship Rule</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Legitimate companies pay YOU for your skills and time. If an organization asks for a "training fee", "laptop security deposit", or "offer acceptance charge" before starting, it is a scam 100% of the time without exception.
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                  Never transfer UPI funds to personal @gmail / @yahoo HR contacts.
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070a12]/90 py-6 mt-12 text-xs text-slate-500 transition-colors">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-300">StudentShield AI</span>
            <span aria-hidden="true">·</span>
            <span>College Student Consumer & Cyber Defense System</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsHandbookOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              Legal Rights Guide
            </button>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <span>Cyber Crime Helpline (1930)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-600 max-w-4xl mx-auto px-4 text-center mt-3 leading-relaxed">
          Disclaimer: StudentShield AI is an automated diagnostic tool grounded in statutory student labor rules, UGC directives, and model tenancy frameworks. Always consult your university legal aid clinic or college placement cell for formal dispute filings.
        </p>
      </footer>

      {/* Modals */}
      <RightsHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />

      <PresetGalleryModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => setCurrentResult(item)}
        onClearHistory={handleClearHistory}
      />

    </div>
  );
}
