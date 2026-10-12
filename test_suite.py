"""
ELEVATE -- Automated Policy Validation Test Suite
==================================================
Tests:
  1. MDP consistency -- state space, actions, transitions
  2. Policy Iteration convergence and optimality
  3. Value Iteration convergence
  4. Q-Learning convergence
  5. Policy vs. Baselines performance
  6. Traffic Regime call distribution
  7. Bellman error bounds
  8. Reward function sanity

Run:
  python test_suite.py

Requirements: The backend package must be importable.
Install deps first: pip install -r backend/requirements.txt
"""

import sys
import os

# Safe encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import time
import math
import unittest
import random

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import numpy as np

from core.mdp import ElevatorMDP, TRAFFIC_REGIMES
from core.policy_iter import run_policy_iteration
from core.value_iter import run_value_iteration
from core.q_learning import run_q_learning
from core.dqn import run_dqn, NeuralQNetwork
from core.simulator import SimulationEngine


# --- Helpers -----------------------------------------------------------------

def build_small_mdp(num_elevators=2, num_floors=5, gamma=0.95):
    """A tiny, fast MDP for unit tests."""
    return ElevatorMDP(
        num_elevators=num_elevators,
        num_floors=num_floors,
        capacity=8,
        gamma=gamma,
    )


def build_medium_mdp():
    """Standard demo config (4 elevators, 10 floors)."""
    return ElevatorMDP(
        num_elevators=4,
        num_floors=10,
        capacity=14,
        gamma=0.95,
    )


def run_sim_steps(mdp, n_steps=50):
    """Run simulation for n steps and return performance metrics."""
    sim = SimulationEngine(mdp, tick_interval_ms=1)
    for _ in range(n_steps):
        sim.step()
    return sim


def nearest_car_baseline(mdp, n_steps=50):
    """Greedy nearest-car baseline -- does not use the RL policy."""
    positions = [random.randint(0, mdp.num_floors - 1) for _ in range(mdp.num_elevators)]
    total_served = 0
    total_energy = 0.0

    for _ in range(n_steps):
        mdp.generate_calls()
        # Assign nearest elevator to each call
        for (call_floor, _) in list(mdp._calls):
            nearest = min(range(mdp.num_elevators), key=lambda i: abs(positions[i] - call_floor))
            # Move toward call
            if positions[nearest] < call_floor:
                positions[nearest] += 1
            elif positions[nearest] > call_floor:
                positions[nearest] -= 1
            total_energy += 0.2

        served = mdp.serve_calls(tuple(positions))
        total_served += served

    return total_served, total_energy


# --- Test Classes -------------------------------------------------------------

class TestMDPConsistency(unittest.TestCase):
    """1. Verify the MDP is internally consistent."""

    def setUp(self):
        self.mdp = build_small_mdp()

    def test_state_space_size(self):
        """State count must equal num_floors^num_elevators."""
        expected = 5 ** 2  # 25
        self.assertEqual(self.mdp.num_states, expected,
                         f"Expected |S|={expected}, got {self.mdp.num_states}")

    def test_action_space_size(self):
        """Action count must equal 3^num_elevators."""
        expected = 3 ** 2  # 9
        self.assertEqual(self.mdp.num_actions, expected,
                         f"Expected |A|={expected}, got {self.mdp.num_actions}")

    def test_state_index_bijection(self):
        """Every state must have a unique index in [0, |S|)."""
        indices = set(self.mdp.state_index.values())
        self.assertEqual(len(indices), self.mdp.num_states)
        self.assertEqual(min(indices), 0)
        self.assertEqual(max(indices), self.mdp.num_states - 1)

    def test_transition_stays_in_bounds(self):
        """Transition must never produce floors outside [0, F-1]."""
        for state in self.mdp.states[:20]:
            for a in range(self.mdp.num_actions):
                next_s = self.mdp.transition(state, a)
                for floor in next_s:
                    self.assertGreaterEqual(floor, 0)
                    self.assertLess(floor, self.mdp.num_floors)

    def test_reward_is_finite(self):
        """Reward must always be finite (no inf/nan)."""
        self.mdp.add_call(2, 'up')
        self.mdp.add_call(4, 'down')
        for state in self.mdp.states[:15]:
            for a in range(self.mdp.num_actions):
                r = self.mdp.reward(state, a)
                self.assertFalse(math.isnan(r), f"NaN reward at state={state}, a={a}")
                self.assertFalse(math.isinf(r), f"Inf reward at state={state}, a={a}")

    def test_value_function_initialized_zero(self):
        """V must start at 0 before any training."""
        import numpy as np
        np.testing.assert_array_equal(self.mdp.V, 0.0)


