#!/usr/bin/env python3
"""Recalculate archived synthetic examples, not new empirical research.

Python 3.10+, standard library only. From the repository root:
    python3 scripts/verify_archived_calculations.py --check
    python3 scripts/verify_archived_calculations.py --write

No consumer observations are loaded. These are recovered formulas and explicit
toy assumptions, not a reproduction of missing historical browser draw logs.
Source fragments and limitations are linked by the experiment archive.
"""

from __future__ import annotations

import argparse
import json
import math
from fractions import Fraction
from pathlib import Path
from statistics import NormalDist

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "results" / "archive-calculations.json"


def rounded(value: float) -> float:
    result = round(value, 12)
    return 0.0 if result == 0 else result


def sequential(initial: str, order: tuple[int, int]) -> str:
    state = [int(x) for x in initial]
    for index in order:
        state[index] = int(sum(state) - state[index] >= 2)
    return "".join(map(str, state))


def experience_sequence(learns: bool, rounds: int = 5) -> list[str]:
    state, thresholds, counts = [1, 0, 0], [0, 2, 2], [0, 0, 0]
    sequence = ["100"]
    for turn in range(1, rounds + 1):
        previous = state[:]
        state = [1] + [
            int((turn == 1 and i == 1)
                or sum(previous) - previous[i] >= thresholds[i])
            for i in (1, 2)
        ]
        counts = [a + b for a, b in zip(counts, state)]
        if learns:
            thresholds = [0] + [1 if counts[i] >= 2 else 2 for i in (1, 2)]
        sequence.append("".join(map(str, state)))
    return sequence


def sample_size(p0: float, p1: float) -> float:
    """Equal independent groups; two-sided alpha=.05, power=.80.

    Normal approximation with pooled null variance and unpooled alternative
    variance. No continuity correction, multiplicity or dropout allowance.
    """
    z_alpha = NormalDist().inv_cdf(0.975)
    z_power = NormalDist().inv_cdf(0.80)
    pooled = (p0 + p1) / 2
    numerator = (z_alpha * math.sqrt(2 * pooled * (1 - pooled))
                 + z_power * math.sqrt(p0 * (1 - p0) + p1 * (1 - p1))) ** 2
    return numerator / (p1 - p0) ** 2


def minimum_detectable_difference(total_n: int) -> float:
    low, high = 0.20 + 1e-8, 0.95
    for _ in range(100):
        middle = (low + high) / 2
        if sample_size(0.20, middle) > total_n / 2:
            low = middle
        else:
            high = middle
    return (low + high) / 2 - 0.20


