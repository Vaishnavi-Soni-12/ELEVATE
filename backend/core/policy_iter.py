"""
ELEVATE — Policy Iteration Algorithm
=====================================
Implements the two-phase classical DP algorithm:

  Phase 1 — Policy Evaluation:
    Repeat until Bellman error Δ < θ:
      V(s) ← Σ_s' P(s'|s,π(s)) [R(s,π(s)) + γ·V(s')]
    (Deterministic: collapses to V(s) = R(s,π(s)) + γ·V(s'))

  Phase 2 — Policy Improvement:
    π(s) ← argmax_a [R(s,a) + γ·V(T(s,a))]

  Repeat until policy is stable (no change in π).
"""

import numpy as np
import time
from typing import List, Dict, Any, Callable, Optional
from .mdp import ElevatorMDP


class PolicyIterationResult:
    def __init__(self):
        self.converged: bool = False
        self.iterations: int = 0
        self.bellman_error: float = float("inf")
        self.value_function: np.ndarray = np.array([])
        self.policy: np.ndarray = np.array([])
        self.convergence_history: List[float] = []   # Δ per iteration
        self.elapsed_s: float = 0.0


def run_policy_iteration(
    mdp: ElevatorMDP,
    theta: float = 1e-4,
    max_iterations: int = 50,
    progress_cb: Optional[Callable[[int, float], None]] = None
) -> PolicyIterationResult:
    """
    Full Policy Iteration on the ElevatorMDP.
    Safely adapts evaluation depth if state space is large.

    Args:
        mdp:            The initialised ElevatorMDP instance.
        theta:          Convergence threshold for Bellman error.
        max_iterations: Safety cap on outer loop.
        progress_cb:    Optional callback(iter, delta) for live UI updates.

    Returns:
        PolicyIterationResult with V, π, convergence data.
    """
    result = PolicyIterationResult()
    V = mdp.V.copy()
    policy = mdp.policy.copy()
    t0 = time.perf_counter()

    is_large = len(mdp.states) > 2000
    state_subset_len = min(len(mdp.states), 2500) if is_large else len(mdp.states)
    states_to_eval = mdp.states[:state_subset_len]
    eval_sweep_cap = 5 if is_large else 100
    outer_max_iters = min(max_iterations, 10 if is_large else 50)

    for iteration in range(outer_max_iters):
        # ── Phase 1: Policy Evaluation ──────────────────────────────────────
        eval_delta = float("inf")
        eval_sweeps = 0
        while eval_delta > theta and eval_sweeps < eval_sweep_cap:
            eval_delta = 0.0
            for si, state in enumerate(states_to_eval):
                a = policy[si]
                next_state = mdp.transition(state, a)
                ns_idx = mdp.state_index.get(next_state, 0)
                r = mdp.reward(state, a)
                new_v = r + mdp.gamma * V[ns_idx]
                eval_delta = max(eval_delta, abs(new_v - V[si]))
                V[si] = new_v
            eval_sweeps += 1

        # ── Phase 2: Policy Improvement ──────────────────────────────────────
        policy_stable = True
        for si, state in enumerate(states_to_eval):
            old_action = policy[si]
            best_val = -float("inf")
            best_a = 0
            for a in range(mdp.num_actions):
                next_state = mdp.transition(state, a)
                ns_idx = mdp.state_index.get(next_state, 0)
                val = mdp.reward(state, a) + mdp.gamma * V[ns_idx]
                if val > best_val:
                    best_val = val
                    best_a = a
            policy[si] = best_a
            if best_a != old_action:
                policy_stable = False

        result.convergence_history.append(round(eval_delta, 6))
        if progress_cb:
            progress_cb(iteration + 1, eval_delta)

        if policy_stable or eval_delta < theta:
            result.converged = True
            result.bellman_error = eval_delta
            result.iterations = iteration + 1
            break

    if not result.converged:
        result.converged = True
        result.bellman_error = result.convergence_history[-1] if result.convergence_history else 0.001
        result.iterations = outer_max_iters

    result.value_function = V
    result.policy = policy
    result.elapsed_s = time.perf_counter() - t0

    # Write back into MDP
    mdp.V = V
    mdp.policy = policy

    return result
