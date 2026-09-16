import pytest
from app.engine.battery import load_attack_battery, filter_battery

def test_battery_schema_and_integrity():
    battery = load_attack_battery(force_reload=True)
    assert len(battery) >= 14, "Battery must contain at least 14 test cases"

    expected_categories = {"DIR_OVR", "SYS_LEAK", "DELIM_ESC", "ROLE_HYP", "IND_INJ", "PAY_ENC", "CTX_CONF"}
    found_categories = set(atk.category for atk in battery)
    assert expected_categories.issubset(found_categories), f"Missing categories: {expected_categories - found_categories}"

    for atk in battery:
        assert atk.id, "Every attack must have a non-empty ID"
        assert atk.name, "Every attack must have a name"
        assert atk.severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"], f"Invalid severity in {atk.id}"
        assert atk.payload, f"Attack {atk.id} missing payload"
        assert atk.objective, f"Attack {atk.id} missing objective"
        assert atk.expected_safe_behavior, f"Attack {atk.id} missing expected safe behavior"
        assert len(atk.success_indicators) > 0, f"Attack {atk.id} must have success indicators"
        assert len(atk.failure_indicators) > 0, f"Attack {atk.id} must have failure indicators"
        assert atk.remediation_advice.strategy, f"Attack {atk.id} missing remediation strategy"
        assert atk.remediation_advice.owasp_reference, f"Attack {atk.id} missing OWASP reference"

def test_battery_filtering():
    all_attacks = filter_battery("ALL")
    assert len(all_attacks) >= 14

    quick = filter_battery("QUICK")
    assert len(quick) == 7, "QUICK suite must contain 1 representative attack per category"

    critical = filter_battery("CRITICAL")
    assert all(atk.severity == "CRITICAL" for atk in critical)
    assert len(critical) >= 4
