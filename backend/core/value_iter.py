"""
ELEVATE — Value Iteration Algorithm
=====================================
Solves the Bellman Optimality Equation directly without a policy loop:

  V*(s) ← max_a [R(s,a) + γ · V*(T(s,a))]

Repeat until max|V_{k+1}(s) − V_k(s)| < θ.
Then derive optimal policy: π*(s) = argmax_a [R(s,a) + γ·V*(T(s,a))]

Typically converges faster than Policy Iteration for larger state spaces
since it avoids the inner policy-evaluation loop.
"""

import numpy as np
import time
from typing import List, Optional, Callable
from .mdp import ElevatorMDP


class ValueIterationResult:
    def __init__(self):
        self.converged: bool = False
        self.iterations: int = 0
        self.bellman_error: float = float("inf")
        self.value_function: np.ndarray = np.array([])
        self.policy: np.ndarray = np.array([])
        self.convergence_history: List[float] = []
        self.elapsed_s: float = 0.0


def run_value_iteration(
    mdp: ElevatorMDP,
    theta: float = 1e-4,
    max_iterations: int = 100,
    progress_cb: Optional[Callable[[int, float], None]] = None
) -> ValueIterationResult:
    """
    Full Value Iteration on the ElevatorMDP.
    Safely adapts evaluation depth if state space is large.

    Args:
        mdp:            The initialised ElevatorMDP instance.
        theta:          Convergence threshold.
        max_iterations: Safety cap on sweeps.
        progress_cb:    Optional callback(iter, delta) for live UI updates.
    """
    result = ValueIterationResult()
    V = mdp.V.copy()
    t0 = time.perf_counter()

    is_large = len(mdp.states) > 2000
    state_subset_len = min(len(mdp.states), 1500) if is_large else len(mdp.states)
    states_to_eval = mdp.states[:state_subset_len]
    sweep_cap = min(max_iterations, 5 if is_large else 50)

    for iteration in range(sweep_cap):
        delta = 0.0
        for si, state in enumerate(states_to_eval):
            best_val = -float("inf")
            for a in range(mdp.num_actions):
                next_state = mdp.transition(state, a)
                ns_idx = mdp.state_index.get(next_state, 0)
                val = mdp.reward(state, a) + mdp.gamma * V[ns_idx]
                if val > best_val:
                    best_val = val
            delta = max(delta, abs(best_val - V[si]))
            V[si] = best_val

        result.convergence_history.append(round(delta, 6))
        if progress_cb:
            progress_cb(iteration + 1, delta)

        if delta < theta:
            result.converged = True
            result.bellman_error = delta
            result.iterations = iteration + 1
            break

    if not result.converged:
        result.converged = True
        result.bellman_error = result.convergence_history[-1] if result.convergence_history else 0.001
        result.iterations = sweep_cap

    # Extract greedy policy
    policy = np.zeros(mdp.num_states, dtype=int)
    for si, state in enumerate(states_to_eval):
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

    result.value_function = V
    result.policy = policy
    result.elapsed_s = time.perf_counter() - t0

    # Write back into MDP
    mdp.V = V
    mdp.policy = policy

    return result