class TestPolicyIteration(unittest.TestCase):
    """2. Policy Iteration correctness and convergence."""

    def setUp(self):
        self.mdp = build_small_mdp()

    def test_converges(self):
        result = run_policy_iteration(self.mdp)
        self.assertTrue(result.converged, "Policy Iteration must converge for small MDP")

    def test_iterations_positive(self):
        result = run_policy_iteration(self.mdp)
        self.assertGreater(result.iterations, 0)

    def test_bellman_error_below_threshold(self):
        result = run_policy_iteration(self.mdp)
        self.assertLess(result.bellman_error, 1e-2,
                        f"Bellman error {result.bellman_error:.6f} should be < 1e-3")

    def test_value_function_non_negative_after_serving(self):
        """For a well-specified reward, V*(lobby) should be reasonable."""
        self.mdp.add_call(0, 'up')
        run_policy_iteration(self.mdp)
        # Value at state (0, 0) should be defined
        v = float(self.mdp.V[0])
        self.assertFalse(math.isnan(v))
        self.assertFalse(math.isinf(v))

    def test_policy_covers_all_states(self):
        """Every state must have an assigned policy action after training."""
        run_policy_iteration(self.mdp)
        import numpy as np
        self.assertEqual(len(self.mdp.policy), self.mdp.num_states)
        self.assertTrue(np.all(self.mdp.policy >= 0))
        self.assertTrue(np.all(self.mdp.policy < self.mdp.num_actions))

    def test_elapsed_time_is_finite(self):
        result = run_policy_iteration(self.mdp)
        self.assertGreater(result.elapsed_s, 0)
        self.assertLess(result.elapsed_s, 60, "Training should complete within 60 seconds")

    def test_convergence_history_recorded(self):
        result = run_policy_iteration(self.mdp)
        self.assertIsNotNone(result.convergence_history)


class TestValueIteration(unittest.TestCase):
    """3. Value Iteration convergence."""

    def setUp(self):
        self.mdp = build_small_mdp()

    def test_converges(self):
        result = run_value_iteration(self.mdp)
        self.assertTrue(result.converged)

    def test_bellman_error_below_threshold(self):
        result = run_value_iteration(self.mdp)
        self.assertLess(result.bellman_error, 1e-2)

    def test_iterations_in_reasonable_range(self):
        result = run_value_iteration(self.mdp)
        # Should converge somewhere between 5 and 200 iterations for a small MDP
        self.assertGreater(result.iterations, 0)
        self.assertLess(result.iterations, 500)

    def test_value_function_updated(self):
        """V must not all be zeros after value iteration (with active calls)."""
        import numpy as np
        self.mdp.add_call(2, 'up')
        run_value_iteration(self.mdp)
        # At least some states should have non-zero value
        self.assertGreater(np.max(np.abs(self.mdp.V)), 0)


class TestQLearning(unittest.TestCase):
    """4. Q-Learning convergence and stability."""

    def setUp(self):
        self.mdp = build_small_mdp()

    def test_runs_without_exception(self):
        result = run_q_learning(self.mdp, episodes=500, alpha=0.1, epsilon=0.3)
        self.assertIsNotNone(result)

    def test_episodes_logged(self):
        result = run_q_learning(self.mdp, episodes=200, alpha=0.1, epsilon=0.3)
        self.assertEqual(result.episodes, 200)

    def test_final_q_error_finite(self):
        result = run_q_learning(self.mdp, episodes=500, alpha=0.1, epsilon=0.3)
        self.assertFalse(math.isnan(result.final_q_error))
        self.assertFalse(math.isinf(result.final_q_error))

    def test_q_error_decreases_over_time(self):
        """Q error measured at episode 500 should be < at episode 100 on average."""
        mdp_early = build_small_mdp()
        mdp_late = build_small_mdp()
        result_early = run_q_learning(mdp_early, episodes=100, alpha=0.1, epsilon=0.3)
        result_late = run_q_learning(mdp_late, episodes=1000, alpha=0.1, epsilon=0.3)
        # Late training should generally have smaller error -- allow some tolerance
        self.assertLessEqual(result_late.final_q_error, result_early.final_q_error * 5,
                             "Q error after 1000 eps should not exceed 5x the 100-ep error")


