export type Severity = 'High' | 'Medium' | 'Low';

export interface RedFlag {
  category: 'Financial Trap' | 'Phishing/Identity' | 'Legal Clause' | 'Dark Pattern' | string;
  severity: Severity;
  exact_quote_or_visual_cue: string;
  plain_english_explanation: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface UrlSafetyInfo {
  scanned_url: string;
  domain: string;
  protocol: string;
  is_secure_protocol: boolean;
  tld?: string;
  suspicious_patterns?: string[];
  page_title?: string;
  meta_description?: string;
  google_search_verified?: boolean;
}

export interface AuditResult {
  document_type: string;
  risk_score: number;
  verdict_badge: 'SAFE (0-25)' | 'CAUTION (26-60)' | 'HIGH RISK TRAP (61-85)' | 'CRITICAL SCAM (86-100)' | string;
  one_line_summary: string;
  red_flags: RedFlag[];
  green_flags: string[];
  recommended_action: string;
  safe_reply_template: string;
  engine?: string;
  notice?: string;
  audited_input?: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    url?: string;
    pageTitle?: string;
  };
  grounding_sources?: GroundingSource[];
  url_safety?: UrlSafetyInfo;
}

export interface PresetCase {
  id: string;
  title: string;
  category: string;
  riskType: 'CRITICAL SCAM' | 'HIGH RISK TRAP' | 'CAUTION' | 'SAFE';
  description: string;
  inputText: string;
  sourceType: string;
}

export interface AuditHistoryItem {
  id: string;
  timestamp: number;
  previewTitle: string;
  result: AuditResult;
}
