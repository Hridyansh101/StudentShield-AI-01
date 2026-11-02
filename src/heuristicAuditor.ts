import { AuditResult, RedFlag } from './types.ts';

interface HeuristicParams {
  text: string;
  categoryHint?: string;
  hasImage?: boolean;
  hasAudio?: boolean;
  audioFileName?: string;
  url?: string;
  pageTitle?: string;
}

export function runHeuristicAudit({ text, categoryHint, hasImage, hasAudio, audioFileName, url, pageTitle }: HeuristicParams): AuditResult {
  const normalized = (text + ' ' + (url || '') + ' ' + (pageTitle || '') + ' ' + (audioFileName || '')).toLowerCase();
  const redFlags: RedFlag[] = [];
  const greenFlags: string[] = [];

  // AUDIO & PHONE CALL SCAM SIGNALS
  if (hasAudio || normalized.includes('call') || normalized.includes('voice') || normalized.includes('recruiter phone')) {
    if (/(?:call\s*disconnect|urgency|transfer\s*now|within\s*15\s*min|only\s*today|batch\s*is\s*closing)/i.test(text)) {
      redFlags.push({
        category: 'Psychological Dark Pattern',
        severity: 'High',
        exact_quote_or_visual_cue: 'High-pressure telephonic urgency countdown',
        plain_english_explanation: 'Scammers use urgent phone calls to prevent students from consulting parents, professors, or college placement officers before transferring money.',
      });
    }

    if (/(?:pay\s*on\s*call|gpay\s*now|send\s*screenshot\s*on\s*whatsapp|upi\s*qr|scan\s*now)/i.test(text)) {
      redFlags.push({
        category: 'Financial Trap',
        severity: 'High',
        exact_quote_or_visual_cue: 'Demanding immediate payment via UPI while remaining on phone call',
        plain_english_explanation: 'Pressuring candidates to complete payments over the phone without written documentation is a standard telephonic cyber scam tactic.',
      });
    }
  }

  // URL SAFETY & PHISHING CHECKS
  if (url) {
    if (url.startsWith('http://')) {
      redFlags.push({
        category: 'Phishing/Identity',
        severity: 'High',
        exact_quote_or_visual_cue: `Unencrypted HTTP connection: ${url}`,
        plain_english_explanation: 'The website uses plain unencrypted HTTP instead of HTTPS. Any logins, personal data, or payment information submitted can be intercepted on public college Wi-Fi.',
      });
    }

    if (/\.(xyz|top|tk|ml|ga|cf|gq|buzz|work|click|link|icu|loan|vip|fit|rest|monster|site|online)(?:\/|$|\?)/i.test(url)) {
      redFlags.push({
        category: 'Phishing/Identity',
        severity: 'High',
        exact_quote_or_visual_cue: `High-risk / disposable TLD in: ${url}`,
        plain_english_explanation: 'The link uses a low-cost or disposable top-level domain frequently associated with short-lived scam campaigns and phishing clones targeting students.',
      });
    }

    if (/(?:internshala|infosys|tcs|wipro|google|amazon|microsoft|accenture|deloitte|paytm|phonepe|sbi|hdfc)[\w-]*(?:\.xyz|\.top|\.online|\.site|\.live|\.app|\.info|\.tech|\.work|\.club)/i.test(url)) {
      redFlags.push({
        category: 'Phishing/Identity',
        severity: 'High',
        exact_quote_or_visual_cue: `Suspected Brand Typosquatting / Clone Domain: ${url}`,
        plain_english_explanation: 'The domain mimics a well-known enterprise or tech brand using hyphens and unofficial domain extensions. This is a classic credential-harvesting trap.',
      });
    }

    if (/(?:t\.me\/|wa\.me\/|chat\.whatsapp\.com\/)/i.test(url)) {
      redFlags.push({
        category: 'Phishing/Identity',
        severity: 'High',
        exact_quote_or_visual_cue: `Direct Messaging Redirect: ${url}`,
        plain_english_explanation: 'Directing applicants straight to encrypted Telegram channels or WhatsApp groups rather than an official ATS portal bypasses company oversight and eliminates paper trails.',
      });
    }

    if (/(?:forms\.gle|docs\.google\.com\/forms|surveyheart\.com)/i.test(url)) {
      redFlags.push({
        category: 'Phishing/Identity',
        severity: 'Medium',
        exact_quote_or_visual_cue: `Free Public Survey Form: ${url}`,
        plain_english_explanation: 'Legitimate employers and university departments host recruitment on authenticated corporate domains, not generic free Google Forms.',
      });
    }
  }

  // 1. FINANCIAL TRAPS
  // -------------------------------------------------------------
  // Upfront fee detection
  const feeMatch = text.match(/(?:pay|deposit|fee|charge|transfer|remit|cost)\s*(?:of)?\s*(?:₹|rs\.?|inr|\$|usd)?\s*(\d+[\d,]*)/i);
  const trainingFeeMatch = text.match(/(?:registration|training|certification|course|materials?|laptop|seat\s+confirmation|onboarding|processing)\s*(?:fee|charges?|amount|cost|deposit)/i);
  
  if (trainingFeeMatch || (feeMatch && (normalized.includes('intern') || normalized.includes('job') || normalized.includes('offer')))) {
    const quote = feeMatch ? feeMatch[0] : (trainingFeeMatch ? trainingFeeMatch[0] : 'Registration / Training fee demanded');
    redFlags.push({
      category: 'Financial Trap',
      severity: 'High',
      exact_quote_or_visual_cue: quote,
      plain_english_explanation: 'Legitimate employers never charge candidates money for training, equipment, or offer acceptance. Demanding money is the #1 hallmark of a fake internship racket.',
    });
  }

  // Non-refundable deposit / Rental forfeit
  if (/(?:non-refundable\s+deposit|forfeit.*deposit|deposit.*non-refundable|deduct.*50%|maintenance.*at\s+will)/i.test(text)) {
    const match = text.match(/(?:non-refundable\s+deposit|deposit.*forfeited?|deduct.*deposit|forfeit.*security)/i);
    redFlags.push({
      category: 'Financial Trap',
      severity: 'High',
      exact_quote_or_visual_cue: match ? match[0] : 'Non-refundable security deposit clause',
      plain_english_explanation: 'Security deposits are legally meant to cover provable property damages, not arbitrary landlord forfeiture. This clause allows the owner to withhold your money upon vacating.',
    });
  }

  // Heavy exit bonds / liquidated damages
  const bondPenalty = text.match(/(?:liquidated\s+damages|penalty\s+of\s*(?:₹|rs\.?|inr|\$)?\s*\d+|pay\s*(?:₹|rs\.?|inr|\$)?\s*[\d,]+\s*(?:if|upon\s+early\s+exit|to\s+break\s+bond))/i);
  if (bondPenalty) {
    redFlags.push({
      category: 'Financial Trap',
      severity: 'High',
      exact_quote_or_visual_cue: bondPenalty[0],
      plain_english_explanation: 'Under Indian Contract Law (Section 27), disproportionate employment bond penalties that restrict student mobility are legally void and unenforceable in court.',
    });
  }

  // 2. IDENTITY & PHISHING SIGNALS
  // -------------------------------------------------------------
  const freeEmailMatch = text.match(/[\w.-]+@(gmail|yahoo|outlook|hotmail|protonmail)\.com/i);
  if (freeEmailMatch && (normalized.includes('offer') || normalized.includes('hr') || normalized.includes('internship') || normalized.includes('recruitment') || normalized.includes('company'))) {
    redFlags.push({
      category: 'Phishing/Identity',
      severity: 'High',
      exact_quote_or_visual_cue: freeEmailMatch[0],
      plain_english_explanation: `The sender claims to represent a registered company or placement committee but is operating from a free personal email domain (${freeEmailMatch[0]}) rather than a corporate domain.`,
    });
  }

  // Unofficial Google forms or Telegram redirects
  const telegramMatch = text.match(/(?:t\.me\/[\w_]+|telegram\s*(?:id|username|channel)|wa\.me\/[\d]+|whatsapp\s+group)/i);
  if (telegramMatch) {
    redFlags.push({
      category: 'Phishing/Identity',
      severity: 'Medium',
      exact_quote_or_visual_cue: telegramMatch[0],
      plain_english_explanation: 'Directing students to encrypted Telegram channels or personal WhatsApp chats bypasses corporate audit trails and makes dispute resolution or legal recovery nearly impossible.',
    });
  }

  const googleFormMatch = text.match(/(?:forms\.gle\/[\w-]+|docs\.google\.com\/forms)/i);
  if (googleFormMatch && (normalized.includes('upi') || normalized.includes('fee') || normalized.includes('bank') || normalized.includes('aadhaar'))) {
    redFlags.push({
      category: 'Phishing/Identity',
      severity: 'High',
      exact_quote_or_visual_cue: googleFormMatch[0],
      plain_english_explanation: 'Unofficial Google Form collecting sensitive identity information, banking details, or payment confirmations. Corporate HR uses dedicated ATS portal systems, not public forms.',
    });
  }

  // 3. LEGAL & CONTRACT RED FLAGS
  // -------------------------------------------------------------
  const certHostage = text.match(/(?:original\s+(?:degree|marksheets?|certificates?|documents?)|surrender\s+(?:original|certificates?)|withhold\s+(?:certificates?|degree)|submit\s+original\s+10th)/i);
  if (certHostage) {
    redFlags.push({
      category: 'Legal Clause',
      severity: 'High',
      exact_quote_or_visual_cue: certHostage[0],
      plain_english_explanation: 'Holding a student’s original educational certificates is explicitly prohibited by UGC notifications and labor department rulings. Surrendering originals enables criminal coercion.',
    });
  }

  // Mandatory lock-in or service bond
  const lockInMatch = text.match(/(?:mandatory\s+service\s+(?:period|bond)\s+of\s+\d+\s*(?:years?|months?)|lock-in\s+period\s+of\s+\d+|cannot\s+resign\s+for\s+\d+)/i);
  if (lockInMatch) {
    redFlags.push({
      category: 'Legal Clause',
      severity: 'Medium',
      exact_quote_or_visual_cue: lockInMatch[0],
      plain_english_explanation: 'Unreasonable lock-in periods with strict departure prohibitions restrict student career growth and create artificial bonded labor environments.',
    });
  }

  // IP claim over personal work
  if (/(?:all\s+prior\s+and\s+future\s+inventions|personal\s+projects\s+belong\s+to|irrevocably\s+assigns\s+all\s+intellectual\s+property)/i.test(text)) {
    redFlags.push({
      category: 'Legal Clause',
      severity: 'Medium',
      exact_quote_or_visual_cue: 'Broad intellectual property assignment clause',
      plain_english_explanation: 'The agreement attempts to seize ownership over code, open-source work, or side projects you develop in your own personal student time.',
    });
  }

  // 4. PSYCHOLOGICAL DARK PATTERNS
  // -------------------------------------------------------------
  const urgencyMatch = text.match(/(?:pay\s+within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)|offer\s+expires\s+in\s+\d+|only\s+\d+\s*seats?\s*(?:left|remaining)|hurry\s+up|immediate\s+transfer\s+required)/i);
  if (urgencyMatch) {
    redFlags.push({
      category: 'Dark Pattern',
      severity: 'Medium',
      exact_quote_or_visual_cue: urgencyMatch[0],
      plain_english_explanation: 'Artificial countdown timers and scarcity pressure force victims to pay without verifying credentials or consulting college faculty.',
    });
  }

  const autoRenewalMatch = text.match(/(?:automatically\s+renews?|auto-renews?\s+at|recurring\s+charge\s+of|monthly\s+subscription\s+renews)/i);
  if (autoRenewalMatch) {
    redFlags.push({
      category: 'Dark Pattern',
      severity: 'Medium',
      exact_quote_or_visual_cue: autoRenewalMatch[0],
      plain_english_explanation: 'Hidden subscription auto-debit pattern designed to trigger recurring monthly deductions after an initial free or low-cost trial.',
    });
  }

  // 5. GREEN FLAGS (LEGITIMATE SIGNALS)
  // -------------------------------------------------------------
  if (/@(?!gmail|yahoo|outlook|hotmail|protonmail)[\w.-]+\.(com|org|edu|in|io)\b/i.test(text)) {
    greenFlags.push('Communicates from a verified corporate or institutional domain');
  }
  if (/(?:stipend\s+of\s*(?:₹|rs\.?|inr|\$)?\s*\d+|monthly\s+stipend\s+credited)/i.test(text) && !trainingFeeMatch) {
    greenFlags.push('Mentions direct monthly stipend payout with no fee prerequisite');
  }
  if (/(?:mutual\s+notice|30\s+days?\s+notice\s+by\s+either\s+party|two\s+weeks?\s+notice)/i.test(text)) {
    greenFlags.push('Standard mutual notice period allowing either party to terminate amicably');
  }
  if (/(?:no\s+(?:registration|training)?\s*fees?|free\s+of\s+cost|100%\s+free)/i.test(text)) {
    greenFlags.push('Explicit zero-fee declaration aligned with ethical hiring codes');
  }

  // Document Type Determination
  let document_type = categoryHint || 'Document Notice';
  if (document_type === 'Auto-Detect Type' || !categoryHint) {
    if (normalized.includes('intern') || normalized.includes('stipend') || normalized.includes('training')) {
      document_type = 'Internship Offer';
    } else if (normalized.includes('pg') || normalized.includes('tenant') || normalized.includes('lease') || normalized.includes('landlord')) {
      document_type = 'PG / Rental Agreement';
    } else if (normalized.includes('bond') || normalized.includes('employment') || normalized.includes('resignation')) {
      document_type = 'Job Contract & Bond';
    } else if (normalized.includes('whatsapp') || normalized.includes('telegram') || normalized.includes('dear student')) {
      document_type = 'WhatsApp / Email Notice';
    } else if (normalized.includes('checkout') || normalized.includes('trial') || normalized.includes('renew')) {
      document_type = 'Checkout / Subscription Page';
    } else {
      document_type = 'Suspicious Contract / Notice';
    }
  }

  // Calculate Risk Score
  let risk_score = 15; // baseline
  for (const rf of redFlags) {
    if (rf.severity === 'High') risk_score += 30;
    else if (rf.severity === 'Medium') risk_score += 15;
    else risk_score += 10;
  }
  if (greenFlags.length > 0) {
    risk_score = Math.max(5, risk_score - greenFlags.length * 8);
  }
  risk_score = Math.min(98, Math.max(10, risk_score));

  // If no red flags found at all, but text provided
  if (redFlags.length === 0) {
    risk_score = 15;
    greenFlags.push('No obvious high-risk predatory fee or certificate hostage clauses detected');
  }

  // Verdict Badge
  let verdict_badge = 'SAFE (0-25)';
  if (risk_score >= 86) {
    verdict_badge = 'CRITICAL SCAM (86-100)';
  } else if (risk_score >= 61) {
    verdict_badge = 'HIGH RISK TRAP (61-85)';
  } else if (risk_score >= 26) {
    verdict_badge = 'CAUTION (26-60)';
  }

  // One line summary
  let one_line_summary = '';
  if (risk_score >= 86) {
    one_line_summary = 'Confirmed predatory scam attempt targeting student funds or official educational certificates.';
  } else if (risk_score >= 61) {
    one_line_summary = 'High-risk agreement containing severe financial traps, certificate hostage, or dark patterns.';
  } else if (risk_score >= 26) {
    one_line_summary = 'Proceed with caution: Contains ambiguous deposit or lock-in terms that require renegotiation.';
  } else {
    one_line_summary = 'No critical predatory traps identified; standard contract language observed.';
  }

  // Recommended Action
  let recommended_action = '';
  if (risk_score >= 86) {
    recommended_action = '1. Cease all contact immediately and do not transfer any registration, deposit, or verification money.\n2. Never hand over original 10th/12th/degree marksheets.\n3. Report this sender to your college placement cell and the National Cyber Crime Portal (1930).';
  } else if (risk_score >= 61) {
    recommended_action = '1. Request removal of the penalty / upfront fee clause in writing before signing anything.\n2. Consult your university placement office or student legal aid cell.\n3. Verify the company’s legal registration on the Ministry of Corporate Affairs portal.';
  } else {
    recommended_action = '1. Review payment due dates and notice period terms carefully.\n2. Request written clarification on deposit refund timelines.\n3. Retain a signed physical or PDF copy for your personal records.';
  }

  // Safe Reply Template
  let safe_reply_template = '';
  if (risk_score >= 86) {
    safe_reply_template = 'DO NOT REPLY - BLOCK IMMEDIATELY.\n\nThis communication displays clear indicators of predatory recruitment fraud. Engaging further or asking for fee reductions will only invite escalation and social engineering attempts.';
  } else if (redFlags.some(f => f.category === 'Financial Trap')) {
    safe_reply_template = 'Dear HR Team,\n\nThank you for considering my profile for this role. Regarding the requested registration/training fee mentioned in the offer, university placement guidelines strictly prohibit candidates from paying upfront onboarding or verification charges for internship opportunities.\n\nKindly confirm that this engagement carries zero candidate-side fees so I may proceed with the formal acceptance.\n\nBest regards,\n[Your Name]';
  } else if (redFlags.some(f => f.category === 'Legal Clause')) {
    safe_reply_template = 'Dear Sir/Madam,\n\nI am reviewing the proposed agreement and noted the clause requiring submission of original educational certificates. In accordance with University Grants Commission (UGC) regulations and labor law standards, students cannot surrender physical original marksheets. I will gladly provide attested photocopies and DigiLocker verifiable links.\n\nPlease furnish an updated copy reflecting this adjustment.\n\nSincerely,\n[Your Name]';
  } else {
    safe_reply_template = 'Dear [Name/Team],\n\nThank you for sharing the agreement details. Before executing the document, I would appreciate written confirmation on the deposit return procedure and mutual notice timelines upon completion.\n\nThank you,\n[Your Name]';
  }

  return {
    document_type,
    risk_score,
    verdict_badge,
    one_line_summary,
    red_flags: redFlags,
    green_flags: greenFlags,
    recommended_action,
    safe_reply_template,
  };
}
