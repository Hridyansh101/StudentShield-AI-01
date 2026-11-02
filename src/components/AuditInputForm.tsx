import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  X, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Mic,
  MicOff,
  Radio,
  Play,
  Pause,
  Headphones,
  PhoneCall,
  Volume2
} from 'lucide-react';
import { PRESET_CASES } from '../data/presets';
import { PresetCase } from '../types';

interface AuditInputFormProps {
  onAudit: (params: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    url?: string;
    audioBase64?: string;
    audioMimeType?: string;
    audioFileName?: string;
    audioDuration?: number;
    categoryHint?: string;
  }) => Promise<void>;
  isLoading: boolean;
  onSelectPreset: (preset: PresetCase) => void;
  onOpenLiveVoice?: () => void;
}

const CATEGORIES = [
  'Auto-Detect Type',
  'Recruiter Phone Call / Audio',
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
  onOpenLiveVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'url' | 'audio'>('text');
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

  // Audio state
  const [audioFile, setAudioFile] = useState<{
    base64: string;
    name: string;
    mimeType: string;
    previewUrl: string;
    duration?: number;
  } | null>(null);

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);
  const [inputNotice, setInputNotice] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  // Handle global paste for images
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
        if (file.type.startsWith('audio/')) {
          e.preventDefault();
          processAudioFile(file);
          setActiveTab('audio');
          return;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setInputNotice('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    setInputNotice(null);

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

  const processAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|aac|opus)$/i)) {
      setInputNotice('Please upload a valid audio recording (MP3, WAV, M4A, OGG, WEBM, AAC).');
      return;
    }
    setInputNotice(null);
    setMicErrorNotice(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setAudioFile({
        base64,
        name: file.name,
        mimeType: file.type || 'audio/mp3',
        previewUrl: base64,
      });
      setCategoryHint('Recruiter Phone Call / Audio');
    };
    reader.readAsDataURL(file);
  };

  // Start microphone recording
  const startRecording = async () => {
    setMicErrorNotice(null);
    setInputNotice(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicErrorNotice('Live microphone recording is not supported in this browser. You can upload an audio file (.mp3, .wav) or select a sample call below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioFile({
            base64,
            name: `Recorded_Recruiter_Call_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`,
            mimeType: mimeType || 'audio/webm',
            previewUrl: URL.createObjectURL(audioBlob),
            duration: recordingSeconds,
          });
          setCategoryHint('Recruiter Phone Call / Audio');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access notice:', err);
      const isDenied = 
        err?.name === 'NotAllowedError' || 
        err?.name === 'PermissionDeniedError' || 
        err?.message?.includes('Permission denied') || 
        err?.message?.includes('denied');

      if (isDenied) {
        setMicErrorNotice('Microphone permission was denied by your browser or host frame. Please grant microphone permission in your browser address bar icon, or upload an audio file / select a sample call below.');
      } else {
        setMicErrorNotice(err?.message || 'Unable to access microphone on this device. You can upload an audio file or select a sample call below.');
      }
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|ogg|webm|aac)$/i)) {
        processAudioFile(file);
        setActiveTab('audio');
      } else if (file.type.startsWith('image/')) {
        processImageFile(file);
        setActiveTab('image');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageFile && !inputUrl.trim() && !audioFile) {
      return;
    }

    onAudit({
      text: inputText.trim() || undefined,
      imageBase64: imageFile?.base64,
      mimeType: imageFile?.mimeType,
      url: inputUrl.trim() || undefined,
      audioBase64: audioFile?.base64,
      audioMimeType: audioFile?.mimeType,
      audioFileName: audioFile?.name,
      audioDuration: audioFile?.duration,
      categoryHint: categoryHint !== 'Auto-Detect Type' ? categoryHint : undefined,
    });
  };

  const scanSteps = [
    activeTab === 'audio' ? 'Transcribing spoken call recording & detecting speaker cues...' :
    activeTab === 'url' ? 'Inspecting URL domain, SSL certificate & DNS hoster...' : 'Parsing document clauses & micro-text typography...',
    activeTab === 'audio' ? 'Analyzing telephonic pressure, ambient VoIP noise & fee extortion...' :
    activeTab === 'url' ? 'Grounding with Google Search for student scam reports & reviews...' : 'Cross-referencing UGC directives & statutory labor laws...',
    activeTab === 'audio' ? 'Synthesizing verbatim transcript & counter-response script...' :
    activeTab === 'url' ? 'Crawling page body for hidden checkout traps & upfront fees...' : 'Detecting dark patterns, exit penalties & phishing domains...',
    'Synthesizing risk assessment & protective legal reply template...'
  ];

  return (
    <div className="bg-white dark:bg-[#0b101c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-5 sm:p-7 relative overflow-hidden transition-colors">
      
      {/* Top Banner and Category Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400 stroke-[2.2]" />
            <span>Document & Audio Forensic Security Auditor</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit phone call recordings, internship offer letters, PG lease contracts, phishing links, and fee scams.
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

      {/* Tab Switcher: Text vs Image Upload vs Link Scanner vs Audio Call Recording */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 mb-4">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Audio / Call Recording</span>
            {audioFile && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>

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

        {/* Live Voice Shield Trigger CTA */}
        {onOpenLiveVoice && (
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500/10 via-cyan-500/10 to-indigo-500/10 hover:from-rose-500/20 hover:via-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 transition-all cursor-pointer shrink-0"
            title="Start live voice session with Gemini 3.8 Live"
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Live Voice Shield</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
              Live API
            </span>
          </button>
        )}
      </div>

      {/* Input Notice (File format / Drag drop alerts) */}
      {inputNotice && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{inputNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setInputNotice(null)}
            className="p-1 hover:text-amber-950 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* TAB 1: AUDIO / CALL RECORDING */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            
            {audioFile ? (
              <div className="border border-rose-300 dark:border-rose-900/60 rounded-xl bg-slate-50 dark:bg-[#070a12] p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/40">
                  <Headphones className="w-7 h-7" />
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left min-w-0 w-full">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audio Recording Attached & Ready for Forensic Transcription</span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">
                    {audioFile.name}
                  </p>

                  {/* HTML5 Audio Player */}
                  <div className="pt-1 w-full max-w-md">
                    <audio
                      src={audioFile.previewUrl}
                      controls
                      className="w-full h-8 rounded-lg accent-rose-600"
                    />
                  </div>

                  {/* Optional supplementary note */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Optional details (e.g. 'Recruiter called at 2 PM from +91 number claiming to be from Infosys HR')"
                      className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="sm:self-start p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                  title="Remove audio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A: Upload Audio File */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => audioInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                    dragOver
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-[#070a12]/70 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-[#070a12]'
                  }`}
                >
                  <input
                    type="file"
                    ref={audioInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processAudioFile(e.target.files[0]);
                      }
                    }}
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.opus"
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-slate-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-slate-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Upload Recruiter Audio / Call Recording
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                    Drop call recordings or WhatsApp voice notes (MP3, WAV, M4A, OGG, WEBM, AAC).
                  </p>
                  <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md">
                    Max 30MB audio
                  </span>
                </div>

                {/* Option B: Record Live Call / Voice Note */}
                <div className="border border-slate-300 dark:border-slate-800 rounded-xl p-6 bg-slate-50/80 dark:bg-[#070a12]/70 flex flex-col items-center justify-center text-center space-y-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/30' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <Mic className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isRecording ? 'Recording Live Call / Memo...' : 'Record Recruiter Call with Microphone'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                      {isRecording 
                        ? 'Keep your call speaker on. StudentShield AI will transcribe & audit everything.' 
                        : 'Record a phone call on speaker or your own voice description of the scam.'}
                    </p>
                  </div>

                  {isRecording ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                        <span>{formatTimer(recordingSeconds)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md"
                      >
                        Stop & Attach Recording
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 w-full flex flex-col items-center">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-500" />
                        <span>{micErrorNotice ? 'Try Microphone Again' : 'Start Recording'}</span>
                      </button>

                      {micErrorNotice && (
                        <div className="w-full p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-left text-xs space-y-2 mt-1">
                          <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                            <span className="leading-relaxed">{micErrorNotice}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Retry Permission
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const preset = PRESET_CASES.find(p => p.id === 'recruiter-call-laptop-deposit');
                                if (preset) {
                                  setAudioFile({
                                    base64: preset.sampleAudioBase64 || '',
                                    name: preset.sampleAudioName || 'recruiter_call_3500fee.wav',
                                    mimeType: 'audio/wav',
                                    previewUrl: preset.sampleAudioBase64 || '',
                                    duration: preset.sampleAudioDuration || 38,
                                  });
                                  setInputText(preset.inputText);
                                  setCategoryHint('Recruiter Phone Call / Audio');
                                  setMicErrorNotice(null);
                                }
                              }}
                              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Load Demo Call
                            </button>
                            <button
                              type="button"
                              onClick={() => audioInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => setMicErrorNotice(null)}
                              className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline cursor-pointer ml-auto"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Test Audio Scam Presets */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Test Audio Analysis with Sample Recruiter Phone Calls:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const preset = PRESET_CASES.find(p => p.id === 'recruiter-call-laptop-deposit');
                    if (preset) {
                      setAudioFile({
                        base64: preset.sampleAudioBase64 || '',
                        name: preset.sampleAudioName || 'recruiter_call_3500fee.wav',
                        mimeType: 'audio/wav',
                        previewUrl: preset.sampleAudioBase64 || '',
                        duration: preset.sampleAudioDuration || 38,
                      });
                      setInputText(preset.inputText);
                      setCategoryHint('Recruiter Phone Call / Audio');
                    }
                  }}
                  className="p-2.5 text-left rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                      <span>Recruiter Call: ₹3,500 Kit Fee</span>
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    Caller threatens batch slot cancellation within 15 mins.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const preset = PRESET_CASES.find(p => p.id === 'whatsapp-voice-note-stipend-scam');
                    if (preset) {
                      setAudioFile({
                        base64: preset.sampleAudioBase64 || '',
                        name: preset.sampleAudioName || 'whatsapp_voicenote_1999_internship.wav',
                        mimeType: 'audio/wav',
                        previewUrl: preset.sampleAudioBase64 || '',
                        duration: preset.sampleAudioDuration || 24,
                      });
                      setInputText(preset.inputText);
                      setCategoryHint('Recruiter Phone Call / Audio');
                    }
                  }}
                  className="p-2.5 text-left rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>WhatsApp Memo: Direct ₹30k Stipend</span>
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    No coding test, pay ₹1,999 before 5 PM to confirm offer.
                  </div>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: TEXT INPUT */}
        {activeTab === 'text' && (
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste suspicious WhatsApp job message, internship agreement clauses, bond stipulations, or call transcript here...&#10;&#10;e.g. 'Caller: Hello Rohit, your profile is selected for Python Full Stack internship with INR 25,000 stipend. You must immediately transfer INR 3,500 towards developer workbench registration before our batch closes in 15 minutes...'"
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
              <span>Include full clauses, call dialogue, or payment conditions for highest precision.</span>
              <span className="font-mono tabular-nums">{inputText.length} characters</span>
            </div>
          </div>
        )}

        {/* TAB 3: IMAGE UPLOAD */}
        {activeTab === 'image' && (
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
                  
                  <div className="pt-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Optional note (e.g., 'Received via WhatsApp from an unverified recruiter')"
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
                    Upload screenshots of WhatsApp chats, email headers, course checkout pages, or contract clauses.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LINK / URL SCANNER */}
        {activeTab === 'url' && (
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
                  <span>Powered by <strong>Google Search Grounding</strong> for domain scam verification.</span>
                </span>
                {inputUrl && (
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 truncate max-w-xs">
                    Target: {inputUrl.replace(/^https?:\/\//i, '').split('/')[0]}
                  </span>
                )}
              </div>
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
                const p = PRESET_CASES.find(c => c.id === 'recruiter-call-laptop-deposit');
                if (p) {
                  onSelectPreset(p);
                  setAudioFile({
                    base64: p.sampleAudioBase64 || '',
                    name: p.sampleAudioName || 'recruiter_call.wav',
                    mimeType: 'audio/wav',
                    previewUrl: p.sampleAudioBase64 || '',
                    duration: p.sampleAudioDuration,
                  });
                  setInputText(p.inputText);
                  setCategoryHint('Recruiter Phone Call / Audio');
                  setActiveTab('audio');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 whitespace-nowrap border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer text-xs font-semibold"
            >
              Recruiter Call (₹3,500 Fee)
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectPreset(PRESET_CASES[0]);
                setInputText(PRESET_CASES[0].inputText);
                setCategoryHint(PRESET_CASES[0].category);
                setActiveTab('text');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs font-medium"
            >
              Fake ₹4,999 Fee Letter
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectPreset(PRESET_CASES[1]);
                setInputText(PRESET_CASES[1].inputText);
                setCategoryHint(PRESET_CASES[1].category);
                setActiveTab('text');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs font-medium"
            >
              Certificate Bond
            </button>
          </div>

          {/* Audit CTA Button */}
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !imageFile && !inputUrl.trim() && !audioFile)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isLoading || (!inputText.trim() && !imageFile && !inputUrl.trim() && !audioFile)
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                <span>
                  {activeTab === 'audio' ? 'Transcribing & Auditing Call...' :
                   activeTab === 'url' ? 'Auditing Link Safety...' : 'Auditing Document...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {activeTab === 'audio' ? 'Transcribe & Audit Audio Call' :
                   activeTab === 'url' ? 'Scan Link & Verify Scam' : 'Run Forensic Audit'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Safety Notice Strip */}
      <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>
            Audits against <strong>Recruiter Call Fraud</strong>, <strong>Upfront Training Fees</strong>, <strong>Hostage Agreements</strong>, and <strong>Phishing Portals</strong>.
          </span>
        </div>

        {onOpenLiveVoice && (
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Talk live with AI Counselor</span>
            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
          </button>
        )}
      </div>
    </div>
  );
};
