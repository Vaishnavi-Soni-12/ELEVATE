# ELEVATE — Backend Architecture & RL Engine

> **Academic Project**: Adaptive Multi-Elevator Control Using Policy Evaluation and Policy Improvement  
> **Framework**: FastAPI + Pure NumPy (Zero external heavyweight ML dependencies)

---

## 1. System Overview

ELEVATE implements a full-featured Markov Decision Process (MDP) solver and real-time elevator simulation engine. It computes optimal elevator dispatching policies using Bellman optimality equations and streams live telemetry to the frontend via WebSockets.

### Core RL Algorithms Included:

1. **Policy Iteration (Howard's Algorithm)**:
   - Alternates between exact **Policy Evaluation** ($V(s) \leftarrow R(s,\pi(s)) + \gamma \sum_{s'} P(s'|s,\pi(s)) V(s')$) and **Policy Improvement** ($\pi(s) \leftarrow \arg\max_a [R(s,a) + \gamma V(T(s,a))]$) until policy stability is achieved ($\pi_{k+1} = \pi_k$).
   - Optimal for small state spaces ($\le 1,000$ states).

2. **Value Iteration**:
   - Solves the Bellman Optimality Equation directly without an inner evaluation loop:
     $$V_{k+1}(s) \leftarrow \max_a \left[ R(s,a) + \gamma V_k(T(s,a)) \right]$$
   - Derives the optimal greedy policy once $\max |V_{k+1}(s) - V_k(s)| < \theta$.
   - Optimal for medium state spaces ($\le 8,000$ states).

3. **Tabular Q-Learning (Model-Free)**:
   - Learns action values directly through experience tuples $(s, a, r, s')$:
     $$Q(s,a) \leftarrow Q(s,a) + \alpha \left[ r + \gamma \max_{a'} Q(s',a') - Q(s,a) \right]$$
   - Features $\epsilon$-greedy exploration with exponential decay.
   - Automatically selected for high-dimensional state spaces ($> 8,000$ states, e.g., 4 elevators $\times$ 20 floors $= 160,000$ states).

---

## 2. API Endpoints

### REST Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health, configured status, and active algorithm |
| `POST` | `/api/configure` | Set building parameters (floors, elevators, capacity, $\gamma$) and run training |
| `GET` | `/api/state` | Current laboratory state, elevator positions, calls, and metrics |
| `GET` | `/api/policy` | Policy convergence stats, Bellman error, and iteration history |
| `POST` | `/api/simulation` | Control simulation (`pause`, `resume`, `stop`, `reset`) |
| `POST` | `/api/call` | Inject manual floor call from the dispatcher UI |
| `GET` | `/api/audit` | Retrieve full decision audit log $(s, a, r, v, s')$ |
| `POST` | `/api/experiment` | Comparative benchmark against heuristic baselines |

### WebSocket Endpoint
- **URL**: `ws://127.0.0.1:8000/ws/simulation`
- **Direction**: Server $\rightarrow$ Client (streams 1 state JSON per tick)
- **Client Controls**:
  - `{"action": "pause"}`
  - `{"action": "resume"}`
  - `{"action": "call", "floor": 5, "direction": "up"}`
  - `{"action": "reset"}`

---

## 3. How to Run Locally

### Start Backend
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API docs available at: `http://127.0.0.1:8000/docs`

### Start Frontend
```powershell
cd frontend
npm run dev
```
Open in browser: `http://localhost:5173`
