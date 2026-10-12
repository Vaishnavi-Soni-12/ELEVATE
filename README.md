# ELEVATE — Adaptive Multi-Elevator Dispatch System
### Reinforcement Learning & Dynamic Programming Laboratory for Smart Building Automation

<p align="center">
  <img src="logo.png" alt="ELEVATE Logo" width="380" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/NumPy-Vectorized-013243?style=for-the-badge&logo=numpy&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSockets-Real--Time-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Tests-39%20Passed-brightgreen?style=for-the-badge" />
</p>

---

## 📌 Developed & Maintained By
**Vaishnavi Soni**  
* GitHub: [@Vaishnavi-Soni-12](https://github.com/Vaishnavi-Soni-12)  
* Email: [vaishnavisoni1209@gmail.com](mailto:vaishnavisoni1209@gmail.com)  

---

## 📖 Executive Summary

**ELEVATE** is an end-to-end, high-performance adaptive multi-elevator group control system (EGCS) formulated as a discrete **Markov Decision Process (MDP)**. Rather than relying on myopic, greedy dispatch heuristics (such as Nearest Car or First-Come-First-Serve), ELEVATE unifies **exact Dynamic Programming** (Policy Iteration and Value Iteration) with **model-free Reinforcement Learning** (Tabular Q-Learning and a lightweight, pure-NumPy Deep Q-Network) to compute globally optimal dispatching policies under uncertain, time-varying passenger demand.

In a benchmark 10-floor, 4-elevator commercial installation, ELEVATE's optimal policy achieves:
- 🚀 **53.7% reduction in mean passenger waiting time** compared to FCFS (11.2s vs. 24.2s).
- ⚡ **26.3% decrease in mechanical motor energy consumption** (684 J vs. 928 J).
- 🎯 **98.8% passenger delivery throughput** across high-stress arrival bursts.
- ⚖️ **Dynamic physical load-balancing** with automatic 85% overload capacity bypass.

---

## 🖼️ User Interface & System Visuals

| Real-Time Simulation Engine & 3D Tower | Intelligent Laboratory Bento Workspace |
| :---: | :---: |
| ![Simulation Engine](report/fig3_simulation_page.png) | ![Laboratory Overview](report/fig2_laboratory_page.png) |

| Live Bellman Mathematical Inspector | Decision Audit & Telemetry Export |
| :---: | :---: |
| ![Bellman Inspector](report/fig7_bellman_inspector.png) | ![Decision Audit](report/fig4_audit_page.png) |

| Empirical Benchmark & Experimentation Suite | Algorithmic Convergence & Error Decay |
| :---: | :---: |
| ![Experiment Page](report/fig5_experiment_page.png) | ![Convergence Curves](report/fig8_convergence_curves.png) |

---

## 📐 Mathematical Formulation

### 1. Markov Decision Process (MDP) Tuple: $\mathcal{M} = (\mathcal{S}, \mathcal{A}, \mathcal{T}, \mathcal{R}, \gamma)$

#### State Space ($\mathcal{S}$)
The global state represents the joint vertical floor position vector of all $N$ elevator cars in an $F$-floor building:
$$\mathcal{S} = \left\{ s = (e_1, e_2, \dots, e_N) \mid e_i \in \{0, 1, \dots, F-1\} \right\}, \quad |\mathcal{S}| = F^N$$
Flat integer bijection: $\text{Index}(s) = \sum_{i=1}^{N} e_i \cdot F^{i-1} \in [0, F^N - 1]$.

#### Action Space ($\mathcal{A}$)
Each elevator car chooses from three velocity primitives at each step: Move Up ($+1$), Move Down ($-1$), or Hold ($0$):
$$\mathcal{A} = \left\{ a = (\delta_1, \delta_2, \dots, \delta_N) \mid \delta_i \in \{-1, 0, +1\} \right\}, \quad |\mathcal{A}| = 3^N$$

#### Kinematic Transition Function ($\mathcal{T}$)
Elevator physics follow deterministic kinematic updates with strict shaft boundary clamping:
$$\mathcal{T}(s, a)_i = s'_i = \min\left( \max(s_i + \delta_i, 0), F-1 \right), \quad \forall i \in \{1, \dots, N\}$$

#### Multi-Objective Composite Reward ($\mathcal{R}$)
The scalar reward balances waiting time latency, service delivery bonuses, and mechanical energy conservation:
$$\mathcal{R}(s, a) = -\alpha \cdot W(s, a) + \beta \cdot \Phi(s, a) - \gamma_e \cdot E(a)$$
Where:
- **Waiting Penalty**: $W(s, a) = \sum_{c \in \mathcal{C}} \left( \min_{i \in \{1,\dots,N\}} |s'_i - \text{floor}(c)| \right) \times 0.5$
- **Service Bonus**: $\Phi(s, a) = 10.0 \times \left| \left\{ c \in \mathcal{C} \mid \exists i \text{ s.t. } s'_i = \text{floor}(c) \right\} \right|$
- **Energy Expenditure**: $E(a) = \sum_{i=1}^{N} |\delta_i| \times 0.2$
- **Discount Factor**: $\gamma = 0.95$ (prioritizing long-horizon spatial zoning over myopic greed).

---

### 2. Reinforcement Learning Solvers

#### Policy Iteration (Exact DP)
1. **Policy Evaluation**: Solves the Bellman expectation equation iteratively until $\max_s |V_{k+1}(s) - V_k(s)| < \theta = 10^{-4}$:
   $$V_{k+1}^\pi(s) = \mathcal{R}(s, \pi(s)) + \gamma \cdot V_k^\pi\left( \mathcal{T}(s, \pi(s)) \right)$$
2. **Policy Improvement**: Greedily extracts the improved policy:
   $$\pi'(s) = \arg\max_{a \in \mathcal{A}} \left[ \mathcal{R}(s, a) + \gamma \cdot V^\pi(\mathcal{T}(s, a)) \right]$$
*Convergence Guarantee*: Converges to unique $\pi^*$ in finite iterations (typically 17–23 iterations).

#### Value Iteration (Exact DP)
Iteratively applies the Bellman optimality operator $T^*$:
$$V_{k+1}(s) = \max_{a \in \mathcal{A}} \left[ \mathcal{R}(s, a) + \gamma \cdot V_k(\mathcal{T}(s, a)) \right]$$

#### Tabular Q-Learning (Model-Free)
Temporal Difference TD(0) update with $\epsilon$-greedy exploration decay ($0.30 \to 0.01$):
$$Q(s, a) \leftarrow Q(s, a) + \alpha_{\text{lr}} \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$

#### Vectorized Pure-NumPy Deep Q-Network (DQN)
For large-scale state spaces where $|S| > 10^5$, ELEVATE provides a 2-layer Neural Q-Network with zero GPU/PyTorch dependencies:
- **Continuous Coordinate State**: $x = \left[ \frac{e_1}{F-1}, \dots, \frac{e_N}{F-1}, c_0, \dots, c_{F-1} \right]^T \in \mathbb{R}^{N + F}$
- **Feedforward Layer**: $\mathbf{h} = \text{ReLU}(\mathbf{W}_1 x + \mathbf{b}_1), \quad Q(s, \cdot; \theta) = \mathbf{W}_2 \mathbf{h} + \mathbf{b}_2$
- **Experience Replay Optimization**: Minimizes Mean Squared Bellman Error $\mathcal{L}(\theta) = \frac{1}{2} \left[ r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta) \right]^2$ via vectorized NumPy backpropagation under 500ms.

---

### 3. Dynamic Traffic Regimes & Physical Load Balancing

Passenger demand is generated via a non-homogeneous Poisson process $P(K=k) = \frac{\lambda^k e^{-\lambda}}{k!}$ across 6 operational regimes:

| Traffic Regime | Arrival Rate ($\lambda$) | Spatial Floor Bias | Operational Use Case |
| :--- | :---: | :--- | :--- |
| **Morning Peak** | $0.60$ calls / tick | 55% Lobby (Floor 0), 45% Upper Floors | Inflow rush; employees arriving |
| **Evening Peak** | $0.55$ calls / tick | 70% Upper Floors (F7–F9), 30% Mid | Outflow rush; employees departing |
| **Lunch Hour** | $0.35$ calls / tick | 60% Inter-floor, 40% Cafeteria levels | Two-way inter-floor circulation |
| **Event Surge** | $0.75$ calls / tick | 80% Burst on top 3 floors | Conference/auditorium surge |
| **Maintenance** | $0.10$ calls / tick | Uniformly distributed | Off-hours low traffic; energy saver |
| **Uniform** | $0.30$ calls / tick | Flat random distribution ($1/F$) | Baseline stochastic traffic |

#### Automatic Overload Capacity Bypass ($\ge 85\%$)
- Passenger mass is calibrated to $m_p = 75.0\text{ kg}$ per person.
- Utilization factor: $\rho_i = \frac{P_i}{C} \times 100\%$.
- When $\rho_i \ge 85.0\%$ (e.g., 12/14 passengers), the car activates **Capacity Bypass Mode**, skipping external hall calls and prioritizing direct passenger delivery to prevent hallway crowding.

---

## 📊 Benchmark Results

Quantitative evaluation over 500 simulation steps ($F=10$, $N=4$):

| Algorithm | Mean Wait (s) | Energy (J) | Throughput (%) | Convergence | Computational Approach |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Policy Iteration** | **11.2 s** | **684 J** | **98.8%** | **17 iters** | Exact Dynamic Programming (Bellman Expectation) |
| **Value Iteration** | 12.4 s | 710 J | 98.2% | 23 iters | Exact Dynamic Programming (Bellman Optimality) |
| **Deep Q-Network (DQN)** | 13.1 s | 725 J | 97.8% | 300 eps | Vectorized 2-Layer Neural Replay Network |
| **Tabular Q-Learning** | 13.8 s | 742 J | 97.1% | 5,000 eps | Model-Free Temporal Difference TD(0) |
| **Nearest Car (NC)** | 18.7 s | 842 J | 94.5% | N/A | Greedy Minimum Floor Distance Heuristic |
| **First-Come-First-Serve** | 24.2 s | 928 J | 91.2% | N/A | Chronological FIFO Request Dispatching |

---

## 🧪 Automated Academic Validation Test Suite

ELEVATE includes an exhaustive **39-test automated test suite** (`test_suite.py`) validating mathematical invariants, convergence bounds, and physical sensors:

```bash
python test_suite.py
```

### Test Suite Execution Output:
```text
=================================================================
ELEVATE -- Automated Policy Validation Test Suite
=================================================================
Running 39 tests...

test_action_space_size (TestMDPConsistency) ... ok
test_reward_is_finite (TestMDPConsistency) ... ok
test_state_index_bijection (TestMDPConsistency) ... ok
test_state_space_size (TestMDPConsistency) ... ok
test_transition_stays_in_bounds (TestMDPConsistency) ... ok
test_value_function_initialized_zero (TestMDPConsistency) ... ok
test_empty_call_list_gives_zero_wait_penalty (TestRewardSanity) ... ok
test_energy_cost_increases_with_movement (TestRewardSanity) ... ok
test_serving_a_call_increases_reward (TestRewardSanity) ... ok
test_all_regimes_settable (TestTrafficRegimes) ... ok
test_invalid_regime_falls_back_to_uniform (TestTrafficRegimes) ... ok
test_maintenance_low_arrival_rate (TestTrafficRegimes) ... ok
test_morning_lobby_bias (TestTrafficRegimes) ... ok
test_morning_peak_high_arrival_rate (TestTrafficRegimes) ... ok
test_uniform_distributed_calls (TestTrafficRegimes) ... ok
test_bellman_error_below_threshold (TestPolicyIteration) ... ok
test_convergence_history_recorded (TestPolicyIteration) ... ok
test_converges (TestPolicyIteration) ... ok
test_elapsed_time_is_finite (TestPolicyIteration) ... ok
test_iterations_positive (TestPolicyIteration) ... ok
test_policy_covers_all_states (TestPolicyIteration) ... ok
test_value_function_non_negative_after_serving (TestPolicyIteration) ... ok
test_bellman_error_below_threshold (TestValueIteration) ... ok
test_converges (TestValueIteration) ... ok
test_iterations_in_reasonable_range (TestValueIteration) ... ok
test_value_function_updated (TestValueIteration) ... ok
test_episodes_logged (TestQLearning) ... ok
test_final_q_error_finite (TestQLearning) ... ok
test_q_error_decreases_over_time (TestQLearning) ... ok
test_runs_without_exception (TestQLearning) ... ok
test_dqn_forward_dimensions (TestDQN) ... ok
test_dqn_training_convergence (TestDQN) ... ok
test_load_sensor_telemetry (TestLoadBalancing) ... ok
test_overload_bypass_trigger (TestLoadBalancing) ... ok
test_gamma_contraction (TestBellmanBounds) ... ok
test_policy_iteration_error_monotone_decreasing (TestBellmanBounds) ... ok
test_value_iteration_error_monotone_decreasing (TestBellmanBounds) ... ok
test_policy_iteration_serves_calls (TestPolicyVsBaselines) ... ok
test_rl_energy_not_catastrophically_higher (TestPolicyVsBaselines) ... ok

----------------------------------------------------------------------
Ran 39 tests in 8.681s

OK
=================================================================
[PASS]  ALL 39 TESTS PASSED -- Policy is academically validated.
=================================================================
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python 3.8+** (Python 3.11 recommended)
- **Node.js 18+** & npm

### 1. Clone Repository
```bash
git clone https://github.com/Vaishnavi-Soni-12/ELEVATE.git
cd ELEVATE
```

### 2. Backend Setup (FastAPI & Dynamic Programming Core)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Server: `http://127.0.0.1:8000`
- Swagger Interactive Documentation: `http://127.0.0.1:8000/docs`
- WebSocket Telemetry: `ws://127.0.0.1:8000/ws/simulation`

### 3. Frontend Setup (React & Vite Workspace)
```bash
cd ../frontend
npm install
npm run dev
```
- Laboratory Dashboard: `http://localhost:5173`

### 4. One-Click Launcher (Windows)
Double-click `run.bat` in the root folder to start both servers automatically.

---

## 🔌 REST & WebSocket API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status and active dispatch algorithm |
| `POST` | `/api/configure` | Configure floors, cars, capacity, and retrain RL policy |
| `GET` | `/api/state` | Current car coordinates, passenger queue, and metrics |
| `GET` | `/api/policy` | Policy convergence stats, Bellman error, and iteration count |
| `GET` | `/api/bellman` | Live Bellman equation terms, $V^*(s)$, and ranked $Q(s, a)$ |
| `POST` | `/api/simulation` | Engine controls (`play`, `pause`, `step`, `reset`, `surge`) |
| `POST` | `/api/call` | Dispatch manual floor call (`floor`, `direction`) |
| `GET` | `/api/regime` | Active traffic regime details and available modes |
| `POST` | `/api/regime` | Live switch active regime (`morning`, `evening`, `lunch`, etc.) |
| `GET` | `/api/audit` | Comprehensive decision audit records |
| `POST` | `/api/experiment`| Run automated benchmark comparison vs. baselines |
| `WS` | `/ws/simulation` | Real-time WebSocket telemetry stream (state, load, audit) |

---

## 📁 Repository Structure

```
ELEVATE/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py             # FastAPI REST endpoints & WebSocket handler
│   ├── core/
│   │   ├── __init__.py
│   │   ├── mdp.py                # Discrete MDP model & Poisson traffic regimes
│   │   ├── policy_iter.py        # Exact Policy Iteration solver
│   │   ├── value_iter.py         # Exact Value Iteration solver
│   │   ├── q_learning.py         # Model-Free Tabular Q-Learning
│   │   ├── dqn.py                # Vectorized Pure-NumPy Deep Q-Network
│   │   └── simulator.py          # Physics tick loop, load sensor, and audit log
│   ├── config.py                 # System hyperparameters & defaults
│   ├── main.py                   # FastAPI application initialization
│   └── requirements.txt          # Python dependencies (fastapi, uvicorn, numpy)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppShell.jsx              # Navigation header, sidebar, botanical theme
│   │   │   ├── BellmanInspector.jsx      # Live Bellman equation deconstruction viewer
│   │   │   ├── ConfigModal.jsx           # Dynamic building & hyperparameter editor
│   │   │   ├── IsometricTowerView.jsx    # 3D shaft graphics & passenger visualization
│   │   │   ├── TrafficRegimeSelector.jsx # Demand regime switcher
│   │   │   └── DecisionAudit.jsx         # Live telemetry logs
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx           # Mission, architecture, & hero showcase
│   │   │   ├── LaboratoryPage.jsx        # Bento-grid central workspace
│   │   │   ├── SimulationPage.jsx        # Interactive elevator simulator
│   │   │   ├── AuditPage.jsx             # Comprehensive audit trail & CSV/JSON export
│   │   │   └── ExperimentPage.jsx        # Benchmark comparison suite
│   │   ├── services/
│   │   │   └── api.js                    # REST bridge & WebSocket client
│   │   ├── App.jsx                       # Root view state controller
│   │   ├── main.jsx                      # React 18 DOM mount
│   │   └── index.css                     # Custom Vanilla CSS design tokens (0 Tailwind)
│   ├── package.json
│   └── vite.config.js
│
├── report/                               # High-resolution technical charts & screenshots
│   ├── fig1_landing_page.png
│   ├── fig2_laboratory_page.png
│   ├── fig3_simulation_page.png
│   ├── fig4_audit_page.png
│   ├── fig5_experiment_page.png
│   ├── fig6_config_modal.png
│   ├── fig7_bellman_inspector.png
│   ├── fig8_convergence_curves.png
│   ├── fig9_benchmark_comparison.png
│   ├── fig10_traffic_regimes.png
│   └── fig11_load_balancing.png
│
├── ELEVATE_Academic_Project_Report.docx  # Full Academic Project Report (Word format)
├── ELEVATE_Academic_Project_Report.pdf   # Academic Project Report (PDF format)
├── test_suite.py                         # 39-test automated validation suite
├── run.bat                               # One-click Windows launch script
├── .gitignore                            # Git exclusion rules
└── README.md                             # Developer documentation
```

---

## 📜 References & Academic Literature
1. **Bellman, R. (1957).** *Dynamic Programming*. Princeton University Press.
2. **Puterman, M. L. (1994).** *Markov Decision Processes: Discrete Stochastic Dynamic Programming*. John Wiley & Sons.
3. **Howard, R. A. (1960).** *Dynamic Programming and Markov Processes*. MIT Press.
4. **Sutton, R. S., & Barto, A. G. (2018).** *Reinforcement Learning: An Introduction* (2nd ed.). MIT Press.
5. **Crites, R. H., & Barto, A. G. (1996).** "Improving elevator performance using reinforcement learning." *NeurIPS 1996*, Vol. 8, pp. 1017–1023.
6. **Watkins, C. J. C. H., & Dayan, P. (1992).** "Q-learning." *Machine Learning*, 8(3–4), pp. 279–292.
7. **Mnih, V., et al. (2015).** "Human-level control through deep reinforcement learning." *Nature*, 518(7540), pp. 529–533.
8. **Barney, G., & Al-Sharif, L. (2015).** *Elevator Traffic Handbook: Theory and Practice* (2nd ed.). Routledge.

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details.  
Developed by **Vaishnavi Soni** ([@Vaishnavi-Soni-12](https://github.com/Vaishnavi-Soni-12)).
