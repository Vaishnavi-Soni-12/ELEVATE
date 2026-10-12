"""
ELEVATE — Simulation Engine
============================
Drives the real-time elevator simulation using the converged policy.
Produces per-tick state snapshots that are streamed to the frontend via WebSocket.
Also generates the Decision Audit log (one record per tick per dispatch decision).
"""

import asyncio
import time
import random
import uuid
from datetime import datetime
from typing import List, Dict, Optional, AsyncGenerator
from .mdp import ElevatorMDP, ElevatorState, BuildingState, DecisionRecord


class SimulationEngine:
    """
    Ticks the elevator world forward using the computed policy.
    Thread-safe for async WebSocket streaming.
    """

    def __init__(self, mdp: ElevatorMDP, tick_interval_ms: int = 400):
        self.mdp = mdp
        self.tick_interval_s = tick_interval_ms / 1000.0
        self.tick = 0
        self.running = False
        self.paused = False

        # Per-elevator position (floor index)
        self.positions: List[int] = [0] * mdp.num_elevators
        self.passengers: List[int] = [0] * mdp.num_elevators
        self.passenger_counts: List[int] = [random.randint(1, 3) for _ in range(mdp.num_elevators)]
        self.destinations: List[Optional[int]] = [None] * mdp.num_elevators

        # Metrics
        self.total_served: int = 0
        self.total_wait_ticks: float = 0.0
        self.total_energy: float = 0.0

        # Audit trail
        self.audit_log: List[DecisionRecord] = []
        self.max_log_size: int = 500

    # ── State helpers ────────────────────────────────────────────────────────

    def _current_state_tuple(self):
        return tuple(self.positions)

    def _get_state_idx(self) -> int:
        st = self._current_state_tuple()
        return self.mdp.state_index.get(st, 0)

    def _direction(self, elv_id: int, target: Optional[int]) -> str:
        if target is None:
            return "idle"
        delta = target - self.positions[elv_id]
        if delta > 0:
            return "up"
        elif delta < 0:
            return "down"
        return "idle"

    # ── Tick ────────────────────────────────────────────────────────────────

    def step(self) -> Dict:
        """Advance one simulation tick. Returns the full state dict for the frontend."""
        self.tick += 1
        prev_state = self._current_state_tuple()
        prev_si = self.mdp.state_index.get(prev_state, 0)
        v_before = float(self.mdp.V[prev_si])

        # 1. Generate new calls
        self.mdp.generate_calls()

        # 2. Consult policy for action
        action_idx = int(self.mdp.policy[prev_si])
        deltas = self.mdp._action_deltas[action_idx]

        # 3. Move elevators
        for e in range(self.mdp.num_elevators):
            new_floor = max(0, min(self.mdp.num_floors - 1, self.positions[e] + deltas[e]))
            self.destinations[e] = new_floor if new_floor != self.positions[e] else None
            self.positions[e] = new_floor

        # 4. Serve calls with Load-Balancing Bypass check
        # Elevators exceeding 85% capacity enter BYPASS: they do not accept new hall calls
        active_cabs = []
        for e in range(self.mdp.num_elevators):
            load_ratio = self.passenger_counts[e] / max(1, self.mdp.capacity)
            if load_ratio < 0.85:
                active_cabs.append(self.positions[e])

        # Serve calls only with non-bypassed elevators
        served = self.mdp.serve_calls(tuple(active_cabs) if active_cabs else tuple(self.positions))
        self.total_served += served

        # Update passenger counts dynamically based on served calls and drop-offs
        for e in range(self.mdp.num_elevators):
            # Simulated passenger drop-off at destination floor
            if random.random() < 0.35 and self.passenger_counts[e] > 0:
                self.passenger_counts[e] = max(0, self.passenger_counts[e] - random.randint(1, 3))
            # Pick up new passengers if this elevator served a call
            if self.positions[e] in active_cabs and served > 0 and self.passenger_counts[e] < self.mdp.capacity:
                self.passenger_counts[e] = min(self.mdp.capacity, self.passenger_counts[e] + random.randint(1, 2))

        # 5. Reward for this tick
        reward = self.mdp.reward(prev_state, action_idx)
        self.total_energy += sum(abs(d) for d in deltas) * 0.2

        # 6. New state
        new_state = self._current_state_tuple()
        new_si = self.mdp.state_index.get(new_state, 0)
        v_after = float(self.mdp.V[new_si])

        # 7. Log decision
        if len(self.audit_log) < self.max_log_size:
            rec = DecisionRecord(
                id=f"D{self.tick:05d}",
                tick=self.tick,
                time_str=datetime.now().strftime("%H:%M:%S.%f")[:-3],
                state=", ".join(f"E{i+1}:F{self.positions[i]:02d}" for i in range(self.mdp.num_elevators)),
                action=self._describe_action(deltas),
                reward=round(reward, 3),
                value=round(v_after, 3),
                next_state=", ".join(f"E{i+1}:F{self.positions[i]:02d}" for i in range(self.mdp.num_elevators)),
                policy_update=f"V(s) {'+' if v_after >= v_before else ''}{round(v_after - v_before, 3)}"
            )
            self.audit_log.append(rec)

        # 8. Build elevator states with Weight / Load Balancing Sensor Telemetry
        elevator_states = []
        for e in range(self.mdp.num_elevators):
            pax = self.passenger_counts[e]
            cap = self.mdp.capacity
            load_pct = min(100.0, round((pax / max(1, cap)) * 100.0, 1))
            is_bypass = load_pct >= 85.0
            elevator_states.append({
                "id": e + 1,
                "floor": self.positions[e],
                "direction": self._direction(e, self.destinations[e]),
                "passengers": pax,
                "capacity": cap,
                "load_kg": round(pax * 75.0, 1),
                "max_load_kg": round(cap * 75.0, 1),
                "load_pct": load_pct,
                "is_bypass": is_bypass,
                "destination": self.destinations[e],
            })

        # 9. Assemble state dict
        return {
            "tick": self.tick,
            "elevators": elevator_states,
            "pending_calls": [{"floor": f, "direction": d} for f, d in self.mdp._calls],
            "metrics": {
                "total_served": self.total_served,
                "avg_wait_ticks": round(self.total_wait_ticks / max(1, self.tick), 2),
                "total_energy_j": round(self.total_energy, 2),
                "current_reward": round(reward, 3),
                "value_function": round(v_after, 3),
                "pending_calls": len(self.mdp._calls),
                "policy_trust": min(99.9, 80.0 + self.total_served * 0.1),
            },
            "last_decision": {
                "state": prev_state,
                "action_idx": action_idx,
                "action_desc": self._describe_action(deltas),
                "reward": round(reward, 3),
                "value_before": round(v_before, 3),
                "value_after": round(v_after, 3),
            }
        }

    def _describe_action(self, deltas) -> str:
        parts = []
        for e, d in enumerate(deltas):
            if d > 0:
                parts.append(f"E{e+1}↑F{self.positions[e]}")
            elif d < 0:
                parts.append(f"E{e+1}↓F{self.positions[e]}")
        return ", ".join(parts) if parts else "All Idle"

    # ── Async generator for WebSocket streaming ──────────────────────────────

    async def stream(self) -> AsyncGenerator[Dict, None]:
        """Async generator: yields one tick dict at a time."""
        self.running = True
        while self.running:
            if not self.paused:
                state_dict = self.step()
                yield state_dict
            await asyncio.sleep(self.tick_interval_s)

    def pause(self):  self.paused = True
    def resume(self): self.paused = False
    def stop(self):   self.running = False

    def reset(self):
        self.tick = 0
        self.positions = [0] * self.mdp.num_elevators
        self.passengers = [0] * self.mdp.num_elevators
        self.passenger_counts = [random.randint(1, 3) for _ in range(self.mdp.num_elevators)]
        self.destinations = [None] * self.mdp.num_elevators
        self.total_served = 0
        self.total_wait_ticks = 0.0
        self.total_energy = 0.0
        self.audit_log.clear()
        self.mdp._calls.clear()

    def simulate_surge(self, elv_id: Optional[int] = None):
        """Forces elevator(s) to >=85% capacity to trigger Load-Balancing Bypass."""
        surge_count = max(1, int(self.mdp.capacity * 0.92))
        if elv_id is not None and 0 <= elv_id < self.mdp.num_elevators:
            self.passenger_counts[elv_id] = surge_count
        else:
            # Overload first 2 cars
            for i in range(min(2, self.mdp.num_elevators)):
                self.passenger_counts[i] = surge_count
