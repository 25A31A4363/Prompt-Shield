from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.db_models import SecurityFinding
from app.schemas.pydantic_schemas import (
    PromptAnalyzeRequest, PromptAnalyzeResponse,
    FindingCreateRequest, FindingResponse, FindingStatusUpdateRequest
)
from app.engine.prompt_analyzer import PromptRiskAnalyzer

router = APIRouter(tags=["Security Findings & Triage"])

@router.post("/analyze/prompt", response_model=PromptAnalyzeResponse)
async def analyze_prompt(req: PromptAnalyzeRequest):
    """
    Evaluates input prompt text for prompt injection, system exfiltration,
    jailbreak framing, delimiter escapes, or malicious agent commands.
    """
    return PromptRiskAnalyzer.analyze_prompt(req.prompt)

@router.post("/findings", response_model=FindingResponse, status_code=status.HTTP_201_CREATED)
async def create_security_finding(req: FindingCreateRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a new security finding submitted by a tester or user, with initial status 'NEW'.
    """
    finding = SecurityFinding(
        prompt=req.prompt,
        risk_status=req.risk_status,
        risk_category=req.risk_category,
        severity=req.severity,
        confidence=req.confidence,
        explanation=req.explanation,
        indicators_detected=req.indicators_detected,
        recommendation=req.recommendation,
        potential_impact=req.potential_impact,
        investigation_steps=req.investigation_steps,
        status="NEW"
    )
    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding

@router.get("/findings", response_model=List[FindingResponse])
async def list_security_findings(db: AsyncSession = Depends(get_db)):
    """
    Lists all security findings for security triage and investigation.
    """
    result = await db.execute(
        select(SecurityFinding).order_by(SecurityFinding.created_at.desc()).limit(100)
    )
    findings = result.scalars().all()
    return findings

@router.get("/findings/{finding_id}", response_model=FindingResponse)
async def get_security_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves detailed information for a single security finding.
    """
    finding = await db.get(SecurityFinding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Security finding not found")
    return finding

@router.patch("/findings/{finding_id}/status", response_model=FindingResponse)
async def update_finding_status(
    finding_id: str,
    req: FindingStatusUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the lifecycle status and triage notes of a security finding
    (e.g., NEW -> UNDER REVIEW -> CONFIRMED -> FIXED -> RESOLVED).
    """
    finding = await db.get(SecurityFinding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Security finding not found")

    finding.status = req.status
    if req.review_notes is not None:
        finding.review_notes = req.review_notes

    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding
