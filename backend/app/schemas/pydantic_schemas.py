from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Target Schemas ---
class TargetBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    target_type: str = Field(..., pattern="^(SANDBOX|OPENAI|CUSTOM_WEBHOOK)$")
    sandbox_mode: Optional[str] = Field("MIXED", pattern="^(SECURE|MIXED|VULNERABLE)$")
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    system_prompt: Optional[str] = None
    custom_headers: Optional[Dict[str, str]] = None
    custom_body_template: Optional[str] = None
    response_jsonpath: Optional[str] = None
    canary_secret: Optional[str] = "PROMPT_SHIELD_CANARY_ALPHA_99"

class TargetCreate(TargetBase):
    pass

class TargetResponse(BaseModel):
    id: str
    name: str
    target_type: str
    sandbox_mode: Optional[str]
    base_url: Optional[str]
    api_key_masked: Optional[str]
    model_name: Optional[str]
    system_prompt: Optional[str]
    canary_secret: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TargetTestRequest(BaseModel):
    target_type: str
    sandbox_mode: Optional[str] = "MIXED"
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    custom_headers: Optional[Dict[str, str]] = None
    custom_body_template: Optional[str] = None
    response_jsonpath: Optional[str] = None

class TargetTestResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    latency_ms: float
    message: str
    sample_response: Optional[str] = None

# --- Attack Case & Library Schemas ---
class DetectionRulesSchema(BaseModel):
    canary_required: Optional[str] = None
    regex_breach_patterns: List[str] = []
    regex_refusal_patterns: List[str] = []
    behavioral_keywords: List[str] = []
    similarity_target: Optional[str] = None
    similarity_threshold: Optional[float] = 0.65

class RemediationAdviceSchema(BaseModel):
    strategy: str
    code_example: Optional[str] = None
    owasp_reference: str

class AttackTestCaseSchema(BaseModel):
    id: str
    name: str
    category: str
    severity: str
    objective: str
    payload: str
    expected_safe_behavior: str
    success_indicators: List[str]
    failure_indicators: List[str]
    detection_rules: DetectionRulesSchema
    remediation_advice: RemediationAdviceSchema

# --- Attack Result & Evidence Schemas ---
class ExplainableEvidence(BaseModel):
    rule_triggered: str
    matched_indicator: str
    evidence_snippet: str
    rationale: str

class AttackResultResponse(BaseModel):
    id: str
    scan_id: str
    attack_id: str
    attack_name: str
    category: str
    severity: str
    verdict: str
    confidence: float
    detection_stage: str
    payload_sent: str
    raw_response: Optional[str]
    rule_triggered: Optional[str]
    matched_indicator: Optional[str]
    evidence_snippet: Optional[str]
    rationale: Optional[str]
    latency_ms: float
    remediation_advice: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Scan & Execution Schemas ---
class ScanCreateRequest(BaseModel):
    target_id: Optional[str] = None
    target_config: Optional[TargetCreate] = None
    attack_suite: str = "ALL"  # ALL, QUICK, CRITICAL, or Category code
    enable_llm_judge: bool = False

class ScanResponse(BaseModel):
    id: str
    target_name: str
    target_type: str
    sandbox_mode: Optional[str]
    status: str
    attack_suite: str
    total_probes: int
    completed_probes: int
    successful_count: int
    resisted_count: int
    partial_count: int
    error_count: int
    security_score: float
    grade: str
    mean_confidence: float
    started_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class ScanProgressEvent(BaseModel):
    scan_id: str
    status: str
    completed_probes: int
    total_probes: int
    percent: float
    current_attack: Optional[Dict[str, Any]] = None
    latest_result: Optional[AttackResultResponse] = None
    current_score: float
    current_grade: str

# --- Report & Metrics Schemas ---
class CategoryMetric(BaseModel):
    category: str
    total: int
    resisted: int
    successful: int
    resilience_rate: float

class SeverityMetric(BaseModel):
    severity: str
    total: int
    resisted: int
    successful: int

class SecurityReportResponse(BaseModel):
    scan: ScanResponse
    category_metrics: List[CategoryMetric]
    severity_metrics: List[SeverityMetric]
    results: List[AttackResultResponse]
    top_vulnerabilities: List[AttackResultResponse]
    remediation_summary: List[Dict[str, Any]]

# --- Comparison Schemas ---
class ComparisonAttackDiff(BaseModel):
    attack_id: str
    attack_name: str
    category: str
    severity: str
    base_verdict: str
    target_verdict: str
    status: str  # FIXED, REGRESSED, UNCHANGED_BREACH, UNCHANGED_SECURE

class ComparisonResponse(BaseModel):
    base_scan: ScanResponse
    target_scan: ScanResponse
    score_delta: float
    grade_before: str
    grade_after: str
    fixed_count: int
    unresolved_count: int
    regression_count: int
    attack_diffs: List[ComparisonAttackDiff]

# --- Prompt Analysis & Security Triage Schemas ---
class PromptAnalyzeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)

class PromptAnalyzeResponse(BaseModel):
    risk_status: str       # NO_APPARENT_RISK, LOW_REVIEW, MEDIUM_RISK, HIGH_RISK
    severity: str          # CRITICAL, HIGH, MEDIUM, LOW, NONE
    risk_category: str     # Direct Prompt Injection, System Prompt Extraction, etc.
    confidence: float
    explanation: str
    indicators_detected: List[str] = []
    recommendation: str
    potential_impact: str
    investigation_steps: str

class FindingCreateRequest(BaseModel):
    prompt: str
    risk_status: str
    risk_category: str
    severity: str
    confidence: float = 0.0
    explanation: str
    indicators_detected: List[str] = []
    recommendation: str
    potential_impact: Optional[str] = None
    investigation_steps: Optional[str] = None

class FindingStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(NEW|UNDER REVIEW|CONFIRMED|FIXED|RESOLVED)$")
    review_notes: Optional[str] = None

class FindingResponse(BaseModel):
    id: str
    prompt: str
    risk_status: str
    risk_category: str
    severity: str
    confidence: float
    explanation: str
    indicators_detected: List[str]
    recommendation: str
    potential_impact: Optional[str]
    investigation_steps: Optional[str]
    status: str
    review_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