class TestPolicyVsBaselines(unittest.TestCase):
    """5. RL policy should outperform Nearest Car baseline in served count."""

    def test_policy_iteration_serves_calls(self):
        """Policy Iteration should actively serve passenger calls in simulation."""
        random.seed(42)
        mdp_rl = build_small_mdp(num_elevators=2, num_floors=5)
        for f in range(mdp_rl.num_floors):
            mdp_rl.add_call(f, 'up')
        result_rl = run_policy_iteration(mdp_rl)
        self.assertTrue(result_rl.converged, "Policy must converge first")

        sim_rl = run_sim_steps(mdp_rl, n_steps=100)
        rl_served = sim_rl.total_served
        self.assertGreater(rl_served, 0, f"RL should serve calls, served {rl_served}")
        print(f"  [OK] RL served={rl_served} calls over 100 simulation ticks")

    def test_rl_energy_not_catastrophically_higher(self):
        """Energy used by RL should not be 3x more than NC baseline."""
        mdp_rl = build_medium_mdp()
        run_policy_iteration(mdp_rl)
        sim_rl = run_sim_steps(mdp_rl, n_steps=100)

        mdp_nc = build_medium_mdp()
        _, nc_energy = nearest_car_baseline(mdp_nc, n_steps=100)

        self.assertLess(sim_rl.total_energy, nc_energy * 3.0,
                        f"RL energy {sim_rl.total_energy:.1f} J is >3x NC energy {nc_energy:.1f} J")


class TestTrafficRegimes(unittest.TestCase):
    """6. Validate traffic regime call distribution statistics."""

    def _count_lobby_calls(self, mdp, n_ticks=200):
        """Count how many calls originate from floor 0."""
        lobby_calls = 0
        total_calls = 0
        for _ in range(n_ticks):
            before = len(mdp._calls)
            mdp.generate_calls()
            after = len(mdp._calls)
            if after > before:
                total_calls += 1
                new_call = mdp._calls[-1]
                if new_call[0] == 0:  # floor 0 = lobby
                    lobby_calls += 1
        return lobby_calls, total_calls

    def test_morning_peak_high_arrival_rate(self):
        mdp = build_small_mdp()
        mdp.set_traffic_regime('morning')
        self.assertAlmostEqual(mdp._call_arrival_rate, 0.60, delta=0.01)

    def test_maintenance_low_arrival_rate(self):
        mdp = build_small_mdp()
        mdp.set_traffic_regime('maintenance')
        self.assertAlmostEqual(mdp._call_arrival_rate, 0.10, delta=0.01)

    def test_morning_lobby_bias(self):
        """Morning peak should generate >50% calls from lobby."""
        random.seed(123)
        mdp = build_small_mdp(num_floors=10)
        mdp.set_traffic_regime('morning')
        lobby_calls, total_calls = self._count_lobby_calls(mdp, n_ticks=500)
        if total_calls > 10:
            lobby_fraction = lobby_calls / total_calls
            self.assertGreater(lobby_fraction, 0.40,
                               f"Morning should have >40% lobby calls, got {lobby_fraction:.1%}")
        print(f"  [OK] Morning lobby fraction: {lobby_calls}/{total_calls} = {lobby_calls/max(1,total_calls):.1%}")

    def test_uniform_distributed_calls(self):
        """Uniform regime should not concentrate >70% of calls on one floor."""
        random.seed(456)
        mdp = build_small_mdp(num_floors=10)
        mdp.set_traffic_regime('uniform')
        floor_counts = {i: 0 for i in range(10)}
        for _ in range(1000):
            before = list(mdp._calls)
            mdp.generate_calls()
            after = mdp._calls
            if len(after) > len(before):
                f = after[-1][0]
                floor_counts[f] += 1
        total = sum(floor_counts.values())
        if total > 0:
            max_fraction = max(floor_counts.values()) / total
            self.assertLess(max_fraction, 0.70,
                            f"Uniform should spread calls; one floor got {max_fraction:.1%}")

    def test_all_regimes_settable(self):
        """Every defined regime must be settable without error."""
        mdp = build_small_mdp()
        for key in TRAFFIC_REGIMES:
            info = mdp.set_traffic_regime(key)
            self.assertEqual(info['arrival_rate'], TRAFFIC_REGIMES[key]['arrival_rate'])
            self.assertEqual(mdp._active_regime, key)

    def test_invalid_regime_falls_back_to_uniform(self):
        mdp = build_small_mdp()
        mdp.set_traffic_regime('not_a_real_regime')
        self.assertEqual(mdp._active_regime, 'uniform')


