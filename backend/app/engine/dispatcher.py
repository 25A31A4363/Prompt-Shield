import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.engine.battery import filter_battery
from app.engine.targets import create_target_adapter
from app.engine.evaluators import evaluator
from app.engine.scorer import calculate_security_score
from app.models.db_models import ScanRun, AttackResult, TargetConfig
from app.schemas.pydantic_schemas import ScanProgressEvent, AttackResultResponse

logger = logging.getLogger("promptshield.dispatcher")

# In-memory pub/sub queues for active SSE scan streaming
scan_subscribers: Dict[str, List[asyncio.Queue]] = {}

def subscribe_to_scan(scan_id: str) -> asyncio.Queue:
    """Subscribes an SSE listener queue to receive scan progress events."""
    if scan_id not in scan_subscribers:
        scan_subscribers[scan_id] = []
    q = asyncio.Queue()
    scan_subscribers[scan_id].append(q)
    return q

def unsubscribe_from_scan(scan_id: str, q: asyncio.Queue):
    if scan_id in scan_subscribers:
        if q in scan_subscribers[scan_id]:
            scan_subscribers[scan_id].remove(q)
        if not scan_subscribers[scan_id]:
            del scan_subscribers[scan_id]

async def broadcast_event(scan_id: str, event_data: Dict[str, Any]):
    """Broadcasts an event to all connected SSE clients for this scan."""
    if scan_id in scan_subscribers:
        payload = json.dumps(event_data)
        for q in scan_subscribers[scan_id]:
            await q.put(payload)

