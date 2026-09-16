import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import mask_api_key, validate_url_safety
from app.models.db_models import TargetConfig
from app.schemas.pydantic_schemas import (
    TargetCreate, TargetResponse, TargetTestRequest, TargetTestResponse
)
from app.engine.targets import create_target_adapter

router = APIRouter(prefix="/targets", tags=["Targets"])

@router.get("", response_model=List[TargetResponse])
async def list_targets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TargetConfig).order_by(TargetConfig.created_at.desc()))
    targets = result.scalars().all()
    return targets

@router.post("", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
async def create_target(payload: TargetCreate, db: AsyncSession = Depends(get_db)):
    if payload.target_type != "SANDBOX" and payload.base_url:
        is_safe, reason = validate_url_safety(payload.base_url)
        if not is_safe:
            raise HTTPException(status_code=400, detail=reason)

    masked_key = mask_api_key(payload.api_key) if payload.api_key else None

    target = TargetConfig(
        name=payload.name,
        target_type=payload.target_type,
        sandbox_mode=payload.sandbox_mode,
        base_url=payload.base_url,
        api_key_masked=masked_key,
        api_key_encrypted=payload.api_key,  # Store securely for dispatcher use
        model_name=payload.model_name,
        system_prompt=payload.system_prompt,
        custom_headers=payload.custom_headers,
        custom_body_template=payload.custom_body_template,
        response_jsonpath=payload.response_jsonpath,
        canary_secret=payload.canary_secret or "PROMPT_SHIELD_CANARY_ALPHA_99"
    )
    db.add(target)
    await db.commit()
    await db.refresh(target)
    return target

@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_target(target_id: str, db: AsyncSession = Depends(get_db)):
    target = await db.get(TargetConfig, target_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    await db.delete(target)
    await db.commit()
    return None

@router.post("/test", response_model=TargetTestResponse)
async def test_target_connection(req: TargetTestRequest):
    """Pre-flight test to verify target credentials and connectivity."""
    start_time = time.perf_counter()
    try:
        adapter = create_target_adapter(req)
        reply, latency = await adapter.send_prompt("Ping test: confirm availability.")
        return TargetTestResponse(
            success=True,
            status_code=200,
            latency_ms=latency,
            message="Connection established successfully.",
            sample_response=reply[:200]
        )
    except Exception as e:
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        return TargetTestResponse(
            success=False,
            status_code=500,
            latency_ms=latency,
            message=f"Target connection failed: {str(e)}",
            sample_response=None
        )
