import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Link as LinkIcon, 
  X, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Search
} from 'lucide-react';
import { PRESET_CASES } from '../data/presets';
import { PresetCase } from '../types';

interface AuditInputFormProps {
  onAudit: (params: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    url?: string;
    categoryHint?: string;
  }) => Promise<void>;
  isLoading: boolean;
  onSelectPreset: (preset: PresetCase) => void;
}

const CATEGORIES = [
  'Auto-Detect Type',
  'Internship Offer',
  'Job Contract & Bond',
  'PG / Rental Agreement',
  'WhatsApp / Email Notice',
  'Checkout / Subscription Page',
  'Phishing Link / Portal'
];

const SAMPLE_URLS = [
  {
    label: 'Fake Portal (.top)',
    url: 'https://internshala-verify-hiring.top/candidate-login',
    category: 'Phishing Link / Portal',
    desc: 'Spoofed portal imitating Internshala with disposable .top domain'
  },
  {
    label: 'Telegram Trap',
    url: 'https://t.me/urgent_mnc_internship_offer_2026',
    category: 'WhatsApp / Email Notice',
    desc: 'Direct messaging channel avoiding formal recruitment ATS'
  },
  {
    label: 'EdTech Deposit Trap',
    url: 'https://guaranteed-placement-bootcamp.online/pay-deposit',
    category: 'Checkout / Subscription Page',
    desc: 'Predatory training fee & non-refundable seat deposit'
  }
];

