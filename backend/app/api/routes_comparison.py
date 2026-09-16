from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import ScanRun, AttackResult, ScanComparison
from app.schemas.pydantic_schemas import ComparisonResponse, ScanResponse
from app.engine.comparison import compare_scans

router = APIRouter(prefix="/comparison", tags=["Scan Comparison"])

@router.get("/{base_scan_id}/{target_scan_id}", response_model=ComparisonResponse)
async def get_scan_comparison(
    base_scan_id: str,
    target_scan_id: str,
    db: AsyncSession = Depends(get_db)
):
    base_scan = await db.get(ScanRun, base_scan_id)
    if not base_scan:
        raise HTTPException(status_code=404, detail=f"Base scan '{base_scan_id}' not found.")

    target_scan = await db.get(ScanRun, target_scan_id)
    if not target_scan:
        raise HTTPException(status_code=404, detail=f"Target scan '{target_scan_id}' not found.")

    # Fetch attack results for both scans
    base_res_q = await db.execute(select(AttackResult).where(AttackResult.scan_id == base_scan_id))
    base_results = base_res_q.scalars().all()

    target_res_q = await db.execute(select(AttackResult).where(AttackResult.scan_id == target_scan_id))
    target_results = target_res_q.scalars().all()

    comparison_data = compare_scans(
        base_scan=base_scan,
        target_scan=target_scan,
        base_results=base_results,
        target_results=target_results
    )

    # Persist comparison record
    comp_record = ScanComparison(
        base_scan_id=base_scan_id,
        target_scan_id=target_scan_id,
        score_delta=comparison_data["score_delta"],
        grade_before=comparison_data["grade_before"],
        grade_after=comparison_data["grade_after"],
        fixed_attack_ids=comparison_data["fixed_attack_ids"],
        unresolved_attack_ids=comparison_data["unresolved_attack_ids"],
        regressed_attack_ids=comparison_data["regressed_attack_ids"]
    )
    db.add(comp_record)
    await db.commit()

    return ComparisonResponse(
        base_scan=ScanResponse.model_validate(base_scan),
        target_scan=ScanResponse.model_validate(target_scan),
        score_delta=comparison_data["score_delta"],
        grade_before=comparison_data["grade_before"],
        grade_after=comparison_data["grade_after"],
        fixed_count=comparison_data["fixed_count"],
        unresolved_count=comparison_data["unresolved_count"],
        regression_count=comparison_data["regression_count"],
        attack_diffs=comparison_data["attack_diffs"]
    )
