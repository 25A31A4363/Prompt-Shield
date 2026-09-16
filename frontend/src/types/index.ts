export type TargetType = 'SANDBOX' | 'OPENAI' | 'CUSTOM_WEBHOOK';
export type SandboxMode = 'SECURE' | 'MIXED' | 'VULNERABLE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Verdict = 'SUCCESSFUL' | 'RESISTED' | 'PARTIAL' | 'ERROR';
export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface TargetConfig {
  id: string;
  name: string;
  target_type: TargetType;
  sandbox_mode?: SandboxMode;
  base_url?: string;
  api_key_masked?: string;
  model_name?: string;
  system_prompt?: string;
  canary_secret: string;
  created_at: string;
}

export interface TargetCreateRequest {
  name: string;
  target_type: TargetType;
  sandbox_mode?: SandboxMode;
  base_url?: string;
  api_key?: string;
  model_name?: string;
  system_prompt?: string;
  custom_headers?: Record<string, string>;
  custom_body_template?: string;
  response_jsonpath?: string;
  canary_secret?: string;
}

export interface TargetTestResponse {
  success: boolean;
  status_code?: number;
  latency_ms: number;
  message: string;
  sample_response?: string;
}

export interface DetectionRules {
  canary_required?: string;
  regex_breach_patterns: string[];
  regex_refusal_patterns: string[];
  behavioral_keywords: string[];
  similarity_threshold?: number;
}

export interface RemediationAdvice {
  strategy: string;
  code_example?: string;
  owasp_reference: string;
}

export interface AttackTestCase {
  id: string;
  name: string;
  category: string;
  severity: Severity;
  objective: string;
  payload: string;
  expected_safe_behavior: string;
  success_indicators: string[];
  failure_indicators: string[];
  detection_rules: DetectionRules;
  remediation_advice: RemediationAdvice;
}

export interface AttackResult {
  id: string;
  scan_id: string;
  attack_id: string;
  attack_name: string;
  category: string;
  severity: Severity;
  verdict: Verdict;
  confidence: number;
  detection_stage: string;
  payload_sent: string;
  raw_response?: string;
  rule_triggered?: string;
  matched_indicator?: string;
  evidence_snippet?: string;
  rationale?: string;
  latency_ms: number;
  remediation_advice?: RemediationAdvice;
  created_at: string;
}

export interface ScanRun {
  id: string;
  target_name: string;
  target_type: TargetType;
  sandbox_mode?: SandboxMode;
  status: ScanStatus;
  attack_suite: string;
  total_probes: number;
  completed_probes: number;
  successful_count: number;
  resisted_count: number;
  partial_count: number;
  error_count: number;
  security_score: number;
  grade: string;
  mean_confidence: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface CategoryMetric {
  category: string;
  total: number;
  resisted: number;
  successful: number;
  resilience_rate: number;
}

export interface SeverityMetric {
  severity: Severity;
  total: number;
  resisted: number;
  successful: number;
}

export interface SecurityReport {
  scan: ScanRun;
  category_metrics: CategoryMetric[];
  severity_metrics: SeverityMetric[];
  results: AttackResult[];
  top_vulnerabilities: AttackResult[];
  remediation_summary: Array<{
    attack_id: string;
    category: string;
    severity: Severity;
    strategy: string;
    code_example?: string;
    owasp_reference: string;
  }>;
}

export interface ComparisonAttackDiff {
  attack_id: string;
  attack_name: string;
  category: string;
  severity: Severity;
  base_verdict: string;
  target_verdict: string;
  status: 'FIXED' | 'REGRESSED' | 'UNCHANGED_BREACH' | 'UNCHANGED_SECURE';
}

export interface ComparisonResponse {
  base_scan: ScanRun;
  target_scan: ScanRun;
  score_delta: number;
  grade_before: string;
  grade_after: string;
  fixed_count: number;
  unresolved_count: number;
  regression_count: number;
  attack_diffs: ComparisonAttackDiff[];
}
