import copy
from itertools import combinations
import json
from pathlib import Path
import subprocess
import sys
import unittest

from brandtopia import SCENARIOS, replay, simulate


ROOT = Path(__file__).resolve().parents[1]


class AwarenessTests(unittest.TestCase):
    def test_clustered_threshold_two_stays_at_six(self):
        seeds = frozenset({0, 1, 2, 3, 4, 5})
        log = simulate(SCENARIOS["clustered"])
        self.assertEqual(log["rounds"], [{"round": 1, "events": []}])
        self.assertEqual(replay(log), (seeds, seeds))

    def test_interleaved_threshold_two_reaches_everyone_in_one_round(self):
        log = simulate(SCENARIOS["interleaved"])
        self.assertEqual(log["rounds"], [
            {"round": 1, "events": [
                {"agent": 2, "sources": [1, 3]},
                {"agent": 4, "sources": [3, 5]},
                {"agent": 6, "sources": [5, 7]},
                {"agent": 8, "sources": [7, 9]},
            ]},
            {"round": 2, "events": []},
        ])
        self.assertEqual(tuple(map(len, replay(log))), (6, 10, 10))

    def test_threshold_one_has_synchronous_waves(self):
        clustered = replay(simulate(SCENARIOS["clustered"], 1))
        self.assertEqual(clustered, (
            frozenset({0, 1, 2, 3, 4, 5}),
            frozenset({0, 1, 2, 3, 4, 5, 6, 9}),
            frozenset(range(10)),
            frozenset(range(10)),
        ))
        interleaved = replay(simulate(SCENARIOS["interleaved"], 1))
        self.assertEqual(tuple(map(len, interleaved)), (6, 10, 10))

    def test_empty_full_and_singleton(self):
        for threshold in (1, 2):
            for seeds in (frozenset(), frozenset(range(10))):
                with self.subTest(threshold=threshold, seeds=seeds):
                    self.assertEqual(replay(simulate(seeds, threshold)), (seeds, seeds))
        self.assertEqual(replay(simulate((0,), 2)), (frozenset({0}),) * 2)
        log = simulate((0,), 1)
        self.assertEqual(log["rounds"][0]["events"], [
            {"agent": 1, "sources": [0]}, {"agent": 9, "sources": [0]},
        ])
        self.assertEqual(tuple(map(len, replay(log))), (1, 3, 5, 7, 9, 10, 10))

    def test_invalid_inputs(self):
        for threshold in (0, 3, True, 1.0):
            with self.subTest(threshold=threshold), self.assertRaises(ValueError):
                simulate((0,), threshold)
        for seeds in ((-1,), (10,), (True,), (1.0,), ("1",)):
            with self.subTest(seeds=seeds), self.assertRaises(ValueError):
                simulate(seeds)

    def test_determinism_and_json_round_trip(self):
        seeds = SCENARIOS["interleaved"]
        expected = simulate(seeds)
        for initial in (seeds, reversed(seeds), (*seeds, 1, 9)):
            self.assertEqual(json.dumps(simulate(initial)), json.dumps(expected))
        self.assertEqual(replay(json.loads(json.dumps(expected))), replay(expected))

    def test_replay_rejects_changed_sources_missing_events_and_bad_end(self):
        log = simulate(SCENARIOS["interleaved"])
        changed = copy.deepcopy(log)
        changed["rounds"][0]["events"][0]["sources"] = [0, 3]
        with self.assertRaisesRegex(ValueError, "round 1"):
            replay(changed)
        changed = copy.deepcopy(log)
        changed["rounds"][0]["events"].pop()
        with self.assertRaisesRegex(ValueError, "round 1"):
            replay(changed)
        changed = copy.deepcopy(log)
        changed["rounds"].pop()
        with self.assertRaisesRegex(ValueError, "ends before"):
            replay(changed)
        changed["rounds"] = log["rounds"] + [{"round": 3, "events": []}]
        with self.assertRaisesRegex(ValueError, "past the fixed point"):
            replay(changed)

    def test_all_initial_sets_match_independent_ring_properties(self):
        for size in range(11):
            for initial in combinations(range(10), size):
                seeds = frozenset(initial)
                # Threshold 1 expands by shortest-path distance from the nearest seed.
                # A threshold-2 activation can only fill an isolated gap at round 1.
                for threshold in (1, 2):
                    with self.subTest(initial=initial, threshold=threshold):
                        states = replay(simulate(initial, threshold))
                        for number, state in enumerate(states):
                            if threshold == 1:
                                expected = frozenset(
                                    agent for agent in range(10)
                                    if any(min(abs(agent - seed), 10 - abs(agent - seed)) <= number
                                           for seed in seeds)
                                )
                            elif number == 0:
                                expected = seeds
                            else:
                                expected = seeds.union(
                                    agent for agent in range(10)
                                    if (agent - 1) % 10 in seeds and (agent + 1) % 10 in seeds
                                )
                            self.assertEqual(state, expected)
                        self.assertEqual(states[-2], states[-1])
                        self.assertTrue(all(before < after for before, after in zip(states, states[1:-1])))
                        if threshold == 1 and seeds:
                            self.assertEqual(states[-1], frozenset(range(10)))
                        if threshold == 2:
                            self.assertLessEqual(len(states), 3)

    def test_cli_reproduces_saved_logs_and_replays_them(self):
        entry_point = [sys.executable, str(ROOT / "brandtopia.py")]
        expected_counts = {
            ("clustered", 1): 10,
            ("clustered", 2): 6,
            ("interleaved", 1): 10,
            ("interleaved", 2): 10,
        }
        for (scenario, threshold), final_count in expected_counts.items():
            with self.subTest(scenario=scenario, threshold=threshold):
                saved = ROOT / "results" / f"{scenario}-t{threshold}.json"
                run = subprocess.check_output(entry_point + ["run", scenario, "--threshold", str(threshold)])
                self.assertEqual(run, saved.read_bytes())
                playback = subprocess.check_output(entry_point + ["replay", str(saved)], text=True)
                self.assertTrue(playback.splitlines()[-1].endswith(f"{final_count}/10  fixed point"))


if __name__ == "__main__":
    unittest.main()
