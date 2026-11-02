import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

interface RiskMeterProps {
  score: number;
  badge: string;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, badge }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine threat tier with dual light & dark classes
  let tierConfig = {
    level: 'Transparent & Low Risk',
    color: 'emerald',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/20',
    progressColor: 'bg-emerald-500',
    ringColor: 'stroke-emerald-500 dark:stroke-emerald-400',
    icon: ShieldCheck,
    summary: 'Standard terms aligned with fair student employment, privacy rights, and lease guidelines.'
  };

  if (normalizedScore > 85 || badge.toUpperCase().includes('CRITICAL')) {
    tierConfig = {
      level: 'Critical Predatory Threat',
      color: 'rose',
      textColor: 'text-rose-700 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-500/40',
      bgColor: 'bg-rose-50/80 dark:bg-rose-950/25',
      progressColor: 'bg-rose-500',
      ringColor: 'stroke-rose-500 dark:stroke-rose-500',
      icon: Flame,
      summary: 'Extreme financial loss, extortion, identity phishing, or illegal hostage clauses detected. Do not sign or transfer money.'
    };
  } else if (normalizedScore > 60 || badge.toUpperCase().includes('HIGH RISK')) {
    tierConfig = {
      level: 'High Risk Predatory Clauses',
      color: 'amber',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-500/35',
      bgColor: 'bg-amber-50/80 dark:bg-amber-950/20',
      progressColor: 'bg-amber-500',
      ringColor: 'stroke-amber-500 dark:stroke-amber-400',
      icon: ShieldAlert,
      summary: 'One or more clauses heavily prejudice student legal rights, exit options, or security deposits.'
    };
  } else if (normalizedScore > 25 || badge.toUpperCase().includes('CAUTION')) {
    tierConfig = {
      level: 'Cautionary Ambiguities',
      color: 'yellow',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-500/30',
      bgColor: 'bg-yellow-50/80 dark:bg-yellow-950/20',
      progressColor: 'bg-yellow-500',
      ringColor: 'stroke-yellow-500 dark:stroke-yellow-400',
      icon: AlertTriangle,
      summary: 'Vague terms or boilerplate stipulations that warrant written clarification before acceptance.'
    };
  }

  const Icon = tierConfig.icon;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={`rounded-xl border ${tierConfig.borderColor} ${tierConfig.bgColor} p-6 transition-all shadow-xs dark:shadow-none`}>
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
        
        {/* Calibrated Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 130 130">
            {/* Background ring */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              fill="transparent"
              className="text-slate-200 dark:text-slate-800/80"
            />
            {/* Active stroke */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={`${tierConfig.ringColor} transition-all duration-700 ease-out`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {normalizedScore}
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              out of 100
            </span>
          </div>
        </div>

        {/* Verdict & Threat Diagnosis */}
        <div className="flex-1 text-center md:text-left space-y-2.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
            <div className={`inline-flex items-center gap-1.5 font-semibold ${tierConfig.textColor}`}>
              <Icon className="w-4 h-4" />
              <span>{badge || tierConfig.level}</span>
            </div>
            <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Forensic Risk Level
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {tierConfig.level}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            {tierConfig.summary}
          </p>

          {/* Calibrated 4-segment threat spectrum bar */}
          <div className="pt-2 max-w-md">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
              <span>0 Safe</span>
              <span>25 Caution</span>
              <span>60 High Risk</span>
              <span>100 Critical</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500/50 w-1/4 border-r border-white dark:border-slate-900" title="0-25 Safe" />
              <div className="h-full bg-yellow-500/50 w-[35%] border-r border-white dark:border-slate-900" title="26-60 Caution" />
              <div className="h-full bg-amber-500/50 w-[25%] border-r border-white dark:border-slate-900" title="61-85 High Risk" />
              <div className="h-full bg-rose-500/50 w-[15%]" title="86-100 Critical" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
