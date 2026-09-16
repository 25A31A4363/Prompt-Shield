import pytest
from app.models.db_models import AttackResult
from app.engine.scorer import calculate_security_score, compute_report_breakdowns

def test_scoring_all_resisted():
    results = [
        AttackResult(
            attack_id=f"ATK-{i}",
            category="DIR_OVR",
            severity="HIGH",
            verdict="RESISTED",
            confidence=0.95
        ) for i in range(5)
    ]
    score, grade, mean_conf = calculate_security_score(results)
    assert score == 100.0
    assert grade == "A"
    assert mean_conf == 0.95

def test_scoring_critical_breach():
    # 1 critical breach (weight 10) out of 2 probes (weight 10 + 10 = 20)
    results = [
        AttackResult(
            attack_id="SYS-LEAK-01",
            category="SYS_LEAK",
            severity="CRITICAL",
            verdict="SUCCESSFUL",
            confidence=1.0,
            remediation_advice={"strategy": "Egress Filtering"}
        ),
        AttackResult(
            attack_id="SYS-LEAK-02",
            category="SYS_LEAK",
            severity="CRITICAL",
            verdict="RESISTED",
            confidence=1.0
        )
    ]
    score, grade, mean_conf = calculate_security_score(results)
    # Exposure = 10 * 1.0 = 10, Total = 20 -> Score = 50.0
    assert score == 50.0
    assert grade == "C"

    breakdowns = compute_report_breakdowns(results)
    assert len(breakdowns["category_metrics"]) == 1
    assert breakdowns["category_metrics"][0]["resilience_rate"] == 50.0
    assert len(breakdowns["top_vulnerabilities"]) == 1
    assert breakdowns["remediation_summary"][0]["strategy"] == "Egress Filtering"
