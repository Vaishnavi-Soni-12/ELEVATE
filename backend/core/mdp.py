"""
ELEVATE MDP Core — State Space, Transitions, Reward Function
============================================================
Models an N-elevator, F-floor building as a discrete MDP.

STATE:   Tuple of elevator positions, e.g. (3, 7, 12, 1) for 4 elevators
ACTION:  Tuple of target floors for each elevator, e.g. (4, 8, 12, 3)
REWARD:  −(total_passenger_wait) + throughput_bonus − energy_cost
"""

import numpy as np
import itertools
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional
import random
import time

# ─── Traffic Regime Definitions ──────────────────────────────────────────────
# Each entry: (arrival_rate, label, description, floor_bias)
# floor_bias: 'lobby' = heavy lobby traffic, 'top' = heavy upper-floor traffic,
#             'spread' = uniform spread,  'inter' = inter-floor only, 'peak' = specific floor burst
TRAFFIC_REGIMES: Dict[str, Dict] = {
    "morning": {
        "label": "Morning Peak",
        "description": "80% upward from lobby — employees arriving",
        "arrival_rate": 0.60,
        "floor_bias": "lobby",
        "lobby_weight": 0.80,
    },
    "evening": {
        "label": "Evening Peak",
        "description": "75% downward to lobby — employees departing",
        "arrival_rate": 0.55,
        "floor_bias": "top",
        "lobby_weight": 0.75,
    },
    "lunch": {
        "label": "Lunch Hour",
        "description": "Inter-floor traffic — cafeteria / mid-floors",
        "arrival_rate": 0.35,
        "floor_bias": "inter",
        "lobby_weight": 0.30,
    },
    "event": {
        "label": "Event Mode",
        "description": "Burst traffic to/from event floor (top-3)",
        "arrival_rate": 0.75,
        "floor_bias": "peak",
        "lobby_weight": 0.50,
    },
    "maintenance": {
        "label": "Maintenance",
        "description": "Reduced traffic — off-hours with low demand",
        "arrival_rate": 0.10,
        "floor_bias": "spread",
        "lobby_weight": 0.40,
    },
    "uniform": {
        "label": "Uniform Random",
        "description": "Baseline stochastic traffic across all floors",
        "arrival_rate": 0.30,
        "floor_bias": "spread",
        "lobby_weight": 0.50,
    },
}


# ─── Data Structures ──────────────────────────────────────────────────────────

@dataclass
class ElevatorState:
    id: int
    floor: int
    direction: str          # "up" | "down" | "idle"
    passengers: int = 0
    destination: Optional[int] = None


@dataclass
class BuildingState:
    """Snapshot of the full system at a given tick."""
    tick: int
    elevators: List[ElevatorState]
    pending_calls: List[Tuple[int, str]]   # [(floor, direction), ...]
    total_wait: float = 0.0
    total_served: int = 0
    total_energy: float = 0.0


@dataclass
class DecisionRecord:
    """One (s, a, r, s') tuple logged for the audit trail."""
    id: str
    tick: int
    time_str: str
    state: str
    action: str
    reward: float
    value: float
    next_state: str
    policy_update: str = "π(s) updated"
    algorithm: str = "policy_iteration"


# ─── MDP Environment ──────────────────────────────────────────────────────────

