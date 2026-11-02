import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Radio, 
  Sparkles, 
  PhoneOff, 
  Volume2, 
  ShieldCheck, 
  AlertTriangle, 
  Send,
  MessageSquare
} from 'lucide-react';
import { pcmToBase64, playLiveAudioChunk } from '../utils/audioUtils';

interface LiveVoiceShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const LiveVoiceShieldModal: React.FC<LiveVoiceShieldModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [micPermissionBlocked, setMicPermissionBlocked] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  // Audio Context & WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<{ current: number }>({ current: 0 });

  // Assistant speaking status detection
  const speakingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setMicPermissionBlocked(false);
      startLiveSession();
    } else {
      cleanupLiveSession();
    }

    return () => {
      cleanupLiveSession();
    };
  }, [isOpen]);

  const startLiveSession = async () => {
    setStatus('connecting');
    setErrorMessage(null);
    setMicPermissionBlocked(false);

    try {
      // Connect to server WebSocket at /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setStatus('connected');
        try {
          // Setup 24kHz audio context for model voice output
          outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 24000,
          });
          nextStartTimeRef.current = { current: outputAudioCtxRef.current.currentTime };

          // Setup microphone stream (16kHz for Gemini Live input)
          await setupMicrophone(ws);
        } catch (micErr: any) {
          console.warn('Microphone setup handled gracefully:', micErr);
          const isDenied = 
            micErr?.name === 'NotAllowedError' || 
            micErr?.name === 'PermissionDeniedError' || 
            micErr?.message?.includes('Permission denied') || 
            micErr?.message?.includes('denied');
          if (isDenied) {
            setMicPermissionBlocked(true);
            setIsMuted(true);
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.error) {
            setErrorMessage(msg.error);
            setStatus('error');
            return;
          }

          if (msg.audio && outputAudioCtxRef.current) {
            setStatus('speaking');
            playLiveAudioChunk(outputAudioCtxRef.current, msg.audio, nextStartTimeRef.current);

            // Reset speaking status shortly after audio finishes
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(() => {
              setStatus('connected');
            }, 1200);
          }

          if (msg.text) {
            setTranscriptHistory((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + ' ' + msg.text }
                ];
              }
              return [
                ...prev,
                { sender: 'assistant', text: msg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              ];
            });
          }

          if (msg.interrupted) {
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current.current = outputAudioCtxRef.current.currentTime;
            }
            setStatus('connected');
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
        setErrorMessage('WebSocket connection failed. Ensure server is active.');
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('idle');
      };
    } catch (err: any) {
      console.error('Failed to initiate live session:', err);
      setErrorMessage(err.message || 'Unable to connect to Live API.');
      setStatus('error');
    }
  };

  const setupMicrophone = async (ws: WebSocket) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });
    inputAudioCtxRef.current = inputAudioCtx;

    const source = inputAudioCtx.createMediaStreamSource(stream);
    const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(inputAudioCtx.destination);

    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN && !isMuted) {
        const float32 = e.inputBuffer.getChannelData(0);
        // Only send if there is actual acoustic volume above background silence
        let maxVal = 0;
        for (let i = 0; i < float32.length; i++) {
          if (Math.abs(float32[i]) > maxVal) maxVal = Math.abs(float32[i]);
        }
        if (maxVal > 0.02) {
          const base64Audio = pcmToBase64(float32);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      }
    };
  };

  const cleanupLiveSession = () => {
    clearTimeout(speakingTimeoutRef.current);

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try { inputAudioCtxRef.current.close(); } catch {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try { outputAudioCtxRef.current.close(); } catch {}
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    setStatus('idle');
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const promptText = textInput.trim();
    setTextInput('');

    // Append to local log
    setTranscriptHistory((prev) => [
      ...prev,
      { sender: 'user', text: promptText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    // Send to Live API via WebSocket
    wsRef.current.send(JSON.stringify({ text: promptText }));
  };

  const handleQuickTopic = (question: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setTranscriptHistory((prev) => [
      ...prev,
      { sender: 'user', text: question, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    wsRef.current.send(JSON.stringify({ text: question }));
  };

  const handleRetryMic = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try {
      await setupMicrophone(wsRef.current);
      setMicPermissionBlocked(false);
      setIsMuted(false);
    } catch (err: any) {
      console.warn('Microphone permission retry notice:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Live Voice Shield
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  Gemini 3.8 Live API
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time spoken scam defense & telephonic recruiter deflection counselor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            title="Close voice shield"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Orb & Audio Wave */}
        <div className="p-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#070a12] dark:via-[#0b101c] dark:to-[#070a12] border-b border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
          
          {/* Pulsing Visualizer Node */}
          <div className="relative flex items-center justify-center">
            {status === 'speaking' && (
              <div className="absolute w-28 h-28 rounded-full bg-cyan-500/20 animate-ping" />
            )}
            {status === 'connected' && !isMuted && (
              <div className="absolute w-24 h-24 rounded-full bg-indigo-500/10 animate-pulse" />
            )}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 scale-105 shadow-cyan-500/30'
                : status === 'connected'
                ? isMuted
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  : 'bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white shadow-indigo-500/20'
                : status === 'connecting'
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-rose-500 text-white'
            }`}>
              {status === 'speaking' ? (
                <Volume2 className="w-8 h-8 animate-bounce" />
              ) : isMuted ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </div>
          </div>

          {/* Status Label */}
          <div className="text-center space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                status === 'speaking'
                  ? 'bg-cyan-500 animate-ping'
                  : status === 'connected'
                  ? 'bg-emerald-500'
                  : status === 'connecting'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`} />
              <span>
                {status === 'speaking'
                  ? 'StudentShield is Speaking...'
                  : status === 'connected'
                  ? isMuted ? 'Microphone Muted (Type below)' : 'Listening: Speak to your counselor'
                  : status === 'connecting'
                  ? 'Connecting to Gemini Live API...'
                  : 'Connection Notice'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
              Ask anything: "Is a ₹4,000 laptop deposit normal?", "Can they confiscate my original degree?", or "How to decline firmly?"
            </p>
          </div>

          {/* Quick Voice Question Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg pt-1">
            <button
              type="button"
              onClick={() => handleQuickTopic("A recruiter called me asking for ₹3,500 for training kit. Is this a scam?")}
              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              "Asking ₹3,500 for kit fee?"
            </button>
            <button
              type="button"
              onClick={() => handleQuickTopic("Can an employer legally withhold my original degree certificates?")}
              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              "Can they hold my degree certificates?"
            </button>
            <button
              type="button"
              onClick={() => handleQuickTopic("What is the official helpline number to report fake internship fraud?")}
              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              "How to report to Cyber Crime 1930?"
            </button>
          </div>
        </div>

        {/* Live Conversation Transcript Box */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 min-h-[140px] max-h-[220px] bg-slate-50/50 dark:bg-[#070a12]/50">
          {micPermissionBlocked && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <MicOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="leading-tight">
                  Microphone is muted (permission denied). Live spoken audio from Gemini is active — type your questions below or grant mic access.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRetryMic}
                className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] self-start sm:self-auto cursor-pointer transition-colors whitespace-nowrap"
              >
                Grant Mic
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {transcriptHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs space-y-1">
              <MessageSquare className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
              <p>Your spoken conversation will appear here in real time.</p>
              <p className="text-[11px] text-slate-400">Speak into your mic or click any topic above.</p>
            </div>
          ) : (
            transcriptHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                  item.sender === 'user'
                    ? 'ml-auto bg-cyan-600 text-white rounded-br-xs'
                    : 'mr-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-bl-xs shadow-xs'
                }`}
              >
                <div className="text-[10px] font-mono opacity-80 mb-0.5">
                  {item.sender === 'user' ? 'You' : 'StudentShield Voice Counselor'} · {item.time}
                </div>
                <p>{item.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer Controls & Text Fallback */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101c] flex flex-col gap-3">
          
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={micPermissionBlocked ? "Microphone muted — type your question here and press Enter..." : "Or type your question here if you prefer not to speak..."}
              className="flex-1 bg-slate-50 dark:bg-[#070a12] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || status !== 'connected'}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition-colors cursor-pointer"
              title="Send text to live counselor"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Low-latency audio streaming enabled (Gemini 3.8 Live).</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