def calculate() -> dict:
    orders = {
        "110_then_B_C": sequential("110", (1, 2)),
        "101_then_B_C": sequential("101", (1, 2)),
        "110_then_C_B": sequential("110", (2, 1)),
    }
    assert orders == {"110_then_B_C": "100", "101_then_B_C": "111", "110_then_C_B": "111"}
    fixed, learned = experience_sequence(False), experience_sequence(True)
    assert fixed == ["100", "110", "101", "110", "101", "110"]
    assert learned == ["100", "110", "101", "110", "111", "111"]

    # Exact binomial arithmetic: equality of means does not imply equal tails.
    p = Fraction(9, 10)
    independent = [Fraction(math.comb(10, k)) * p**k * (1-p)**(10-k) for k in range(11)]
    shared = [Fraction(1, 10)] + [Fraction(0)] * 9 + [Fraction(9, 10)]
    assert sum(independent) == sum(shared) == 1
    assert sum(k * q for k, q in enumerate(independent)) == sum(k * q for k, q in enumerate(shared)) == 9

    ceiling = 1000 * 0.9**2
    recovery = [ceiling * (1 - 0.5**day) for day in range(15)]
    assert math.isclose(recovery[1], 405.0)
    assert math.isclose(recovery[2], 607.5)
    assert all(0 <= a <= b <= ceiling for a, b in zip(recovery, recovery[1:]))

    worlds = {"A": [90] * 4 + [60] * 6, "B": [110] * 4 + [60] * 6}
    price_counts = {name: {str(price): sum(value >= price for value in values) for price in (80, 100)}
                    for name, values in worlds.items()}
    assert price_counts == {"A": {"80": 4, "100": 0}, "B": {"80": 4, "100": 4}}
    ad_contribution = 4 * (100 - 60) - 40
    discount_contribution = 4 * (100 - 10 - 60)
    assert ad_contribution == discount_contribution == 120
    old_retention = [2 + 2 * 0.7**turn for turn in range(6)]
    assert math.isclose(old_retention[1], 3.4) and math.isclose(old_retention[4], 2.4802)

    unfamiliar = [0.0 if n == 0 else 1 - 0.78**n - n * 0.22 * 0.78**(n-1) for n in range(21)]
    familiar = [1 - 0.55 * 0.55**n for n in range(21)]
    assert all(-1e-12 <= value <= 1 for value in unfamiliar + familiar)
    assert all(a <= b + 1e-12 for a, b in zip(unfamiliar, unfamiliar[1:]))

    posteriors = []
    for k in range(7):
        posterior = Fraction(6**k, 6**k + 99)
        predicted_bad = Fraction(1, 10) + Fraction(1, 2) * posterior
        posteriors.append({"consecutive_bad": k, "p_changed": rounded(float(posterior)),
                           "p_next_bad": rounded(float(predicted_bad))})
    assert Fraction(6**3, 6**3 + 99) == Fraction(24, 35)

    task_choices = []
    for weight in (0.8, 0.7, 0.2):
        score_a, score_b = 9 * weight + 5 * (1-weight), 6 * weight + 8 * (1-weight)
        p_a = 1 / (1 + math.exp(score_b - score_a))
        task_choices.append({"task_weight": weight, "score_a": rounded(score_a),
                             "score_b": rounded(score_b), "p_a": rounded(p_a), "p_b": rounded(1-p_a)})
    assert math.isclose(task_choices[0]["p_a"], task_choices[2]["p_b"], abs_tol=1e-11)

    sample_plans = []
    for p1 in (0.4, 0.35, 0.3, 0.25):
        n = sample_size(0.20, p1)
        sample_plans.append({"p0": 0.20, "p1": p1, "effect_pp": rounded(100 * (p1-0.20)),
                             "n_per_group_unrounded": rounded(n), "n_per_group": math.ceil(n),
                             "total_n": 2 * math.ceil(n)})
    assert [x["total_n"] for x in sample_plans] == [164, 276, 588, 2188]

    return {
        "schema": "brandtopia.archived-calculations.v1",
        "archived_on": "2026-11-22",
        "status": "synthetic_calculation_verified",
        "empirical_validation": False,
        "scope": "Recalculation of explicit historical toy formulas; no human data, no new paper replication, no recovered random history.",
        "three_person": {"record": "CHAT-01", "sequential_outcomes": orders,
                         "random_order_theoretical_probabilities": {"100": 0.5, "111": 0.5},
                         "fixed_threshold_sequence": fixed, "experience_sequence": learned},
        "attendance": {"record": "CHAT-03", "n": 10, "marginal_attendance_probability": 0.9,
                       "expected_count_both": 9, "independent_p_all_absent": float(independent[0]),
                       "shared_p_all_absent": float(shared[0]),
                       "independent_count_probabilities": [rounded(float(q)) for q in independent],
                       "shared_count_probabilities": [rounded(float(q)) for q in shared]},
        "route_recovery": {"record": "CHAT-04", "n": 1000, "daily_alternative_commitment": 0.1,
                           "outage_days": 2, "daily_return_fraction": 0.5, "limit": rounded(ceiling),
                           "expected_counts_t0_to_t14": list(map(rounded, recovery))},
        "price": {"record": "CHAT-06", "buy_counts": price_counts,
                  "stable_choice_assumptions_required": True},
        "ad_discount": {"record": "CHAT-07", "ad_budget": 40, "discount_budget": 40,
                        "orders_both": 4, "ad_contribution": ad_contribution,
                        "discount_contribution": discount_contribution,
                        "metric": "Contribution after product cost and specified intervention only; not net profit."},
        "old_retention_audit": {"record": "CHAT-08", "illustrative_total_t0_to_t5": list(map(rounded, old_retention)),
                                "formula": "2 + 2 * 0.7**t", "limit": 2,
                                "warning": "Explanation of old illustrative output, not a repaired or validated ad-versus-promotion engine."},
        "stage_learning": {"record": "CHAT-09", "per_exposure_progress": 0.22,
                           "unfamiliar_two_stage_probability_n0_to_n20": list(map(rounded, unfamiliar)),
                           "familiar_initial_level": 0.45,
                           "familiar_retrieval_probability_n0_to_n20": list(map(rounded, familiar))},
        "belief_update": {"record": "CHAT-12", "prior_changed": 0.01, "bad_rate_stable": 0.1,
                          "bad_rate_changed": 0.6, "posterior_rows": posteriors,
                          "after_three_bad_cautious_stops_at_risk_gt_0_25": posteriors[3]["p_next_bad"] > 0.25,
                          "after_three_bad_tolerant_stops_at_risk_gt_0_50": posteriors[3]["p_next_bad"] > 0.50,
                          "sequence_sensitive_change_point_model": False},
        "task_choice": {"record": "CHAT-17", "brand_a": [9, 5], "brand_b": [6, 8],
                        "rows": task_choices, "denominator": "Choice occasions conditional on buying one of A and B."},
        "human_sample_planning": {"record": "CHAT-20", "data_collected": False, "alpha_two_sided": 0.05,
                                  "power": 0.80, "method": "Equal independent groups; normal approximation; no continuity correction.",
                                  "plans": sample_plans,
                                  "mde_pp_at_total_n": {str(n): rounded(100 * minimum_detectable_difference(n)) for n in (200, 240)}}
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--write", action="store_true", help="Write recalculated reference JSON")
    group.add_argument("--check", action="store_true", help="Compare against checked-in JSON")
    args = parser.parse_args()
    result = calculate()
    if args.check:
        recorded = json.loads(OUTPUT.read_text(encoding="utf-8"))
        if recorded != result:
            raise SystemExit("Archived calculation mismatch; inspect changes before replacing the reference.")
        print("Archived calculations match; invariants passed. All inputs are synthetic.")
    elif args.write:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Wrote results/archive-calculations.json (synthetic historical examples).")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
