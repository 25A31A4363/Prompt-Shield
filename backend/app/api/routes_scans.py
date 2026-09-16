import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db, AsyncSessionLocal
from app.models.db_models import ScanRun, TargetConfig, AttackResult
from app.schemas.pydantic_schemas import (
    ScanCreateRequest, ScanResponse, AttackResultResponse
)
from app.engine.dispatcher import dispatcher, subscribe_to_scan, unsubscribe_from_scan
from app.engine.battery import filter_battery

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.post("/start", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def start_scan(req: ScanCreateRequest, db: AsyncSession = Depends(get_db)):
    target: TargetConfig | None = None

    if req.target_id:
        target = await db.get(TargetConfig, req.target_id)
        if not target:
            raise HTTPException(status_code=404, detail="Specified target not found")
    elif req.target_config:
        target = TargetConfig(
            name=req.target_config.name,
            target_type=req.target_config.target_type,
            sandbox_mode=req.target_config.sandbox_mode or "MIXED",
            base_url=req.target_config.base_url,
            api_key_masked=None,
            api_key_encrypted=req.target_config.api_key,
            model_name=req.target_config.model_name,
            system_prompt=req.target_config.system_prompt,
            custom_headers=req.target_config.custom_headers,
            custom_body_template=req.target_config.custom_body_template,
            response_jsonpath=req.target_config.response_jsonpath,
            canary_secret=req.target_config.canary_secret or "PROMPT_SHIELD_CANARY_ALPHA_99"
        )
        db.add(target)
        await db.commit()
        await db.refresh(target)
    else:
        # Default fallback: Built-in Sandbox (Mixed Mode)
        target = TargetConfig(
            name="Default Built-in Sandbox (Mixed Mode)",
            target_type="SANDBOX",
            sandbox_mode="MIXED",
            canary_secret="SECRET_FLAG_PROMPT_SHIELD_99"
        )
        db.add(target)
        await db.commit()
        await db.refresh(target)

    attacks = filter_battery(req.attack_suite)

    scan = ScanRun(
        target_id=target.id,
        target_name=target.name,
        target_type=target.target_type,
        sandbox_mode=target.sandbox_mode,
        status="PENDING",
        attack_suite=req.attack_suite,
        total_probes=len(attacks),
        completed_probes=0,
        successful_count=0,
        resisted_count=0,
        partial_count=0,
        error_count=0,
        security_score=100.0,
        grade="A"
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    # Launch background async scan task
    asyncio.create_task(
        dispatcher.run_scan(
            scan_id=scan.id,
            session_factory=AsyncSessionLocal,
            enable_llm_judge=req.enable_llm_judge
        )
    )

    return scan

@router.get("/history", response_model=List[ScanResponse])
async def list_scan_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScanRun).order_by(ScanRun.started_at.desc()).limit(50))
    scans = result.scalars().all()
    return scans

@router.get("/{scan_id}/status", response_model=ScanResponse)
async def get_scan_status(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanRun, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/{scan_id}/results", response_model=List[AttackResultResponse])
async def get_scan_results(scan_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AttackResult).where(AttackResult.scan_id == scan_id).order_by(AttackResult.created_at.asc()))
    return result.scalars().all()

@router.get("/{scan_id}/stream")
async def stream_scan_progress(scan_id: str):
    """Server-Sent Events (SSE) endpoint streaming real-time attack execution and telemetry."""
    async def event_generator():
        q = subscribe_to_scan(scan_id)
        try:
            while True:
                data = await q.get()
                yield {"data": data}
                parsed = json.loads(data)
                if parsed.get("type") in ["SCAN_COMPLETED", "ERROR"]:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            unsubscribe_from_scan(scan_id, q)

    return EventSourceResponse(event_generator())
