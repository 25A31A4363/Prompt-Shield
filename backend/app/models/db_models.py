import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TargetConfig(Base):
    __tablename__ = "target_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    target_type = Column(String(30), nullable=False)  # SANDBOX, OPENAI, CUSTOM_WEBHOOK
    sandbox_mode = Column(String(30), default="MIXED")  # SECURE, MIXED, VULNERABLE
    base_url = Column(String(500), nullable=True)
    api_key_masked = Column(String(50), nullable=True)
    api_key_encrypted = Column(Text, nullable=True)
    model_name = Column(String(100), nullable=True)
    system_prompt = Column(Text, nullable=True)
    custom_headers = Column(JSON, nullable=True)
    custom_body_template = Column(Text, nullable=True)
    response_jsonpath = Column(String(200), nullable=True)
    canary_secret = Column(String(100), default="PROMPT_SHIELD_CANARY_ALPHA_99")
    created_at = Column(DateTime, default=utc_now)

    scans = relationship("ScanRun", back_populates="target", cascade="all, delete-orphan")


class ScanRun(Base):
    __tablename__ = "scan_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    target_id = Column(String(36), ForeignKey("target_configs.id"), nullable=True)
    target_name = Column(String(100), nullable=False)
    target_type = Column(String(30), nullable=False)
    sandbox_mode = Column(String(30), nullable=True)
    status = Column(String(30), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    attack_suite = Column(String(50), default="ALL")
    total_probes = Column(Integer, default=0)
    completed_probes = Column(Integer, default=0)
    successful_count = Column(Integer, default=0)
    resisted_count = Column(Integer, default=0)
    partial_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    security_score = Column(Float, default=100.0)
    grade = Column(String(5), default="A")
    mean_confidence = Column(Float, default=1.0)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    target = relationship("TargetConfig", back_populates="scans")
    results = relationship("AttackResult", back_populates="scan", cascade="all, delete-orphan")


class AttackResult(Base):
    __tablename__ = "attack_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scan_id = Column(String(36), ForeignKey("scan_runs.id"), nullable=False)
    attack_id = Column(String(50), nullable=False)
    attack_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    verdict = Column(String(20), nullable=False)   # SUCCESSFUL, RESISTED, PARTIAL, ERROR
    confidence = Column(Float, nullable=False)     # 0.0 - 1.0
    detection_stage = Column(String(50), nullable=False)
    payload_sent = Column(Text, nullable=False)
    raw_response = Column(Text, nullable=True)
    rule_triggered = Column(String(200), nullable=True)
    matched_indicator = Column(Text, nullable=True)
    evidence_snippet = Column(Text, nullable=True)
    rationale = Column(Text, nullable=True)
    latency_ms = Column(Float, default=0.0)
    remediation_advice = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    scan = relationship("ScanRun", back_populates="results")


class ScanComparison(Base):
    __tablename__ = "scan_comparisons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    base_scan_id = Column(String(36), nullable=False)
    target_scan_id = Column(String(36), nullable=False)
    score_delta = Column(Float, nullable=False)
    grade_before = Column(String(5), nullable=False)
    grade_after = Column(String(5), nullable=False)
    fixed_attack_ids = Column(JSON, default=list)
    unresolved_attack_ids = Column(JSON, default=list)
    regressed_attack_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    prompt = Column(Text, nullable=False)
    risk_status = Column(String(30), nullable=False)      # NO_APPARENT_RISK, LOW_REVIEW, MEDIUM_RISK, HIGH_RISK
    risk_category = Column(String(100), nullable=False)   # Direct Prompt Injection, System Prompt Extraction, etc.
    severity = Column(String(20), nullable=False)         # CRITICAL, HIGH, MEDIUM, LOW, NONE
    confidence = Column(Float, default=0.0)
    explanation = Column(Text, nullable=False)
    indicators_detected = Column(JSON, default=list)
    recommendation = Column(Text, nullable=False)
    potential_impact = Column(Text, nullable=True)
    investigation_steps = Column(Text, nullable=True)
    status = Column(String(30), default="NEW")             # NEW, UNDER REVIEW, CONFIRMED, FIXED, RESOLVED
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

