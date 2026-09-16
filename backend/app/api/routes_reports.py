from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import ScanRun, AttackResult
from app.schemas.pydantic_schemas import SecurityReportResponse, ScanResponse, AttackResultResponse
from app.engine.scorer import compute_report_breakdowns

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{scan_id}", response_model=SecurityReportResponse)
async def get_security_report(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanRun, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    res_query = await db.execute(
        select(AttackResult).where(AttackResult.scan_id == scan_id).order_by(AttackResult.created_at.asc())
    )
    results = res_query.scalars().all()

    breakdowns = compute_report_breakdowns(results)

    return SecurityReportResponse(
        scan=ScanResponse.model_validate(scan),
        category_metrics=breakdowns["category_metrics"],
        severity_metrics=breakdowns["severity_metrics"],
        results=[AttackResultResponse.model_validate(r) for r in results],
        top_vulnerabilities=[AttackResultResponse.model_validate(r) for r in breakdowns["top_vulnerabilities"]],
        remediation_summary=breakdowns["remediation_summary"]
    )

@router.get("/{scan_id}/export/json")
async def export_report_json(scan_id: str, db: AsyncSession = Depends(get_db)):
    """Exports full audit report as downloadable structured JSON artifact."""
    report = await get_security_report(scan_id=scan_id, db=db)
    return JSONResponse(
        content=report.model_dump(mode="json"),
        headers={
            "Content-Disposition": f"attachment; filename=promptshield_report_{scan_id}.json"
        }
    )
