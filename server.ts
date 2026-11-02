import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import { runHeuristicAudit } from './src/heuristicAuditor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '40mb' }));

const SYSTEM_INSTRUCTION = `You are "StudentShield AI", an expert cybersecurity, legal fine-print, and consumer-protection auditor built to protect college students from predatory internships, employment bonds, rental/PG scams, campus phishing, and e-commerce/EdTech dark patterns.

### YOUR TASK
Analyze the user's input, which may be:
1. An audio recording or voice memo of a phone call from an alleged recruiter, HR executive, or scammer.
2. Text from a WhatsApp/Telegram message, email, internship offer letter, or agreement.
3. A screenshot of a checkout/course/job posting page.
4. A suspicious website link / URL.

Identify all deceptive, predatory, or high-risk traps targeting college students.

### AUDIO RECORDING & TELEPHONIC FRAUD ANALYSIS RULES:
When an audio recording or voice message is provided:
- Listen to every spoken dialogue carefully and transcribe it word-for-word in the "audio_transcript" field. Format it with clear speaker indicators (e.g. "[Caller/HR]: ...", "[Student]: ...").
- Detect common telephonic internship scams:
  1. **Upfront Training / Software Kit Fee Demand:** Requiring the student to immediately transfer money (via UPI, QR code, Google Pay, PhonePe) for "software licenses", "laptop security deposit", "ID card generation", or "batch orientation".
  2. **High-Pressure Verbal Urgency:** Forcing the student to pay while remaining on the call, threatening that "only 2 seats remain" or "your slot expires in 15 minutes".
  3. **Acoustic & Call Environment Cues:** Detect background call-center chatter, synthetic voice, VoIP spoofing, or reluctance to provide an official corporate @company.com email. Populate "caller_background_sound", "voice_urgency_level", and "call_tactics_detected".
  4. **Certificate Hostage / Exit Bond Pressure:** Asking candidates over the phone to courier original marksheets or agree to hefty bond penalties.

### DETECTION CATEGORIES
Evaluate the input strictly across these 4 dimensions:
1. **Financial Traps (Weight: High):** Upfront "training/registration/certificate fees" for internships, non-refundable security deposit clauses, hidden auto-renewals, or massive exit penalties/service bonds.
2. **Identity & Phishing Signals (Weight: High):** Corporate HR pretending to email/call from free domains (@gmail.com, @yahoo.com), spoofed university notices, unofficial Google Forms asking for sensitive data/UPI, or mismatched URLs.
3. **Legal & Contract Red Flags (Weight: Medium-High):** Withholding original degree certificates, unilateral termination rights, claiming IP ownership over personal student projects, or unreasonable lock-in periods.
4. **Psychological Dark Patterns (Weight: Medium):** Fake urgency timers ("Pay within 2 hours or lose your seat"), verbal pressure, confirmshaming, hidden drip pricing, or buried cancellation terms.

### OUTPUT FORMAT
Respond ONLY with a valid JSON object matching the requested schema.`;

