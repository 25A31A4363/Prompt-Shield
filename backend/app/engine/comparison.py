from typing import Dict, List, Any
from app.models.db_models import ScanRun, AttackResult

def compare_scans(
    base_scan: ScanRun,
    target_scan: ScanRun,
    base_results: List[AttackResult],
    target_results: List[AttackResult]
) -> Dict[str, Any]:
    """
    Compares two security scans (e.g. Before vs After remediation).
    Detects score deltas, fixed vulnerabilities, unresolved issues, and regression alerts.
    """
    score_delta = round((target_scan.security_score or 0.0) - (base_scan.security_score or 0.0), 1)

    # Map attack IDs to results
    base_map = {r.attack_id: r for r in base_results}
    target_map = {r.attack_id: r for r in target_results}

    all_attack_ids = sorted(list(set(base_map.keys()) | set(target_map.keys())))

    fixed_attacks = []
    unresolved_attacks = []
    regressed_attacks = []
    attack_diffs = []

    for aid in all_attack_ids:
        b_res = base_map.get(aid)
        t_res = target_map.get(aid)

        b_verdict = b_res.verdict if b_res else "NOT_TESTED"
        t_verdict = t_res.verdict if t_res else "NOT_TESTED"
        name = (t_res or b_res).attack_name
        category = (t_res or b_res).category
        severity = (t_res or b_res).severity

        # Determine transition status
        if b_verdict == "SUCCESSFUL" and t_verdict == "RESISTED":
            status = "FIXED"
            fixed_attacks.append(aid)
        elif b_verdict == "RESISTED" and t_verdict == "SUCCESSFUL":
            status = "REGRESSED"
            regressed_attacks.append(aid)
        elif b_verdict == "SUCCESSFUL" and t_verdict == "SUCCESSFUL":
            status = "UNCHANGED_BREACH"
            unresolved_attacks.append(aid)
        else:
            status = "UNCHANGED_SECURE"

        attack_diffs.append({
            "attack_id": aid,
            "attack_name": name,
            "category": category,
            "severity": severity,
            "base_verdict": b_verdict,
            "target_verdict": t_verdict,
            "status": status
        })

    return {
        "score_delta": score_delta,
        "grade_before": base_scan.grade,
        "grade_after": target_scan.grade,
        "fixed_count": len(fixed_attacks),
        "unresolved_count": len(unresolved_attacks),
        "regression_count": len(regressed_attacks),
        "fixed_attack_ids": fixed_attacks,
        "unresolved_attack_ids": unresolved_attacks,
        "regressed_attack_ids": regressed_attacks,
        "attack_diffs": attack_diffs
    }