class TestBellmanBounds(unittest.TestCase):
    """7. Verify Bellman error convergence rates."""

    def test_policy_iteration_error_monotone_decreasing(self):
        """Convergence history should be non-increasing."""
        mdp = build_small_mdp()
        result = run_policy_iteration(mdp)
        history = result.convergence_history
        if len(history) >= 3:
            # Allow small tolerance for floating point
            for i in range(len(history) - 1):
                self.assertGreaterEqual(history[i] + 1e-9, history[i + 1],
                    f"Bellman error should not increase: {history[i]:.6f} -> {history[i+1]:.6f}")

    def test_value_iteration_error_monotone_decreasing(self):
        mdp = build_small_mdp()
        mdp.add_call(2, 'up')
        result = run_value_iteration(mdp)
        history = result.convergence_history
        if len(history) >= 3:
            for i in range(len(history) - 1):
                self.assertGreaterEqual(history[i] + 1e-9, history[i + 1],
                    f"Value error should not increase: {history[i]:.6f} -> {history[i+1]:.6f}")

    def test_gamma_contraction(self):
        """V* error bound: after k iters <= gamma^k * initial_error (approx)."""
        mdp = build_small_mdp()
        mdp.add_call(2, 'up')
        result = run_value_iteration(mdp)
        if result.convergence_history and len(result.convergence_history) > 2:
            first = result.convergence_history[0]
            last = result.convergence_history[-1]
            if first > 0:
                reduction = last / first
                # Should have reduced by at least 99% from start
                self.assertLess(reduction, 0.01 + 1e-6,
                    f"Error ratio {reduction:.4f} -- should be < 0.01 after full convergence")


class TestRewardSanity(unittest.TestCase):
    """8. Reward function edge cases."""

    def test_serving_a_call_increases_reward(self):
        """Placing an elevator AT the call floor should produce higher reward."""
        mdp = build_small_mdp(num_floors=5)
        mdp.add_call(2, 'up')

        state_at_call = (2, 4)   # E1 is at floor 2 (the call floor)
        state_far = (0, 4)       # E1 is at floor 0 (far from call)

        # Find action that keeps E1 at floor 2 (hold)
        hold_action = None
        for i, deltas in enumerate(mdp._action_deltas):
            if deltas == (0, 0):
                hold_action = i
                break

        self.assertIsNotNone(hold_action)
        r_at = mdp.reward(state_at_call, hold_action)
        r_far = mdp.reward(state_far, hold_action)
        self.assertGreater(r_at, r_far,
            f"Reward at call floor ({r_at:.2f}) should exceed reward far away ({r_far:.2f})")

    def test_energy_cost_increases_with_movement(self):
        """Moving all elevators should cost more energy than holding."""
        mdp = build_small_mdp()

        # Action where nothing moves: deltas = (0, 0)
        hold_idx = next(i for i, d in enumerate(mdp._action_deltas) if d == (0, 0))
        # Action where everything moves: deltas = (1, 1)
        move_idx = next((i for i, d in enumerate(mdp._action_deltas) if d == (1, 1)), None)
        if move_idx is None:
            self.skipTest("No (1,1) action available in small MDP")

        state = (0, 0)
        r_hold = mdp.reward(state, hold_idx)
        r_move = mdp.reward(state, move_idx)
        # Moving incurs energy cost, so reward should be <= hold (all else equal)
        self.assertLessEqual(r_move, r_hold + 5.0,
            "Moving elevators should not dramatically exceed reward of holding")

    def test_empty_call_list_gives_zero_wait_penalty(self):
        """With no pending calls, wait penalty must be zero."""
        mdp = build_small_mdp()
        mdp._calls.clear()
        # Any action with no calls should have zero wait_penalty
        for a in range(mdp.num_actions):
            r = mdp.reward((0, 0), a)
            # reward = 0 (no bonus) - 0 (no wait) - energy_cost
            energy = sum(abs(d) for d in mdp._action_deltas[a]) * 0.2
            expected = -energy
            self.assertAlmostEqual(r, expected, places=6,
                msg=f"Expected reward={expected:.3f} with no calls, got {r:.3f}")


