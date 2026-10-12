"""
ELEVATE Backend — Configuration
All building / MDP parameters live here; updated at runtime via /api/configure.
"""
from pydantic import BaseModel, Field
from typing import Literal

# ─── Algorithm auto-selection thresholds ──────────────────────────────────────
def select_algorithm(num_elevators: int, num_floors: int) -> str:
    """
    Auto-selects the best RL algorithm for the given state-space size.
    - Small state space (<= 1,000 states) -> Policy Iteration (exact DP convergence)
    - Medium state space (<= 8,000 states) -> Value Iteration (fast value sweeps)
    - Large state space (> 8,000 states) -> Q-Learning (model-free sample-based RL)
    Can always be overridden by the user.
    """
    state_space = num_floors ** num_elevators  # rough size estimate
    if state_space <= 1_000:          # small  → Policy Iteration (exact)
        return "policy_iteration"
    elif state_space <= 8_000:        # medium → Value Iteration (sweeps, faster)
        return "value_iteration"
    else:                              # large  → Q-Learning (model-free, scalable)
        return "q_learning"

# ─── Default Building Config ──────────────────────────────────────────────────
class BuildingConfig(BaseModel):
    num_elevators: int = Field(4,  ge=1, le=10,  description="Number of elevator cars")
    num_floors:    int = Field(20, ge=2, le=50,  description="Number of floors in the building")
    capacity:      int = Field(8,  ge=1, le=20,  description="Max passengers per car")
    gamma:         float = Field(0.95, ge=0.5, le=0.999, description="MDP discount factor")
    algorithm:     Literal["auto", "policy_iteration", "value_iteration", "q_learning", "dqn"] = "auto"
    q_episodes:    int = Field(5000, ge=100, le=50000, description="Q-Learning episodes")
    q_alpha:       float = Field(0.1, ge=0.01, le=1.0,  description="Q-Learning learning rate")
    q_epsilon:     float = Field(0.1, ge=0.01, le=1.0,  description="Epsilon for ε-greedy")
    sim_tick_ms:   int = Field(400,  ge=100, le=2000,   description="Simulation tick speed (ms)")

DEFAULT_CONFIG = BuildingConfig()
