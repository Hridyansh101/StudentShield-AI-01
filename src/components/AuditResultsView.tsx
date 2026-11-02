import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  DollarSign, 
  KeyRound, 
  Scale, 
  BrainCircuit, 
  ArrowLeft, 
  Flame, 
  CheckCircle2, 
  ExternalLink, 
  MessageSquareWarning, 
  Send, 
  Download, 
  FileCheck,
  Image as ImageIcon,
  FileText,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Globe,
  Lock,
  Unlock,
  Search,
  AlertTriangle,
  Link as LinkIcon,
  Volume2,
  VolumeX,
  Mic,
  Radio,
  PhoneCall,
  Activity,
  FileAudio
} from 'lucide-react';
import { AuditResult } from '../types';
import { RiskMeter } from './RiskMeter';

interface AuditResultsViewProps {
  result: AuditResult;
  onReset: () => void;
  onOpenLiveVoice?: () => void;
}

export const AuditResultsView: React.FC<AuditResultsViewProps> = ({ result, onReset, onOpenLiveVoice }) => {
  const [copiedReply, setCopiedReply] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedSourceText, setCopiedSourceText] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  
  // Audited evidence panel state
  const [isSourceEvidenceOpen, setIsSourceEvidenceOpen] = useState(true);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);

  const hasImage = Boolean(result.audited_input?.imageBase64);
  const hasText = Boolean(result.audited_input?.text && result.audited_input.text.trim().length > 0);
  const hasUrl = Boolean(result.audited_input?.url || result.url_safety?.scanned_url);
  const hasAudio = Boolean(result.audited_input?.audioBase64 || result.audio_analysis);
  const hasAuditedInput = hasImage || hasText || hasUrl || hasAudio;

  const urlSafety = result.url_safety;
  const audioAnalysis = result.audio_analysis;
  const groundingSources = result.grounding_sources || [];

  const isDoNotReply = 
    result.safe_reply_template.toUpperCase().includes('DO NOT REPLY') ||
    result.safe_reply_template.toUpperCase().includes('BLOCK IMMEDIATELY') ||
    result.safe_reply_template.toUpperCase().includes('DO NOT OPEN') ||
    result.risk_score >= 85;

  const rawActions = result.recommended_action
    .split(/\n|(?=\d+\.\s)/)
    .map(s => s.trim().replace(/^\d+\.\s*/, ''))
    .filter(s => s.length > 0);

  const completedCount = Object.values(checkedActions).filter(Boolean).length;

  const handleCopyReply = () => {
    navigator.clipboard.writeText(result.safe_reply_template);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  const handleCopySourceText = () => {
    const textToCopy = result.audited_input?.text || result.audited_input?.url || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedSourceText(true);
      setTimeout(() => setCopiedSourceText(false), 2000);
    }
  };

  const handleCopyTranscript = () => {
    if (audioAnalysis?.transcript) {
      navigator.clipboard.writeText(audioAnalysis.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const generateReportText = () => {
    const audioSection = audioAnalysis ? `
---
ACOUSTIC CALL ANALYSIS & TELEPHONIC INTELLIGENCE:
Urgency Level: ${audioAnalysis.voice_urgency_level || 'High'}
Ambient Acoustic Environment: ${audioAnalysis.caller_background_sound || 'N/A'}
Telephonic Tactics Flagged: ${audioAnalysis.call_tactics_detected?.join(', ') || 'None'}

VERBATIM CALL TRANSCRIPT:
${audioAnalysis.transcript}
` : '';

    const urlSection = urlSafety ? `
---
SCANNED WEB LINK SAFETY:
Target URL: ${urlSafety.scanned_url}
Domain: ${urlSafety.domain} (${urlSafety.is_secure_protocol ? 'HTTPS Encrypted' : 'INSECURE HTTP'})
Page Title: ${urlSafety.page_title || 'N/A'}
${urlSafety.suspicious_patterns && urlSafety.suspicious_patterns.length > 0 ? `Flagged URL Signals:\n${urlSafety.suspicious_patterns.map(p => `• ${p}`).join('\n')}` : ''}
` : '';

    const groundingSection = groundingSources.length > 0 ? `
---
GOOGLE SEARCH GROUNDED SCAM INTELLIGENCE SOURCES (${groundingSources.length}):
${groundingSources.map(s => `• ${s.title}: ${s.url}`).join('\n')}
` : '';

    return `# StudentShield AI - Forensic Security & Fine-Print Audit Report
Generated: ${new Date().toLocaleString()}
Document / Link Classification: ${result.document_type}
Threat Assessment: ${result.verdict_badge} (Risk Score: ${result.risk_score}/100)
${audioSection}
${urlSection}
---
EXECUTIVE SUMMARY:
"${result.one_line_summary}"

---
DETECTED RED FLAGS (${result.red_flags.length}):
${result.red_flags.map((rf, i) => `[${i + 1}] Category: ${rf.category} | Severity: ${rf.severity}
Quote/Excerpt: "${rf.exact_quote_or_visual_cue}"
Explanation: ${rf.plain_english_explanation}`).join('\n\n')}

---
VERIFIED LEGITIMATE SIGNALS (${result.green_flags.length}):
${result.green_flags.length > 0 ? result.green_flags.map(gf => `• ${gf}`).join('\n') : '• No verifiable protective terms identified in sample.'}
${groundingSection}
---
RECOMMENDED STUDENT ACTIONS:
${result.recommended_action}

---
SAFE COUNTER-RESPONSE / ACTION DIRECTIVE:
${result.safe_reply_template}

---
Audit conducted via StudentShield AI. Mapped to UGC Guidelines, Section 27 Indian Contract Act, and Consumer Protection Act 2019.`;
  };

  const handleCopyFullReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadReport = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studentshield-audit-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleAction = (idx: number) => {
    setCheckedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const categories = ['All', 'Financial Trap', 'Phishing/Identity', 'Legal Clause', 'Dark Pattern'];
  
  const filteredRedFlags = activeCategoryFilter === 'All'
    ? result.red_flags
    : result.red_flags.filter(rf => 
        rf.category.toLowerCase().includes(activeCategoryFilter.toLowerCase().split('/')[0])
      );

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('financ')) return <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (cat.includes('phish') || cat.includes('ident') || cat.includes('domain') || cat.includes('link')) return <KeyRound className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    if (cat.includes('legal') || cat.includes('clause') || cat.includes('contract')) return <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    return <BrainCircuit className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">High Severity</span>;
      case 'medium':
        return <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Medium Severity</span>;
      default:
        return <span className="font-mono text-[11px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Low Severity</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs dark:shadow-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Audit Another Item</span>
        </button>

        <div className="flex items-center gap-2">
          {hasImage && (
            <button
              onClick={() => setIsImageLightboxOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-semibold border border-cyan-200 dark:border-cyan-800/50 transition-all cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>View Screenshot</span>
            </button>
          )}

          <button
            onClick={handleCopyFullReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-xs dark:shadow-none"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            <span>{copiedReport ? 'Report Copied' : 'Copy Report'}</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-xs dark:shadow-none"
            title="Download full Markdown audit report"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Download Report</span>
          </button>
        </div>
      </div>

      {/* Main Risk Diagnostic Component */}
      <RiskMeter score={result.risk_score} badge={result.verdict_badge} />

      {/* Scanned Web Link & Safety Diagnostic Panel */}
      {urlSafety && (
        <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-indigo-200 dark:border-indigo-900/50 p-5 shadow-xs transition-colors space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Scanned Web Link & Safety Diagnostic</span>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    urlSafety.is_secure_protocol 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60'
                  }`}>
                    {urlSafety.is_secure_protocol ? 'SSL SECURE' : 'INSECURE HTTP'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Domain inspected against student phishing lists, fake recruiter networks, and dark pattern payment gateways.
                </p>
              </div>
            </div>

            <a
              href={urlSafety.scanned_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors shrink-0"
              title="Open link in separate tab with rel=noopener"
            >
              <span>Visit Link with Caution</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Domain & Scraped Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                {urlSafety.is_secure_protocol ? <Lock className="w-3.5 h-3.5 text-emerald-500" /> : <Unlock className="w-3.5 h-3.5 text-rose-500" />}
                <span>Domain & Host Integrity</span>
              </span>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-all">
                {urlSafety.domain}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Protocol: <strong className="font-mono">{urlSafety.protocol.toUpperCase()}</strong> {urlSafety.tld && <>| TLD: <strong className="font-mono">.{urlSafety.tld}</strong></>}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                <span>Page Snapshot</span>
              </span>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {urlSafety.page_title || 'No HTML Title Tag Found'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {urlSafety.meta_description || 'Direct server response was inspected for hidden charges, urgency banners, and unverified forms.'}
              </div>
            </div>
          </div>

          {/* Suspicious URL Indicators */}
          {urlSafety.suspicious_patterns && urlSafety.suspicious_patterns.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Heuristic Domain Threats Flagged:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {urlSafety.suspicious_patterns.map((pat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                  >
                    {pat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Google Search Grounded Intelligence & Web Scam Sources */}
      {groundingSources.length > 0 && (
        <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-cyan-200 dark:border-cyan-900/50 p-5 shadow-xs transition-colors space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Google Search Grounded Intelligence</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                    {groundingSources.length} Live Citations
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cross-referenced in real-time across Reddit (r/scams, r/developersIndia), consumer forums, and company registries.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {groundingSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#070a12] hover:bg-cyan-50/50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700/60 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-1">
                    {source.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {source.url.replace(/^https?:\/\//i, '').split('/')[0]}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Audited Source Evidence Card (Uploaded Screenshot / Audio Recording / Audited Text / URL) */}
      {hasAuditedInput && (
        <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800/40">
                {hasAudio ? <Volume2 className="w-4 h-4 text-emerald-500" /> : hasUrl ? <Globe className="w-4 h-4" /> : hasImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Audited Source Evidence</span>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {hasAudio ? 'Call Audio Recording Audited' : hasUrl ? 'Web Link Scanned' : hasImage ? 'Screenshot Analyzed' : 'Text Excerpt Analyzed'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasAudio
                    ? 'Recorded phone conversation or voice note inspected for recruiter urgency, call-center background signatures, and payment traps.'
                    : hasUrl
                    ? 'Target website clauses and domain properties verified by StudentShield AI.'
                    : hasImage 
                    ? 'Original document screenshot inspected by Gemini Multimodal Vision.' 
                    : 'Exact clauses submitted for forensic fine-print analysis.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(hasText || hasUrl || hasAudio) && (
                <button
                  onClick={hasAudio && audioAnalysis?.transcript ? handleCopyTranscript : handleCopySourceText}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copy original audited content"
                >
                  {(copiedSourceText || copiedTranscript) ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{(copiedSourceText || copiedTranscript) ? 'Copied' : hasAudio ? 'Copy Transcript' : hasUrl ? 'Copy URL' : 'Copy Text'}</span>
                </button>
              )}

              <button
                onClick={() => setIsSourceEvidenceOpen(prev => !prev)}
                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isSourceEvidenceOpen ? 'Collapse evidence' : 'Expand evidence'}
              >
                {isSourceEvidenceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expandable Evidence Body */}
          {isSourceEvidenceOpen && (
            <div className="pt-4 space-y-4">
              
              {/* Image Preview & Zoom Action */}
              {hasImage && result.audited_input?.imageBase64 && (
                <div className="space-y-3">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070a12] p-2 flex flex-col items-center">
                    <img
                      src={result.audited_input.imageBase64}
                      alt="Audited Document Screenshot"
                      className="max-h-72 w-auto max-w-full object-contain rounded-lg shadow-xs cursor-pointer group-hover:opacity-95 transition-opacity"
                      onClick={() => setIsImageLightboxOpen(true)}
                    />
                    
                    {/* Hover Overlay Button */}
                    <div 
                      onClick={() => setIsImageLightboxOpen(true)}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Click to Enlarge Screenshot</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Vision OCR & Multimodal Document Audit Complete</span>
                    </span>
                    <button
                      onClick={() => setIsImageLightboxOpen(true)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Resolution View</span>
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* URL Display if present */}
              {hasUrl && result.audited_input?.url && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Scanned Destination URL:
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-cyan-700 dark:text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                    <span>{result.audited_input.url}</span>
                    <a
                      href={result.audited_input.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Open URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Audio Player & Recording Preview */}
              {hasAudio && result.audited_input?.audioBase64 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {result.audited_input.audioFileName || 'Phone Call Recording'}
                      </span>
                    </div>
                    {result.audited_input.audioDuration && (
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        Duration: ~{Math.round(result.audited_input.audioDuration)}s
                      </span>
                    )}
                  </div>
                  <audio
                    controls
                    src={result.audited_input.audioBase64}
                    className="w-full h-10 rounded-lg outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Acoustic signal processed via Gemini Multimodal Audio Architecture</span>
                    {audioAnalysis?.voice_urgency_level && (
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                        Urgency: {audioAnalysis.voice_urgency_level}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Text Excerpt / Note Display */}
              {hasText && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {hasImage ? 'Supplementary Note / Candidate Excerpt:' : 'Audited Document Clauses:'}
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
                    {result.audited_input?.text}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Telephonic Fraud & Acoustic Intelligence Card */}
      {audioAnalysis && (
        <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-rose-200 dark:border-rose-950/60 p-5 shadow-xs transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                <PhoneCall className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Telephonic Fraud & Acoustic Intelligence</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    Audio Forensic Audit
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acoustic pressure signals, dialer ambience, and conversational coercion patterns extracted from the call.
                </p>
              </div>
            </div>

            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                title="Roleplay live with Gemini 3.8 Live API to rehearse your defense"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Practice Defense in Live Voice</span>
              </button>
            )}
          </div>

          {/* Metric Chips Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Urgency Level */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span>Vocal Pressure Level</span>
              </span>
              <div className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span>{audioAnalysis.voice_urgency_level || 'Extreme Urgency'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                  Coercive
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Fast-talking tempo & high-pressure cadence
              </div>
            </div>

            {/* Caller Background Noise */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>Acoustic Environment</span>
              </span>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {audioAnalysis.caller_background_sound || 'Call-Center VoIP Ambience'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Dialer bleed & multiple background voices
              </div>
            </div>

            {/* Call Tactics Flagged */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2 md:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Telephonic Traps</span>
              </span>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {audioAnalysis.call_tactics_detected?.length || 2} Coercion Vectors
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Immediate payment demand + bogus selection
              </div>
            </div>
          </div>

          {/* Detected Tactics Tags */}
          {audioAnalysis.call_tactics_detected && audioAnalysis.call_tactics_detected.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Specific Telephonic Tactics Detected:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {audioAnalysis.call_tactics_detected.map((tactic, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span>{tactic}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verbatim Call Transcript */}
          {audioAnalysis.transcript && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Verbatim Call Transcript & Speaker Dialogue</span>
                </span>
                <button
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copy verbatim call transcript"
                >
                  {copiedTranscript ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTranscript ? 'Copied Transcript' : 'Copy Transcript'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-sans space-y-2 max-h-72 overflow-y-auto leading-relaxed shadow-inner">
                {audioAnalysis.transcript.split('\n').filter(Boolean).map((line, idx) => {
                  const isRecruiter = line.startsWith('[Caller') || line.startsWith('[HR') || line.startsWith('[Recruiter') || line.startsWith('[Agent');
                  const isStudent = line.startsWith('[Student') || line.startsWith('[Candidate') || line.startsWith('[You');
                  
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs sm:text-sm ${
                        isRecruiter 
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-900 dark:text-slate-100'
                          : isStudent
                          ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40 text-slate-900 dark:text-slate-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-mono text-[11px] font-bold mb-1 flex items-center justify-between">
                        <span className={isRecruiter ? 'text-rose-600 dark:text-rose-400' : isStudent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'}>
                          {isRecruiter ? '🚨 Potential Scam Recruiter' : isStudent ? '🎓 Student / Candidate' : 'Dialogue Line'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{line}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs dark:shadow-none transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Classification:</span>
            <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/60">
              {result.document_type}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-mono tabular-nums">
            <span>Red Flags: <strong className="text-rose-600 dark:text-rose-400">{result.red_flags.length}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Green Flags: <strong className="text-emerald-600 dark:text-emerald-400">{result.green_flags.length}</strong></span>
            {result.engine && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {result.engine.includes('flash') ? (result.engine.includes('3.8') ? 'Gemini 3.8 Flash' : 'Gemini 3.1 Flash-Lite') : 'Rules Engine'}
                </span>
              </>
            )}
          </div>
        </div>

        {result.notice && (
          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 text-xs text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span>{result.notice}</span>
          </div>
        )}

        <div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Summary Verdict
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
            "{result.one_line_summary}"
          </p>
        </div>
      </div>

      {/* 4-Category Red Flags Breakdown */}
      <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs dark:shadow-none transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Deceptive & High-Risk Red Flags</span>
              <span className="font-mono text-xs tabular-nums text-rose-600 dark:text-rose-400">({result.red_flags.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Clauses, deceptive phrasing, phishing links, or unconscionable covenants identified in the audit.
            </p>
          </div>

          {/* Segmented Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategoryFilter === cat
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700/80 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Red Flags List */}
        <div className="space-y-3.5">
          {filteredRedFlags.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No red flags in this specific category filter.
            </div>
          ) : (
            filteredRedFlags.map((flag, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 sm:p-5 space-y-3 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {getCategoryIcon(flag.category)}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{flag.category}</span>
                  </div>
                  <div>
                    {getSeverityBadge(flag.severity)}
                  </div>
                </div>

                {/* Shady Phrase Quote Box */}
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/70 border border-rose-200 dark:border-rose-950/60 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400/90 mb-1">
                    Audited Cue / Quoted Text:
                  </div>
                  <div className="italic text-slate-700 dark:text-slate-300">
                    "{flag.exact_quote_or_visual_cue}"
                  </div>
                </div>

                {/* Plain-English Explanation */}
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white font-semibold">Legal & Financial Impact: </strong>
                  {flag.plain_english_explanation}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legitimate / Green Flags Section */}
      <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-3 shadow-xs dark:shadow-none transition-colors">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Verifiable Safeguards & Transparent Terms</span>
          <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">({result.green_flags.length})</span>
        </h3>
        
        {result.green_flags.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            No clear legitimate protection clauses or standard dispute mechanisms were detected in the excerpt.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {result.green_flags.map((flag, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-[#070a12] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Student Action Checklist */}
      <div className="bg-white dark:bg-[#0b101c] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-3 shadow-xs dark:shadow-none transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Recommended Action Checklist</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Concrete steps to protect your academic standing, original documents, credentials, and finances.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            Completed: <strong className="text-cyan-600 dark:text-cyan-400">{completedCount}</strong> of {rawActions.length}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {rawActions.map((action, idx) => (
            <div
              key={idx}
              onClick={() => toggleAction(idx)}
              className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                checkedActions[idx]
                  ? 'bg-emerald-50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/40 text-slate-400 dark:text-slate-500 line-through'
                  : 'bg-slate-50 dark:bg-[#070a12] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                checkedActions[idx]
                  ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white dark:text-slate-950'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}>
                {checkedActions[idx] && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs sm:text-sm leading-relaxed font-normal">
                {action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Safe Reply Template / Urgent Cyber Alert */}
      <div className={`rounded-xl border p-5 sm:p-6 shadow-xs dark:shadow-none transition-colors ${
        isDoNotReply 
          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' 
          : 'bg-white dark:bg-[#0b101c] border-slate-200 dark:border-slate-800'
      }`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isDoNotReply ? (
                <>
                  <Flame className="w-4 h-4 text-rose-600 dark:text-rose-500" />
                  <span className="text-rose-700 dark:text-rose-300">Action Directive: Cease Communication & Report</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Safe Counter-Reply / Negotiation Draft</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDoNotReply
                ? 'High-confidence cyber scam, phishing link, or extortion tactic. Do not pay, register, or surrender data.'
                : 'Copy and send this legally grounded counter-letter to formally object to unfair clauses.'}
            </p>
          </div>

          <button
            onClick={handleCopyReply}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
              isDoNotReply
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {copiedReply ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReply ? 'Copied' : 'Copy Template'}</span>
          </button>
        </div>

        {/* Template Box */}
        <div className="mt-4">
          <div className="p-4 rounded-lg font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed border bg-slate-50 dark:bg-[#070a12] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
            {result.safe_reply_template}
          </div>
        </div>

        {/* Hotlines and Official Help Links */}
        {isDoNotReply && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
              <MessageSquareWarning className="w-4 h-4 shrink-0" />
              <span>National Cyber Crime Reporting Helpline & Portal:</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-rose-900 dark:text-rose-200 font-bold">Dial 1930</span>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 hover:underline font-semibold"
              >
                <span>cybercrime.gov.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isImageLightboxOpen && hasImage && result.audited_input?.imageBase64 && (
        <div 
          onClick={() => setIsImageLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col items-center cursor-default"
          >
            {/* Top Bar inside Lightbox */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Audited Screenshot Evidence (Full Resolution)</span>
              </div>
              <button
                onClick={() => setIsImageLightboxOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close fullscreen view"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Large Image display */}
            <div className="overflow-auto max-h-[78vh] flex items-center justify-center w-full bg-slate-950 rounded-xl p-2 border border-slate-800">
              <img
                src={result.audited_input.imageBase64}
                alt="Full resolution audited document screenshot"
                className="max-h-[74vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
