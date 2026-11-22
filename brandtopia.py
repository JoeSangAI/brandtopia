"""Brandtopia v0.1: deterministic awareness propagation on a ten-agent ring."""

import argparse
from collections.abc import Iterable, Sequence
import json
from pathlib import Path
from typing import TypedDict


AGENTS = tuple(range(10))
NEIGHBORS = tuple(
    tuple(sorted(((agent - 1) % len(AGENTS), (agent + 1) % len(AGENTS))))
    for agent in AGENTS
)
SCENARIOS = {
    "clustered": (0, 1, 2, 3, 4, 5),
    "interleaved": (0, 1, 3, 5, 7, 9),
}
SCHEMA = "brandtopia.awareness.v0.1"


class Event(TypedDict):
    agent: int
    sources: list[int]


class Round(TypedDict):
    round: int
    events: list[Event]


class RunLog(TypedDict):
    schema: str
    threshold: int
    initial: list[int]
    rounds: list[Round]


def _initial_state(initial: Iterable[int], threshold: int) -> frozenset[int]:
    if type(threshold) is not int or threshold not in (1, 2):
        raise ValueError("threshold must be 1 or 2")
    seeds = tuple(initial)
    if any(type(agent) is not int or agent not in AGENTS for agent in seeds):
        raise ValueError("initial agent IDs must be integers from 0 to 9")
    return frozenset(seeds)


def _events(aware: frozenset[int], threshold: int) -> list[Event]:
    events: list[Event] = []
    for agent in AGENTS:
        if agent in aware:
            continue
        sources = [neighbor for neighbor in NEIGHBORS[agent] if neighbor in aware]
        if len(sources) >= threshold:
            events.append({"agent": agent, "sources": sources})
    return events


def _apply(aware: frozenset[int], events: list[Event]) -> frozenset[int]:
    return aware.union(event["agent"] for event in events)


def simulate(initial: Iterable[int], threshold: int = 2) -> RunLog:
    """Log round zero's seeds and each transition, including the fixed-point check."""
    aware = _initial_state(initial, threshold)
    log: RunLog = {
        "schema": SCHEMA,
        "threshold": threshold,
        "initial": sorted(aware),
        "rounds": [],
    }
    while True:
        events = _events(aware, threshold)
        log["rounds"].append({"round": len(log["rounds"]) + 1, "events": events})
        if not events:
            return log
        aware = _apply(aware, events)


def replay(log: RunLog) -> tuple[frozenset[int], ...]:
    """Recover snapshots from recorded events and verify each against the rule."""
    if not isinstance(log, dict) or log.keys() != {"schema", "threshold", "initial", "rounds"}:
        raise ValueError("invalid log structure")
    if log["schema"] != SCHEMA:
        raise ValueError("unsupported log schema")
    initial, threshold, rounds = log["initial"], log["threshold"], log["rounds"]
    if not isinstance(initial, list) or not isinstance(rounds, list) or not rounds:
        raise ValueError("log needs an initial list and at least one round")
    aware = _initial_state(initial, threshold)
    if initial != sorted(aware):
        raise ValueError("initial IDs must be sorted and unique")
    snapshots = [aware]
    for number, record in enumerate(rounds, start=1):
        expected = {"round": number, "events": _events(aware, threshold)}
        if _json(record) != _json(expected):
            raise ValueError(f"round {number} does not match the transition rule")
        events = record["events"]
        aware = _apply(aware, events)
        snapshots.append(aware)
        if not events:
            if number != len(rounds):
                raise ValueError("log continues past the fixed point")
            return tuple(snapshots)
    raise ValueError("log ends before the fixed-point check")


def _json(value: object) -> str:
    return json.dumps(value, indent=2, sort_keys=True)


def _print_snapshots(snapshots: tuple[frozenset[int], ...]) -> None:
    print("round  0123456789  aware   (# aware, . unaware)")
    for number, state in enumerate(snapshots):
        markers = "".join("#" if agent in state else "." for agent in AGENTS)
        note = "  fixed point" if number == len(snapshots) - 1 else ""
        print(f"{number:>5}  {markers}  {len(state):>2}/10{note}")


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run", help="write a JSON event log to standard output")
    run.add_argument("scenario", choices=SCENARIOS)
    run.add_argument("--threshold", type=int, choices=(1, 2), default=2)
    playback = commands.add_parser("replay", help="verify a log and show every snapshot")
    playback.add_argument("log", type=Path)
    args = parser.parse_args(argv)
    if args.command == "run":
        print(_json(simulate(SCENARIOS[args.scenario], args.threshold)))
        return
    try:
        snapshots = replay(json.loads(args.log.read_text(encoding="utf-8")))
    except (OSError, ValueError) as error:
        parser.error(str(error))
    _print_snapshots(snapshots)


if __name__ == "__main__":
    main()