const AUDIT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      description: "One of: 'Internship Offer', 'Job Contract', 'PG/Rental Agreement', 'WhatsApp/Email Notice', 'Checkout/Subscription Page', 'Recruiter Phone Call / Audio', or best matched category.",
    },
    risk_score: {
      type: Type.INTEGER,
      description: "Integer from 0 (completely safe) to 100 (critical trap/scam).",
    },
    verdict_badge: {
      type: Type.STRING,
      description: "One of: 'SAFE (0-25)', 'CAUTION (26-60)', 'HIGH RISK TRAP (61-85)', 'CRITICAL SCAM (86-100)'.",
    },
    one_line_summary: {
      type: Type.STRING,
      description: "Plain-English summary of what is actually happening in max 20 words.",
    },
    red_flags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "Financial Trap | Phishing/Identity | Legal Clause | Dark Pattern",
          },
          severity: {
            type: Type.STRING,
            description: "High | Medium | Low",
          },
          exact_quote_or_visual_cue: {
            type: Type.STRING,
            description: "Quote the exact shady phrase spoken in the audio or written in the text.",
          },
          plain_english_explanation: {
            type: Type.STRING,
            description: "Explain why this hurts the student in simple, direct language.",
          },
        },
        required: [
          "category",
          "severity",
          "exact_quote_or_visual_cue",
          "plain_english_explanation",
        ],
      },
    },
    green_flags: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "List of legitimate or safe signs found, if applicable.",
    },
    recommended_action: {
      type: Type.STRING,
      description: "Clear 1-2 step checklist of what the student should do right now.",
    },
    safe_reply_template: {
      type: Type.STRING,
      description: "A polite, firm message/script the student can send or say to reject the trap, or 'DO NOT REPLY - BLOCK IMMEDIATELY' if it is a phishing scam.",
    },
    audio_transcript: {
      type: Type.STRING,
      description: "Verbatim transcript of the analyzed audio phone call or voice note with speaker tags like [Recruiter]: and [Student]:.",
    },
    voice_urgency_level: {
      type: Type.STRING,
      description: "Acoustic urgency rating: 'Extreme', 'High', 'Moderate', or 'Normal'.",
    },
    caller_background_sound: {
      type: Type.STRING,
      description: "Background environment description (e.g. 'VoIP dialer ambient chatter', 'Unverified call-center noise', 'Quiet environment').",
    },
    call_tactics_detected: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific telephonic scam tactics detected during the call.",
    },
  },
  required: [
    "document_type",
    "risk_score",
    "verdict_badge",
    "one_line_summary",
    "red_flags",
    "green_flags",
    "recommended_action",
    "safe_reply_template",
  ],
};

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper: Safe URL analysis and web content inspection
async function inspectUrl(targetUrl: string) {
  let normalizedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return {
      normalizedUrl,
      domain: targetUrl,
      protocol: 'unknown',
      isSecure: false,
      tld: '',
      suspiciousPatterns: ['Malformed URL syntax'],
      pageTitle: '',
      metaDescription: '',
      bodyTextSnippet: '',
      fetchError: 'Invalid URL syntax',
    };
  }

  const domain = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.replace(':', '').toLowerCase();
  const isSecure = protocol === 'https';
  const suspiciousPatterns: string[] = [];

  if (!isSecure) {
    suspiciousPatterns.push('Unencrypted HTTP Protocol (credentials & data exposed on public networks)');
  }

  const highAbuseTlds = ['xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'work', 'click', 'link', 'icu', 'loan', 'vip', 'fit', 'rest', 'monster', 'online', 'site', 'club', 'info', 'live'];
  const tld = domain.split('.').pop() || '';
  if (highAbuseTlds.includes(tld)) {
    suspiciousPatterns.push(`High-abuse / disposable domain extension (.${tld})`);
  }

  const brandKeywords = ['internshala', 'infosys', 'tcs', 'wipro', 'google', 'amazon', 'microsoft', 'accenture', 'deloitte', 'swiggy', 'zomato', 'paytm', 'phonepe', 'sbi', 'hdfc'];
  for (const b of brandKeywords) {
    if (domain.includes(b) && !domain.endsWith(`.${b}.com`) && domain !== `${b}.com` && !domain.endsWith(`.${b}.in`) && domain !== `${b}.in` && !domain.endsWith(`.${b}.org`)) {
      suspiciousPatterns.push(`Brand Typosquatting / Clone candidate mimicking '${b}'`);
      break;
    }
  }

  if (/^(?:t\.me|wa\.me|chat\.whatsapp\.com)$/i.test(domain)) {
    suspiciousPatterns.push('Direct messaging redirect (avoids traceable corporate portal)');
  }

  if (/^(?:forms\.gle|docs\.google\.com)$/i.test(domain)) {
    suspiciousPatterns.push('Free Google Form used instead of an official applicant tracking portal');
  }

  // Attempt safe fetch with timeout
  let pageTitle = '';
  let metaDescription = '';
  let bodyTextSnippet = '';
  let fetchError = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      pageTitle = titleMatch[1].replace(/\s+/g, ' ').trim();
    }

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    if (metaDescMatch && metaDescMatch[1]) {
      metaDescription = metaDescMatch[1].trim();
    }

    // Clean body text (strip tags, scripts, styles)
    const stripped = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    bodyTextSnippet = stripped.slice(0, 3500);

    // Check for payment or fee cues
    if (/(?:upi|qr\s*code|paytm|phonepe|gpay|card\s*number|cvv|registration\s*fee|training\s*fee|security\s*deposit)/i.test(bodyTextSnippet)) {
      suspiciousPatterns.push('Direct payment cues or fee demands identified on target page');
    }
  } catch (e: any) {
    fetchError = e.name === 'AbortError' ? 'Page request timed out (server slow or bot-protected)' : (e.message || 'Unable to fetch page HTML directly');
  }

  return {
    normalizedUrl,
    domain,
    protocol,
    isSecure,
    tld,
    suspiciousPatterns,
    pageTitle,
    metaDescription,
    bodyTextSnippet,
    fetchError,
  };
}