class ScanDispatcher:
    """
    Orchestrates live scan runs against AI endpoints with rate limiting,
    error isolation, deterministic evaluation, and SSE streaming.
    """

    def __init__(self, concurrency: int = settings.DEFAULT_CONCURRENCY):
        self.semaphore = asyncio.Semaphore(concurrency)

    async def run_scan(
        self,
        scan_id: str,
        session_factory,
        enable_llm_judge: bool = False
    ):
        async with session_factory() as db:
            scan_query = await db.execute(select(ScanRun).where(ScanRun.id == scan_id))
            scan: ScanRun = scan_query.scalar_one_or_none()
            if not scan:
                logger.error(f"Scan {scan_id} not found in database.")
                return

            scan.status = "RUNNING"
            scan.started_at = datetime.now(timezone.utc)
            await db.commit()

            # Retrieve target config
            target_query = await db.execute(select(TargetConfig).where(TargetConfig.id == scan.target_id))
            target: TargetConfig = target_query.scalar_one_or_none()

            # Select attack probes
            attacks = filter_battery(scan.attack_suite)
            scan.total_probes = len(attacks)
            await db.commit()

            try:
                adapter = create_target_adapter(target)
            except Exception as e:
                scan.status = "FAILED"
                scan.error_message = f"Failed to initialize target adapter: {str(e)}"
                await db.commit()
                await broadcast_event(scan_id, {
                    "type": "ERROR",
                    "scan_id": scan_id,
                    "message": scan.error_message
                })
                return

        # Broadcast initial start event
        await broadcast_event(scan_id, {
            "type": "SCAN_STARTED",
            "scan_id": scan_id,
            "total_probes": len(attacks),
            "target_name": scan.target_name,
            "attack_suite": scan.attack_suite
        })

        results_accumulated: List[AttackResult] = []
        canary_secret = target.canary_secret if target else "SECRET_FLAG_PROMPT_SHIELD_99"

        # Execute attacks sequentially or with rate-limited concurrency
        for idx, attack in enumerate(attacks):
            await broadcast_event(scan_id, {
                "type": "PROBE_STARTING",
                "scan_id": scan_id,
                "current_index": idx + 1,
                "total_probes": len(attacks),
                "attack_id": attack.id,
                "attack_name": attack.name,
                "category": attack.category,
                "severity": attack.severity
            })

            # Execute with concurrency semaphore
            async with self.semaphore:
                try:
                    raw_resp, latency_ms = await asyncio.wait_for(
                        adapter.send_prompt(attack.payload, attack_id=attack.id),
                        timeout=settings.PROBE_TIMEOUT_SECONDS + 5.0
                    )
                except asyncio.TimeoutError:
                    raw_resp = "ERROR: Request timed out after 15 seconds."
                    latency_ms = settings.PROBE_TIMEOUT_SECONDS * 1000
                except Exception as e:
                    raw_resp = f"ERROR: Communication failure: {str(e)}"
                    latency_ms = 0.0

            # Evaluate response with deterministic pipeline
            eval_res = evaluator.evaluate(
                attack=attack,
                raw_response=raw_resp,
                target_canary_secret=canary_secret,
                enable_llm_judge=enable_llm_judge
            )

            # Persist attack result
            async with session_factory() as db:
                db_result = AttackResult(
                    scan_id=scan_id,
                    attack_id=attack.id,
                    attack_name=attack.name,
                    category=attack.category,
                    severity=attack.severity,
                    verdict=eval_res.verdict,
                    confidence=eval_res.confidence,
                    detection_stage=eval_res.detection_stage,
                    payload_sent=attack.payload,
                    raw_response=raw_resp[:settings.MAX_RESPONSE_BYTES],
                    rule_triggered=eval_res.rule_triggered,
                    matched_indicator=eval_res.matched_indicator,
                    evidence_snippet=eval_res.evidence_snippet,
                    rationale=eval_res.rationale,
                    latency_ms=latency_ms,
                    remediation_advice=attack.remediation_advice.model_dump()
                )
                db.add(db_result)
                await db.commit()
                await db.refresh(db_result)
                results_accumulated.append(db_result)

                # Update running scan stats
                scan_rec = await db.get(ScanRun, scan_id)
                if scan_rec:
                    scan_rec.completed_probes = len(results_accumulated)
                    if eval_res.verdict == "SUCCESSFUL":
                        scan_rec.successful_count += 1
                    elif eval_res.verdict == "RESISTED":
                        scan_rec.resisted_count += 1
                    elif eval_res.verdict == "PARTIAL":
                        scan_rec.partial_count += 1
                    else:
                        scan_rec.error_count += 1

                    cur_score, cur_grade, cur_conf = calculate_security_score(results_accumulated)
                    scan_rec.security_score = cur_score
                    scan_rec.grade = cur_grade
                    scan_rec.mean_confidence = cur_conf
                    await db.commit()

            # Broadcast progress event
            cur_score, cur_grade, _ = calculate_security_score(results_accumulated)
            await broadcast_event(scan_id, {
                "type": "PROBE_RESULT",
                "scan_id": scan_id,
                "completed_probes": len(results_accumulated),
                "total_probes": len(attacks),
                "percent": round((len(results_accumulated) / len(attacks)) * 100, 1),
                "current_score": cur_score,
                "current_grade": cur_grade,
                "result": {
                    "attack_id": attack.id,
                    "attack_name": attack.name,
                    "category": attack.category,
                    "severity": attack.severity,
                    "verdict": eval_res.verdict,
                    "confidence": eval_res.confidence,
                    "detection_stage": eval_res.detection_stage,
                    "matched_indicator": eval_res.matched_indicator,
                    "evidence_snippet": eval_res.evidence_snippet,
                    "rationale": eval_res.rationale,
                    "latency_ms": latency_ms
                }
            })

            # Small breather between requests
            await asyncio.sleep(0.05)

        # Finalize scan status
        async with session_factory() as db:
            scan_rec = await db.get(ScanRun, scan_id)
            if scan_rec:
                scan_rec.status = "COMPLETED"
                scan_rec.completed_at = datetime.now(timezone.utc)
                final_score, final_grade, mean_conf = calculate_security_score(results_accumulated)
                scan_rec.security_score = final_score
                scan_rec.grade = final_grade
                scan_rec.mean_confidence = mean_conf
                await db.commit()

        # Broadcast completion event
        await broadcast_event(scan_id, {
            "type": "SCAN_COMPLETED",
            "scan_id": scan_id,
            "final_score": final_score,
            "final_grade": final_grade,
            "successful_count": sum(1 for r in results_accumulated if r.verdict == "SUCCESSFUL"),
            "resisted_count": sum(1 for r in results_accumulated if r.verdict == "RESISTED")
        })

dispatcher = ScanDispatcher()
