"""
ELEVATE — Pydantic API Schemas
Request and Response models for all REST + WebSocket endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal


# ─── Requests ─────────────────────────────────────────────────────────────────

class ConfigureRequest(BaseModel):
    num_elevators: int = Field(4, ge=1, le=10)
    num_floors:    int = Field(20, ge=2, le=50)
    capacity:      int = Field(8,  ge=1, le=20)
    gamma:         float = Field(0.95, ge=0.5, le=0.999)
    algorithm:     Literal["auto", "policy_iteration", "value_iteration", "q_learning", "dqn"] = "auto"
    q_episodes:    int = Field(5000, ge=100, le=50000)
    q_alpha:       float = Field(0.1, ge=0.01, le=1.0)
    q_epsilon:     float = Field(0.1, ge=0.01, le=1.0)
    sim_tick_ms:   int = Field(400, ge=100, le=2000)

class SimControlRequest(BaseModel):
    action: Literal["start", "pause", "resume", "stop", "reset", "surge"]

class ExperimentRequest(BaseModel):
    algorithms: List[Literal["policy_iteration", "value_iteration", "q_learning", "dqn",
                              "nearest_car", "fcfs"]] = ["policy_iteration", "value_iteration",
                                                          "nearest_car", "fcfs"]
    num_elevators: int = Field(4, ge=1, le=8)
    num_floors:    int = Field(20, ge=2, le=30)
    gamma:         float = Field(0.95, ge=0.5, le=0.999)
    q_episodes:    int = Field(2000, ge=100, le=10000)


# ─── Responses ────────────────────────────────────────────────────────────────

class ElevatorInfo(BaseModel):
    id: int
    floor: int
    direction: str
    passengers: int
    destination: Optional[int]
    capacity: Optional[int] = 8
    load_kg: Optional[float] = 0.0
    max_load_kg: Optional[float] = 600.0
    load_pct: Optional[float] = 0.0
    is_bypass: Optional[bool] = False

class PendingCall(BaseModel):
    floor: int
    direction: str

class SystemMetrics(BaseModel):
    total_served: int
    avg_wait_ticks: float
    total_energy_j: float
    current_reward: float
    value_function: float
    pending_calls: int
    policy_trust: float

class LabStateResponse(BaseModel):
    tick: int
    algorithm_used: str
    elevators: List[ElevatorInfo]
    pending_calls: List[PendingCall]
    metrics: SystemMetrics
    policy_converged: bool
    convergence_iters: int
    bellman_error: float

class PolicyResponse(BaseModel):
    algorithm: str
    converged: bool
    iterations: int
    bellman_error: float
    elapsed_s: float
    convergence_history: List[float]
    recommendation: str   # Human-readable summary

class DecisionAuditRecord(BaseModel):
    id: str
    tick: int
    time_str: str
    state: str
    action: str
    reward: float
    value: float
    next_state: str
    policy_update: str
    algorithm: str

class AuditResponse(BaseModel):
    total_decisions: int
    records: List[DecisionAuditRecord]

class BenchmarkEntry(BaseModel):
    algorithm: str
    avg_wait_s: float
    avg_travel_s: float
    energy_j: float
    served_pct: float
    convergence_iters: Optional[int]
    elapsed_s: float

class ExperimentResponse(BaseModel):
    results: List[BenchmarkEntry]
    winner: str
    recommendation: str

class ConfigResponse(BaseModel):
    num_elevators: int
    num_floors: int
    capacity: int
    gamma: float
    algorithm_selected: str   # resolved (not "auto")
    q_episodes: int
    sim_tick_ms: int
    state_space_size: int