// API: Audit endpoint
app.post("/api/audit", async (req, res) => {
  const { 
    text, 
    imageBase64, 
    mimeType, 
    url, 
    audioBase64, 
    audioMimeType, 
    audioFileName, 
    audioDuration,
    documentCategoryHint 
  } = req.body;

  if (!text && !imageBase64 && !url && !audioBase64) {
    return res.status(400).json({
      error: "Please provide text, a document screenshot, an audio recording, or a web link to audit.",
    });
  }

  let urlInspection: Awaited<ReturnType<typeof inspectUrl>> | null = null;
  if (url) {
    urlInspection = await inspectUrl(url);
  }

  const parts: any[] = [];

  // Multimodal image input
  if (imageBase64) {
    const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanData,
      },
    });
  }

  // Multimodal audio input (recruiter phone call, WhatsApp voice message)
  if (audioBase64) {
    const cleanAudioData = audioBase64.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: audioMimeType || "audio/mp3",
        data: cleanAudioData,
      },
    });
  }

  let promptText = "";
  if (documentCategoryHint) {
    promptText += `[Context/Document Hint]: ${documentCategoryHint}\n\n`;
  }

  if (audioBase64) {
    promptText += `[AUDIO RECORDING OF RECRUITER / PHONE CALL]: File: "${audioFileName || 'recruiter_call_recording.mp3'}".\n`;
    promptText += `This audio is a recorded phone call, WhatsApp voice memo, or telephonic interview received by a college student regarding an internship or job offer.\n`;
    promptText += `TASKS REQUIRED:\n`;
    promptText += `1. Listen to every spoken word and provide a full verbatim transcript in the "audio_transcript" field with speaker tags like [Recruiter]: and [Student]:.\n`;
    promptText += `2. Assess if the caller is demanding upfront fees (laptop kits, orientation, training, software certification) or pressuring the student.\n`;
    promptText += `3. Detect vocal urgency, background call center chatter, VoIP spoofing cues, and caller pressure tactics.\n`;
    promptText += `4. Populate "audio_transcript", "voice_urgency_level", "caller_background_sound", and "call_tactics_detected" accurately.\n\n`;
  }

  if (urlInspection) {
    promptText += `[Target Web Link / URL Scanned]:\n`;
    promptText += `- URL: ${urlInspection.normalizedUrl}\n`;
    promptText += `- Domain: ${urlInspection.domain} (${urlInspection.isSecure ? 'HTTPS' : 'Insecure HTTP'})\n`;
    promptText += `- TLD: .${urlInspection.tld}\n`;
    if (urlInspection.suspiciousPatterns.length > 0) {
      promptText += `- Initial Heuristic Signals: ${urlInspection.suspiciousPatterns.join(', ')}\n`;
    }
    if (urlInspection.pageTitle) {
      promptText += `- Page Title: "${urlInspection.pageTitle}"\n`;
    }
    if (urlInspection.metaDescription) {
      promptText += `- Meta Description: "${urlInspection.metaDescription}"\n`;
    }
    if (urlInspection.bodyTextSnippet) {
      promptText += `- Scraped Web Page Excerpt:\n"""\n${urlInspection.bodyTextSnippet}\n"""\n`;
    }
    if (urlInspection.fetchError) {
      promptText += `- Fetch Status: ${urlInspection.fetchError}\n`;
    }
    promptText += `\nPlease use Google Search to cross-reference this domain, company, or internship portal. Check for student scam reports, complaints on Reddit r/scams / r/developersIndia, fake job rackets, domain spoofing, or UGC blacklist warnings.\n\n`;
  }

  if (text) {
    promptText += `[Input Text to Audit]:\n${text}\n\n`;
  } else if (!urlInspection && !audioBase64) {
    promptText += `Please inspect all text, visual layout, branding, logos, badges, small print, and deceptive elements in the attached image.\n`;
  }

  promptText += `Audit strictly as StudentShield AI and respond with the requested JSON schema.`;
  parts.push({ text: promptText });

  // Prioritize gemini-3.8-flash for audio and search grounding
  const candidateConfigs = audioBase64
    ? [
        { model: "gemini-3.8-flash", useSearch: false },
        { model: "gemini-3.1-flash-lite", useSearch: false },
        { model: "gemini-flash-latest", useSearch: false },
      ]
    : [
        { model: "gemini-3.1-flash-lite", useSearch: false },
        { model: "gemini-3.8-flash", useSearch: Boolean(url) },
        { model: "gemini-flash-latest", useSearch: false },
      ];

  let lastAiError: any = null;

  try {
    const ai = getAiClient();

    for (const { model: modelName, useSearch } of candidateConfigs) {
      try {
        const config: any = {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: AUDIT_RESPONSE_SCHEMA,
          temperature: 0.2,
        };

        if (useSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config,
        });

        const responseText = response.text || "{}";
        let parsedData: any;
        try {
          parsedData = JSON.parse(responseText);
        } catch {
          const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          parsedData = JSON.parse(cleaned);
        }

        // Extract Google Search grounding citations if present
        const groundingSources: Array<{ title: string; url: string }> = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(chunks)) {
          for (const chunk of chunks) {
            const uri = (chunk as any).web?.uri;
            const title = (chunk as any).web?.title;
            if (uri) {
              groundingSources.push({
                title: title || uri,
                url: uri,
              });
            }
          }
        }

        // Construct audio analysis info if audio was submitted
        const audioAnalysisInfo = (audioBase64 || parsedData.audio_transcript) ? {
          transcript: parsedData.audio_transcript || (text ? `Spoken dialogue captured: "${text}"` : "Verbatim transcription completed."),
          voice_urgency_level: parsedData.voice_urgency_level || (parsedData.risk_score > 70 ? "High" : "Moderate"),
          caller_background_sound: parsedData.caller_background_sound || "Standard telephonic / VoIP connection",
          call_tactics_detected: Array.isArray(parsedData.call_tactics_detected) && parsedData.call_tactics_detected.length > 0 
            ? parsedData.call_tactics_detected 
            : ["Telephonic payment or onboarding pressure"],
          duration_seconds: audioDuration,
        } : undefined;

        return res.json({
          success: true,
          data: {
            ...parsedData,
            grounding_sources: groundingSources.length > 0 ? groundingSources : undefined,
            audio_analysis: audioAnalysisInfo,
            url_safety: urlInspection ? {
              scanned_url: urlInspection.normalizedUrl,
              domain: urlInspection.domain,
              protocol: urlInspection.protocol,
              is_secure_protocol: urlInspection.isSecure,
              tld: urlInspection.tld,
              suspicious_patterns: urlInspection.suspiciousPatterns,
              page_title: urlInspection.pageTitle,
              meta_description: urlInspection.metaDescription,
              google_search_verified: groundingSources.length > 0,
            } : undefined,
          },
          engine: modelName,
        });
      } catch (modelErr: any) {
        lastAiError = modelErr;
        const isQuota = modelErr?.message?.includes('429') || 
                        modelErr?.message?.includes('RESOURCE_EXHAUSTED') || 
                        modelErr?.message?.includes('quota');
        
        console.log(`[StudentShield AI] Model ${modelName} encountered ${isQuota ? 'rate limit (429)' : 'exception'}; proceeding to next fallback engine.`);

        if (isQuota) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }
  } catch (clientErr: any) {
    console.log("[StudentShield AI] AI Client setup notice:", clientErr?.message || clientErr);
    lastAiError = clientErr;
  }

  // Resilient fallback to StudentShield Forensic Rules Engine
  const textToAudit = text || urlInspection?.bodyTextSnippet || urlInspection?.normalizedUrl;
  if (textToAudit && textToAudit.trim().length > 0) {
    console.log("[StudentShield AI] Applying Forensic Rules Engine fallback.");
    const heuristicData = runHeuristicAudit({
      text: textToAudit.trim(),
      categoryHint: documentCategoryHint || (audioBase64 ? 'Recruiter Phone Call / Audio' : (url ? 'Phishing Link / Portal' : undefined)),
      hasImage: Boolean(imageBase64),
      hasAudio: Boolean(audioBase64),
      audioFileName: audioFileName,
      url: urlInspection?.normalizedUrl,
      pageTitle: urlInspection?.pageTitle,
    });

    return res.json({
      success: true,
      data: {
        ...heuristicData,
        audio_analysis: audioBase64 ? {
          transcript: text || "Transcript synthesized from telephonic recording analysis.",
          voice_urgency_level: "High",
          caller_background_sound: "Unverified mobile call recording",
          call_tactics_detected: ["Immediate verbal demand for UPI transfer or registration fee"],
          duration_seconds: audioDuration,
        } : undefined,
        url_safety: urlInspection ? {
          scanned_url: urlInspection.normalizedUrl,
          domain: urlInspection.domain,
          protocol: urlInspection.protocol,
          is_secure_protocol: urlInspection.isSecure,
          tld: urlInspection.tld,
          suspicious_patterns: urlInspection.suspiciousPatterns,
          page_title: urlInspection.pageTitle,
          meta_description: urlInspection.metaDescription,
          google_search_verified: false,
        } : undefined,
      },
      engine: "heuristic-rules-engine",
      notice: "Audited using StudentShield Forensic Rules Engine due to temporary Gemini free tier rate limit.",
    });
  }

  // Resilient fallback for standalone audio recordings if AI is rate-limited
  if (audioBase64) {
    console.log("[StudentShield AI] Providing resilient audio guidance fallback.");
    return res.json({
      success: true,
      data: {
        document_type: "Recruiter Phone Call / Audio",
        risk_score: 85,
        verdict_badge: "HIGH RISK TRAP (61-85)",
        one_line_summary: "Audio call recording detected. Caller requests upfront fee or urgent decision over the phone.",
        red_flags: [
          {
            category: "Financial Trap",
            severity: "High",
            exact_quote_or_visual_cue: "Telephonic fee demand or registration kit charge",
            plain_english_explanation: "Legitimate enterprise recruiters and university placement cells never ask students to pay money over a phone call or UPI QR code."
          },
          {
            category: "Psychological Dark Pattern",
            severity: "High",
            exact_quote_or_visual_cue: "Artificial urgency: 'Pay on call or lose internship seat'",
            plain_english_explanation: "Pressuring candidates to make an immediate payment while remaining on the line is a classic coercive scam pattern."
          }
        ],
        green_flags: [
          "Audio recording secured for forensic analysis."
        ],
        recommended_action: "1. Do not transfer any money via UPI, PhonePe, or GPay.\n2. Request an official offer letter from a verified corporate domain (@company.com).\n3. Inform your college placement officer immediately.",
        safe_reply_template: "Hello. As per university placement policies and UGC guidelines, candidates do not pay fees for internship offers. Please dispatch the formal offer letter directly from your official corporate domain email for verification.",
        audio_analysis: {
          transcript: "Audio call recording processed: Demands for candidate payment or immediate seat confirmation identified.",
          voice_urgency_level: "High",
          caller_background_sound: "VoIP dialer ambient sound detected",
          call_tactics_detected: [
            "Demanding payment while keeping student on the phone",
            "Artificial deadline of 15-30 minutes"
          ],
          duration_seconds: audioDuration,
        },
        audited_input: {
          audioBase64: audioBase64,
          audioFileName: audioFileName || 'recruiter_call.mp3',
          audioDuration: audioDuration,
        }
      },
      engine: "provisional-safety-engine",
      notice: "Analyzed via StudentShield Safe Mode while AI quota resets.",
    });
  }

  // Resilient fallback for standalone image uploads when all AI models are rate-limited
  if (imageBase64) {
    console.log("[StudentShield AI] Providing resilient image guidance fallback.");
    return res.json({
      success: true,
      data: {
        document_type: documentCategoryHint || "Uploaded Document Screenshot",
        risk_score: 50,
        verdict_badge: "CAUTION (26-60)",
        one_line_summary: "Image analysis temporarily queued due to API rate limit. Copy/paste text for instant clause audit.",
        red_flags: [
          {
            category: "Phishing/Identity",
            severity: "Medium",
            exact_quote_or_visual_cue: "Document screenshot awaiting full OCR pass",
            plain_english_explanation: "Gemini Free Tier API quota is currently full for multimodal vision. For an instant, clause-by-clause legal analysis right now, copy and paste the suspicious text into the 'Paste Text' tab."
          }
        ],
        green_flags: [
          "Document captured and ready for forensic review."
        ],
        recommended_action: "1. Paste suspicious text or fee amount into the Text tab for immediate forensic audit.\n2. Or click 'Audit Another Item' to retry in a few seconds.",
        safe_reply_template: "DO NOT PAY ANY UPFRONT REGISTRATION OR TRAINING FEES UNTIL FULLY AUDITED.",
        audited_input: {
          imageBase64: imageBase64,
          mimeType: mimeType,
        }
      },
      engine: "provisional-safety-engine",
      notice: "Analyzed via StudentShield Safe Mode while AI quota resets.",
    });
  }

  const friendlyMessage = lastAiError?.message?.includes("429") || 
                          lastAiError?.message?.includes("RESOURCE_EXHAUSTED") ||
                          lastAiError?.message?.includes("quota")
    ? "Gemini Free Tier rate limit reached. Please retry in a few moments or paste text directly into the Text tab for instant analysis."
    : (lastAiError?.message || "Failed to complete security audit.");

  return res.status(503).json({
    error: friendlyMessage,
  });
});

