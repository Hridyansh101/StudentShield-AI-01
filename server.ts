import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { runHeuristicAudit } from './src/heuristicAuditor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

const SYSTEM_INSTRUCTION = `You are "StudentShield AI", an expert cybersecurity, legal fine-print, and consumer-protection auditor built to protect college students from predatory internships, employment bonds, rental/PG scams, campus phishing, and e-commerce/EdTech dark patterns.

### YOUR TASK
Analyze the user's input (which may be text from a WhatsApp/Telegram forward, an email, an internship offer letter, a PG/hostel lease agreement, or a screenshot of a checkout/course page). Identify all deceptive, predatory, or high-risk traps.

### DETECTION CATEGORIES
Evaluate the input strictly across these 4 dimensions:
1. **Financial Traps (Weight: High):** Upfront "training/registration/certificate fees" for internships, non-refundable security deposit clauses, hidden auto-renewals, or massive exit penalties/service bonds.
2. **Identity & Phishing Signals (Weight: High):** Corporate HR pretending to email from free domains (@gmail.com, @yahoo.com), spoofed university notices, unofficial Google Forms asking for sensitive data/UPI, or mismatched URLs.
3. **Legal & Contract Red Flags (Weight: Medium-High):** Withholding original degree certificates, unilateral termination rights, claiming IP ownership over personal student projects, or unreasonable lock-in periods.
4. **Psychological Dark Patterns (Weight: Medium):** Fake urgency timers ("Pay within 2 hours or lose your seat"), confirmshaming, hidden drip pricing, or buried cancellation terms.

### OUTPUT FORMAT
Respond ONLY with a valid JSON object matching this exact schema (no markdown code fences or extra commentary outside the JSON):
{
  "document_type": "Internship Offer | Job Contract | PG/Rental Agreement | WhatsApp/Email Notice | Checkout/Subscription Page",
  "risk_score": <integer from 0 to 100>,
  "verdict_badge": "SAFE (0-25) | CAUTION (26-60) | HIGH RISK TRAP (61-85) | CRITICAL SCAM (86-100)",
  "one_line_summary": "<Plain-English summary of what is actually happening in max 20 words>",
  "red_flags": [
    {
      "category": "Financial Trap | Phishing/Identity | Legal Clause | Dark Pattern",
      "severity": "High | Medium | Low",
      "exact_quote_or_visual_cue": "<Quote the exact shady phrase or describe the visual trick from the image>",
      "plain_english_explanation": "<Explain why this hurts the student in simple, direct language>"
    }
  ],
  "green_flags": [
    "<List any legitimate or safe signs found, if applicable>"
  ],
  "recommended_action": "<Clear 1-2 step checklist of what the student should do right now>",
  "safe_reply_template": "<A polite, firm email or message the student can send to HR/landlord/support to question or reject the trap, or 'DO NOT REPLY - BLOCK IMMEDIATELY' if it is a phishing scam>"
}`;

const AUDIT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      description: "One of: 'Internship Offer', 'Job Contract', 'PG/Rental Agreement', 'WhatsApp/Email Notice', 'Checkout/Subscription Page', or best matched category.",
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
            description: "Quote the exact shady phrase or describe the visual trick from the image.",
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
      description: "A polite, firm email or message the student can send to HR/landlord/support to question or reject the trap, or 'DO NOT REPLY - BLOCK IMMEDIATELY' if it is a phishing scam.",
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
  const { text, imageBase64, mimeType, url, documentCategoryHint } = req.body;

  if (!text && !imageBase64 && !url) {
    return res.status(400).json({
      error: "Please provide text, an image/screenshot, or a web link / URL to audit.",
    });
  }

  let urlInspection: Awaited<ReturnType<typeof inspectUrl>> | null = null;
  if (url) {
    urlInspection = await inspectUrl(url);
  }

  const parts: any[] = [];

  if (imageBase64) {
    const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanData,
      },
    });
  }

  let promptText = "";
  if (documentCategoryHint) {
    promptText += `[Context/Document Hint]: ${documentCategoryHint}\n\n`;
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
  } else if (!urlInspection) {
    promptText += `Please inspect all text, visual layout, branding, logos, badges, small print, and deceptive elements in the attached image.\n`;
  }

  promptText += `Audit strictly as StudentShield AI and respond with the requested JSON schema.`;
  parts.push({ text: promptText });

  // Prioritize fast, high-quota gemini-3.1-flash-lite, with gemini-3.8-flash for search grounding
  const candidateConfigs = [
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
        let parsedData;
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

        return res.json({
          success: true,
          data: {
            ...parsedData,
            grounding_sources: groundingSources.length > 0 ? groundingSources : undefined,
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

        // Short pause if 429 to let quota window clear
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
      categoryHint: documentCategoryHint || (url ? 'Phishing Link / Portal' : undefined),
      hasImage: Boolean(imageBase64),
      url: urlInspection?.normalizedUrl,
      pageTitle: urlInspection?.pageTitle,
    });

    return res.json({
      success: true,
      data: {
        ...heuristicData,
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudentShield AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
