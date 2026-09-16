import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.schemas.pydantic_schemas import AttackTestCaseSchema

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "attack_battery.json"

_CACHED_BATTERY: Optional[List[AttackTestCaseSchema]] = None

def load_attack_battery(force_reload: bool = False) -> List[AttackTestCaseSchema]:
    """Loads and validates the structured attack battery from JSON."""
    global _CACHED_BATTERY
    if _CACHED_BATTERY is not None and not force_reload:
        return _CACHED_BATTERY

    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Attack battery dataset not found at {DATA_FILE}")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    validated = [AttackTestCaseSchema(**item) for item in raw_data]
    _CACHED_BATTERY = validated
    return _CACHED_BATTERY

def get_attack_by_id(attack_id: str) -> Optional[AttackTestCaseSchema]:
    battery = load_attack_battery()
    for attack in battery:
        if attack.id.upper() == attack_id.upper():
            return attack
    return None

def filter_battery(suite: str = "ALL") -> List[AttackTestCaseSchema]:
    """
    Filters attacks by suite specification:
    - 'ALL': Complete battery (14 probes)
    - 'QUICK': Representative probe from each category (~7 probes)
    - 'CRITICAL': Probes with CRITICAL severity
    - Category name (e.g. 'SYS_LEAK', 'DIR_OVR')
    """
    all_attacks = load_attack_battery()
    suite_upper = suite.upper().strip()

    if suite_upper == "ALL":
        return all_attacks

    if suite_upper == "QUICK":
        # One representative probe per distinct category
        seen_cats = set()
        quick_list = []
        for atk in all_attacks:
            if atk.category not in seen_cats:
                seen_cats.add(atk.category)
                quick_list.append(atk)
        return quick_list

    if suite_upper == "CRITICAL":
        return [atk for atk in all_attacks if atk.severity == "CRITICAL"]

    # Check if suite matches a category
    category_match = [atk for atk in all_attacks if atk.category.upper() == suite_upper]
    if category_match:
        return category_match

    return all_attacks