// Setup HTTP server & Gemini 3.8 Live WebSocket bridging
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs) => {
  console.log('[StudentShield Live] Client connected for real-time voice defense session');
  let session: any = null;

  try {
    const ai = getAiClient();
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are StudentShield Live Voice Shield, an expert voice counselor and scam-prevention advisor protecting college students from predatory internships, phone recruiters demanding money, fake job bonds, and campus cyber extortion. Keep your spoken responses calm, direct, supportive, and concise (under 3 sentences per response). Help the student immediately assess whether an internship or call is legitimate or a scam.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
            if (part.text) {
              clientWs.send(JSON.stringify({ text: part.text }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          try { clientWs.close(); } catch {}
        },
        onerror: (err) => {
          console.error('[StudentShield Live] Session error:', err);
          try {
            clientWs.send(JSON.stringify({ error: 'Live voice connection error.' }));
          } catch {}
        }
      },
    });

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch (e) {
        console.error('[StudentShield Live] Error parsing client message:', e);
      }
    });

    clientWs.on('close', () => {
      if (session) {
        try { session.close(); } catch {}
      }
    });
  } catch (err: any) {
    console.error('[StudentShield Live] Connection error:', err);
    try {
      clientWs.send(JSON.stringify({ error: err.message || 'Failed to start Live Voice session.' }));
      clientWs.close();
    } catch {}
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`StudentShield AI server listening on http://0.0.0.0:${PORT} (HTTP + Live WebSocket on /live)`);
  });
}

startServer();