export const AuditInputForm: React.FC<AuditInputFormProps> = ({
  onAudit,
  isLoading,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'url'>('text');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [categoryHint, setCategoryHint] = useState('Auto-Detect Type');
  const [scanStepIndex, setScanStepIndex] = useState(0);
  
  // Image state
  const [imageFile, setImageFile] = useState<{
    base64: string;
    name: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progressive loading steps simulation during analysis
  useEffect(() => {
    if (!isLoading) {
      setScanStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setScanStepIndex(prev => (prev < 3 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle global paste for images or URLs
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          processImageFile(file);
          setActiveTab('image');
          return;
        }
      }

      // If user pasted a URL directly while on text tab or anywhere, check if it starts with http
      const text = e.clipboardData?.getData('text') || '';
      if (/^https?:\/\/[^\s]+$/i.test(text.trim()) && activeTab !== 'image') {
        // Can optionally suggest or keep
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImageFile({
        base64,
        name: file.name,
        mimeType: file.type,
        previewUrl: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageFile && !inputUrl.trim()) {
      return;
    }

    onAudit({
      text: inputText.trim() || undefined,
      imageBase64: imageFile?.base64,
      mimeType: imageFile?.mimeType,
      url: inputUrl.trim() || undefined,
      categoryHint: categoryHint !== 'Auto-Detect Type' ? categoryHint : undefined,
    });
  };

  const scanSteps = [
    activeTab === 'url' ? 'Inspecting URL domain, SSL certificate & DNS hoster...' : 'Parsing document clauses & micro-text typography...',
    activeTab === 'url' ? 'Grounding with Google Search for student scam reports & reviews...' : 'Cross-referencing UGC directives & statutory labor laws...',
    activeTab === 'url' ? 'Crawling page body for hidden checkout traps & upfront fees...' : 'Detecting dark patterns, exit penalties & phishing domains...',
    'Synthesizing risk assessment & protective counter-reply template...'
  ];

  return (
    <div className="bg-white dark:bg-[#0b101c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-5 sm:p-7 relative overflow-hidden transition-colors">
      
      {/* Top Banner and Category Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400 stroke-[2.2]" />
            <span>Document & Clause Security Auditor</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit internship offer letters, PG lease contracts, phishing links, and course checkout pages.
          </p>
        </div>

        {/* Category Hint Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="category-hint" className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Document Context:
          </label>
          <select
            id="category-hint"
            value={categoryHint}
            onChange={(e) => setCategoryHint(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-[#070a12] border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Switcher: Text vs Image Upload vs Link Scanner */}
      <div className="flex items-center gap-2 mt-5 mb-4">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Paste Text or Contract</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'image'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Upload Screenshot</span>
            {imageFile && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Scan Link / URL</span>
            {inputUrl && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'text' ? (
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste suspicious WhatsApp job message, internship agreement clauses, bond stipulations, or PG rental lease here...&#10;&#10;e.g. 'To secure your software engineering internship, candidate must submit ₹4,999 towards training fees and deposit original 10th/12th grade marksheets with HR for 12 months...'"
              rows={8}
              className="w-full bg-slate-50 dark:bg-[#070a12] border border-slate-300 dark:border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-[#070a12] font-mono leading-relaxed transition-all resize-y"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute top-3 right-3 p-1 rounded-md bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 dark:text-slate-500">
              <span>Include full clauses, email headers, or payment conditions for highest precision.</span>
              <span className="font-mono tabular-nums">{inputText.length} characters</span>
            </div>
          </div>
        ) : activeTab === 'image' ? (
          <div>
            {imageFile ? (
              <div className="border border-cyan-300 dark:border-cyan-500/30 rounded-xl bg-slate-50 dark:bg-[#070a12] p-4 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imageFile.previewUrl}
                  alt="Audit preview"
                  className="w-36 h-36 object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                />
                <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Image Ready for Vision Analysis</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-sm">
                    {imageFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    StudentShield AI will inspect micro-print clauses, deceptive fees, fake domain signatures, and countdown banners directly.
                  </p>
                  
                  {/* Optional supplementary note */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Optional note (e.g., 'Received via WhatsApp from an unverified +91 recruiter')"
                      className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="sm:self-start p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-[#070a12]/70 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-[#070a12]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processImageFile(e.target.files[0]);
                    }
                  }}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-slate-800/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-1 border border-cyan-100 dark:border-slate-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to select or drag & drop document screenshot
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Upload screenshots of WhatsApp chats, email headers, course checkout pages, or contract clauses (PNG, JPG, WebP).
                  </p>
                  <div className="pt-1.5">
                    <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 px-2.5 py-1 rounded-md font-medium">
                      Or press Ctrl+V / ⌘+V to paste screenshot directly
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Link / URL Scanner Tab */
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center rounded-xl bg-slate-50 dark:bg-[#070a12] border border-slate-300 dark:border-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all p-2">
                <div className="flex items-center gap-2 pl-2 pr-3 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-mono font-medium hidden sm:inline">URL</span>
                </div>

                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste suspicious website URL, e.g. https://internshala-verify-hiring.top or https://t.me/recruiter..."
                  className="flex-1 bg-transparent border-0 px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
                />

                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl('')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-1"
                    title="Clear URL"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Powered by <strong>Google Search Grounding</strong> for live domain scam verification.</span>
                </span>
                {inputUrl && (
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 truncate max-w-xs">
                    Target: {inputUrl.replace(/^https?:\/\//i, '').split('/')[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Optional note with URL */}
            <div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Optional context (e.g. 'Received from an unverified recruiter claiming to offer an off-campus role')"
                className="w-full bg-slate-50 dark:bg-[#070a12] border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quick Sample Links */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Test Live Link Scanner with Known Scam Patterns:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_URLS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputUrl(sample.url);
                      setCategoryHint(sample.category);
                    }}
                    className="p-2 text-left rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      <span>{sample.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {sample.url.replace('https://', '')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading Progress State */}
        {isLoading && (
          <div className="p-4 rounded-xl bg-cyan-50 dark:bg-slate-900/90 border border-cyan-200 dark:border-cyan-500/30 space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Forensic Security Audit in Progress</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">Step {scanStepIndex + 1} of 4</span>
            </div>
            <div className="w-full bg-cyan-200/60 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-600 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-sky-400 h-full transition-all duration-500" 
                style={{ width: `${((scanStepIndex + 1) / 4) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
              &gt; {scanSteps[scanStepIndex]}
            </p>
          </div>
        )}

        {/* Action Controls & Preset Loaders */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mr-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Try Case:
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectPreset(PRESET_CASES[0]);
                setInputText(PRESET_CASES[0].inputText);
                setCategoryHint(PRESET_CASES[0].category);
                setActiveTab('text');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs font-medium"
            >
              Fake ₹4,999 Fee
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectPreset(PRESET_CASES[1]);
                setInputText(PRESET_CASES[1].inputText);
                setCategoryHint(PRESET_CASES[1].category);
                setActiveTab('text');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs font-medium"
            >
              Certificate Bond
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectPreset(PRESET_CASES[3]);
                setInputText(PRESET_CASES[3].inputText);
                setCategoryHint(PRESET_CASES[3].category);
                setActiveTab('text');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs font-medium"
            >
              Campus Phishing
            </button>
          </div>

          {/* Audit CTA Button */}
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !imageFile && !inputUrl.trim())}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isLoading || (!inputText.trim() && !imageFile && !inputUrl.trim())
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                <span>Auditing {activeTab === 'url' ? 'Link Safety' : 'Document'}...</span>
              </>
            ) : (
              <>
                <span>{activeTab === 'url' ? 'Scan Link & Verify Scam' : 'Run Forensic Audit'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Safety Notice Strip */}
      <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span>
          Audits against <strong>Financial Traps</strong>, <strong>Phishing Links & Domains</strong>, <strong>Hostage Agreements</strong>, and <strong>Consumer Dark Patterns</strong>.
        </span>
      </div>
    </div>
  );
};