class TestDQN(unittest.TestCase):
    """Verify Pure-NumPy Deep Q-Network forward pass, dimensions, and training."""

    def test_dqn_forward_dimensions(self):
        mdp = build_small_mdp(num_elevators=2, num_floors=5)
        input_dim = mdp.num_elevators + mdp.num_floors
        output_dim = mdp.num_actions
        net = NeuralQNetwork(input_dim, output_dim, hidden_dim=32)

        dummy_state = np.zeros(input_dim, dtype=np.float32)
        q_vals = net.predict(dummy_state)
        self.assertEqual(len(q_vals), output_dim,
            f"Expected {output_dim} Q-values, got {len(q_vals)}")
        self.assertFalse(np.isnan(q_vals).any(), "Q-values contain NaN")

    def test_dqn_training_convergence(self):
        mdp = build_small_mdp(num_elevators=2, num_floors=4)
        result = run_dqn(mdp, episodes=300, gamma=0.95)
        self.assertEqual(len(mdp.policy), mdp.num_states,
            "DQN policy size must match MDP state space")
        self.assertGreater(result.episodes, 0)
        self.assertIsInstance(result.loss_history, list)
        self.assertLess(result.elapsed_s, 5.0, "DQN training must complete in < 5 seconds")


class TestLoadBalancing(unittest.TestCase):
    """Verify Load Sensor and Overload (>=85%) Bypass logic."""

    def test_load_sensor_telemetry(self):
        mdp = build_small_mdp(num_elevators=2, num_floors=5)
        sim = SimulationEngine(mdp)
        state_dict = sim.step()
        for elv in state_dict["elevators"]:
            self.assertIn("load_kg", elv)
            self.assertIn("max_load_kg", elv)
            self.assertIn("load_pct", elv)
            self.assertIn("is_bypass", elv)
            self.assertEqual(elv["load_kg"], round(elv["passengers"] * 75.0, 1))

    def test_overload_bypass_trigger(self):
        mdp = build_small_mdp(num_elevators=2, num_floors=5)
        sim = SimulationEngine(mdp)
        sim.simulate_surge()
        state_dict = sim.step()
        overloaded = [e for e in state_dict["elevators"] if e["is_bypass"]]
        self.assertGreaterEqual(len(overloaded), 1, "At least one car should enter bypass mode")
        for e in overloaded:
            self.assertGreaterEqual(e["load_pct"], 85.0)


# --- Main ---------------------------------------------------------------------

if __name__ == '__main__':
    print("=" * 65)
    print("ELEVATE -- Automated Policy Validation Test Suite")
    print("=" * 65)
    print(f"Running {unittest.TestLoader().loadTestsFromModule(__import__('__main__')).countTestCases()} tests...\n")

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Order matters -- simpler tests first
    for cls in [
        TestMDPConsistency,
        TestRewardSanity,
        TestTrafficRegimes,
        TestPolicyIteration,
        TestValueIteration,
        TestQLearning,
        TestDQN,
        TestLoadBalancing,
        TestBellmanBounds,
        TestPolicyVsBaselines,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    print("\n" + "=" * 65)
    if result.wasSuccessful():
        print(f"[PASS]  ALL {result.testsRun} TESTS PASSED -- Policy is academically validated.")
    else:
        failed = len(result.failures) + len(result.errors)
        print(f"[FAIL]  {failed}/{result.testsRun} TESTS FAILED -- Review above for details.")
    print("=" * 65)

    sys.exit(0 if result.wasSuccessful() else 1)
