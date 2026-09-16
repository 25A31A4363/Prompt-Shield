import pytest
from app.models.db_models import ScanRun, AttackResult
from app.engine.comparison import compare_scans

def test_scan_comparison_logic():
    base_scan = ScanRun(id="scan-base", security_score=55.0, grade="C")
    target_scan = ScanRun(id="scan-target", security_score=92.0, grade="A")

    base_results = [
        AttackResult(attack_id="SYS-LEAK-01", attack_name="Leak", category="SYS_LEAK", severity="CRITICAL", verdict="SUCCESSFUL"),
        AttackResult(attack_id="DIR-OVR-01", attack_name="Override", category="DIR_OVR", severity="HIGH", verdict="RESISTED"),
        AttackResult(attack_id="ROLE-HYP-01", attack_name="ChaosGPT", category="ROLE_HYP", severity="HIGH", verdict="SUCCESSFUL")
    ]

    target_results = [
        AttackResult(attack_id="SYS-LEAK-01", attack_name="Leak", category="SYS_LEAK", severity="CRITICAL", verdict="RESISTED"),  # FIXED
        AttackResult(attack_id="DIR-OVR-01", attack_name="Override", category="DIR_OVR", severity="HIGH", verdict="RESISTED"),     # UNCHANGED_SECURE
        AttackResult(attack_id="ROLE-HYP-01", attack_name="ChaosGPT", category="ROLE_HYP", severity="HIGH", verdict="RESISTED")    # FIXED
    ]

    diff = compare_scans(base_scan, target_scan, base_results, target_results)

    assert diff["score_delta"] == 37.0
    assert diff["grade_before"] == "C"
    assert diff["grade_after"] == "A"
    assert diff["fixed_count"] == 2
    assert "SYS-LEAK-01" in diff["fixed_attack_ids"]
    assert "ROLE-HYP-01" in diff["fixed_attack_ids"]
    assert diff["regression_count"] == 0

def test_scan_comparison_regression_alert():
    base_scan = ScanRun(id="scan-base", security_score=90.0, grade="A")
    target_scan = ScanRun(id="scan-target", security_score=60.0, grade="C")

    base_results = [
        AttackResult(attack_id="DIR-OVR-01", attack_name="Override", category="DIR_OVR", severity="HIGH", verdict="RESISTED")
    ]
    target_results = [
        AttackResult(attack_id="DIR-OVR-01", attack_name="Override", category="DIR_OVR", severity="HIGH", verdict="SUCCESSFUL")
    ]

    diff = compare_scans(base_scan, target_scan, base_results, target_results)
    assert diff["regression_count"] == 1
    assert "DIR-OVR-01" in diff["regressed_attack_ids"]
    assert diff["score_delta"] == -30.0