class ElevatorMDP:
    """
    Discrete MDP representation of the multi-elevator system.
    State space: all combinations of elevator floor positions.
    Action space: all valid next-floor assignments.
    Reward:       Bellman-optimized composite of wait, energy, throughput.
    """

    def __init__(self, num_elevators: int, num_floors: int, capacity: int, gamma: float):
        self.num_elevators = num_elevators
        self.num_floors = num_floors
        self.capacity = capacity
        self.gamma = gamma

        # States: all tuples (e1_floor, e2_floor, ..., eN_floor)
        self.states = list(itertools.product(range(num_floors), repeat=num_elevators))
        self.state_index = {s: i for i, s in enumerate(self.states)}
        self.num_states = len(self.states)

        # Actions: each elevator moves ±1 or stays
        # Encoded as a tuple of deltas (-1, 0, +1) per elevator
        self._action_deltas = list(itertools.product([-1, 0, 1], repeat=num_elevators))
        self.num_actions = len(self._action_deltas)

        # Pending floor calls (simulated demand)
        self._calls: List[Tuple[int, str]] = []
        self._call_arrival_rate = 0.3     # probability a new call arrives per tick
        self._active_regime: str = "uniform"   # current traffic regime key
        self._regime_cfg: Dict = TRAFFIC_REGIMES["uniform"]

        # Value function & policy tables
        self.V = np.zeros(self.num_states)
        self.policy = np.zeros(self.num_states, dtype=int)   # index into action deltas

    # ── Reward ────────────────────────────────────────────────────────────────

    def reward(self, state: Tuple, action_idx: int) -> float:
        """
        R(s, a) = −wait_penalty + throughput_bonus − energy_cost
        """
        deltas = self._action_deltas[action_idx]
        new_positions = tuple(
            max(0, min(self.num_floors - 1, state[i] + deltas[i]))
            for i in range(self.num_elevators)
        )

        # Penalise total distance from all pending calls
        wait_penalty = 0.0
        served_bonus = 0.0
        for (call_floor, _direction) in self._calls:
            distances = [abs(new_positions[e] - call_floor) for e in range(self.num_elevators)]
            min_dist = min(distances)
            wait_penalty += min_dist * 0.5
            if min_dist == 0:
                served_bonus += 10.0   # elevator reached the call floor

        # Energy cost: proportional to total movement
        energy_cost = sum(abs(d) for d in deltas) * 0.2

        return -wait_penalty + served_bonus - energy_cost

    # ── Transition ────────────────────────────────────────────────────────────

    def transition(self, state: Tuple, action_idx: int) -> Tuple:
        """Deterministic transition (elevators move as directed)."""
        deltas = self._action_deltas[action_idx]
        return tuple(
            max(0, min(self.num_floors - 1, state[i] + deltas[i]))
            for i in range(self.num_elevators)
        )

    # ── Traffic Regime ────────────────────────────────────────────────────────

    def set_traffic_regime(self, regime_key: str) -> Dict:
        """Switch the active traffic regime. Returns the new regime config."""
        key = regime_key.lower()
        if key not in TRAFFIC_REGIMES:
            key = "uniform"
        self._active_regime = key
        self._regime_cfg = TRAFFIC_REGIMES[key]
        self._call_arrival_rate = self._regime_cfg["arrival_rate"]
        return {"regime": key, **self._regime_cfg}

    def get_regime_info(self) -> Dict:
        """Return current regime info for frontend display."""
        return {"key": self._active_regime, **self._regime_cfg}

    # ── Call generator ────────────────────────────────────────────────────────

    def generate_calls(self) -> None:
        """Probabilistically add new passenger calls each tick,
        biased by the active traffic regime."""
        if random.random() < self._call_arrival_rate:
            bias = self._regime_cfg.get("floor_bias", "spread")
            lobby_w = self._regime_cfg.get("lobby_weight", 0.5)

            if bias == "lobby":
                # Morning peak: heavy lobby (floor 0) origin
                if random.random() < lobby_w:
                    floor = 0
                else:
                    floor = random.randint(1, self.num_floors - 1)
            elif bias == "top":
                # Evening peak: heavy upper-floor origin (going down)
                if random.random() < lobby_w:
                    floor = random.randint(max(1, self.num_floors - 5), self.num_floors - 1)
                else:
                    floor = random.randint(0, self.num_floors - 1)
            elif bias == "inter":
                # Lunch: avoid lobby and top floor
                floor = random.randint(1, max(1, self.num_floors - 2))
            elif bias == "peak":
                # Event: top 3 floors get burst
                if random.random() < 0.5:
                    floor = random.randint(max(0, self.num_floors - 3), self.num_floors - 1)
                else:
                    floor = random.randint(0, self.num_floors - 1)
            else:
                floor = random.randint(0, self.num_floors - 1)

            direction = "up" if floor < self.num_floors - 1 else "down"
            call = (floor, direction)
            if call not in self._calls:
                self._calls.append(call)
        # Remove calls that have been served (elevator at that floor)
        # (handled by simulator)

    def add_call(self, floor: int, direction: str) -> None:
        """Manually inject a passenger call (e.g. from UI)."""
        call = (max(0, min(self.num_floors - 1, floor)), direction.lower())
        if call not in self._calls:
            self._calls.append(call)

    def serve_calls(self, positions: Tuple) -> int:
        """Remove calls that are now served. Returns count served."""
        before = len(self._calls)
        self._calls = [c for c in self._calls if c[0] not in positions]
        return before - len(self._calls)
