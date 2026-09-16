import pytest
import pytest_asyncio
from app.core.database import Base, AsyncSessionLocal, init_db
from app.models.db_models import TargetConfig, ScanRun, AttackResult
from app.engine.dispatcher import dispatcher

@pytest_asyncio.fixture
async def test_session_factory():
    await init_db()
    yield AsyncSessionLocal

@pytest.mark.asyncio
async def test_complete_sandbox_scan_flow(test_session_factory):
    # 1. Create Target in test DB (Mixed Mode Sandbox)
    async with test_session_factory() as db:
        target = TargetConfig(
            id="test-target-mixed",
            name="Test Sandbox Mixed",
            target_type="SANDBOX",
            sandbox_mode="MIXED",
            canary_secret="SECRET_FLAG_PROMPT_SHIELD_99"
        )
        db.add(target)

        scan = ScanRun(
            id="test-scan-run-01",
            target_id=target.id,
            target_name=target.name,
            target_type=target.target_type,
            sandbox_mode=target.sandbox_mode,
            status="PENDING",
            attack_suite="QUICK"  # 7 representative probes
        )
        db.add(scan)
        await db.commit()

    # 2. Run scan through real dispatcher
    await dispatcher.run_scan(
        scan_id="test-scan-run-01",
        session_factory=test_session_factory,
        enable_llm_judge=False
    )

    # 3. Verify database state
    async with test_session_factory() as db:
        scan_rec = await db.get(ScanRun, "test-scan-run-01")
        assert scan_rec.status == "COMPLETED"
        assert scan_rec.completed_probes == 7
        assert scan_rec.successful_count > 0, "Mixed mode should produce successful breaches"
        assert scan_rec.resisted_count > 0, "Mixed mode should also produce resisted attacks"
        assert 0.0 < scan_rec.security_score < 100.0, f"Score should be mixed: {scan_rec.security_score}"

        # Verify attack results
        from sqlalchemy import select
        res_q = await db.execute(select(AttackResult).where(AttackResult.scan_id == "test-scan-run-01"))
        results = res_q.scalars().all()
        assert len(results) == 7

        # Check evidence fields on every result
        for r in results:
            assert r.verdict in ["SUCCESSFUL", "RESISTED"]
            assert r.confidence > 0.0
            assert r.evidence_snippet
            assert r.rationale
            assert r.detection_stage
