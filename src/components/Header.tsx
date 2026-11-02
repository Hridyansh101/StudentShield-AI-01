import React from 'react';
import { Shield, BookOpen, Sparkles, History, PhoneCall, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenPresets: () => void;
  onOpenHandbook: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onNewAudit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPresets,
  onOpenHandbook,
  onOpenHistory,
  historyCount,
  onNewAudit,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-[#070a12]/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={onNewAudit}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-700 text-slate-950 font-bold shadow-md shadow-cyan-950/20">
              <Shield className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  StudentShield
                </span>
                <span className="font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-none hidden sm:block">
                Forensic Fine-Print & Scam Defense
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-medium">
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>Preset Cases</span>
          </button>

          <button
            onClick={onOpenHandbook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="hidden sm:inline">Legal Rights Guide</span>
            <span className="sm:hidden">Rights</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">Audit History</span>
            <span className="md:hidden">History</span>
            {historyCount > 0 && (
              <span className="font-mono text-[11px] tabular-nums font-semibold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions + Theme Switcher Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Cyber Hotline */}
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 bg-slate-100 dark:bg-slate-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/50 transition-colors whitespace-nowrap shrink-0"
            title="National Cyber Crime Reporting Helpline"
          >
            <PhoneCall className="w-3 h-3 text-rose-500 dark:text-rose-400" />
            <span>Helpline: <strong className="font-mono text-slate-800 dark:text-slate-200">1930</strong></span>
          </a>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline text-xs font-semibold">Dark</span>
              </>
            )}
          </button>

          {/* New Audit CTA */}
          <button
            onClick={onNewAudit}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Audit
          </button>
        </div>

      </div>
    </header>
  );
};
