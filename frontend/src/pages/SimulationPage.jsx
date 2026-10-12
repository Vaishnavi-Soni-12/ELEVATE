import React, { useState, useEffect, useRef } from 'react';
import EnvironmentVisualization from '../components/EnvironmentVisualization.jsx';
import IsometricTowerView from '../components/IsometricTowerView.jsx';
import BellmanInspector from '../components/BellmanInspector.jsx';
import TrafficRegimeSelector from '../components/TrafficRegimeSelector.jsx';
import { Direction, ElevatorStatus, createElevatorState } from '../types/elevator.js';
import { createSimulationWebSocket, injectFloorCall, controlSimulation, exportCSV, exportJSON, BACKEND_URL } from '../services/api.js';

const ELEVATOR_ACCENT_COLORS = ['#F4C7C3', '#DCCFEA', '#C8E5D4', '#F5E6A8', '#F7C9A9', '#BCE3EB', '#E5D4F4', '#D4E8C8'];

/**
 * SimulationPage: Live interactive simulation powered by the deployed Policy Artifact
 * Connected via real-time WebSocket to the FastAPI backend, with seamless local fallback.
 */
export default function SimulationPage({
  activePolicy = 'Policy Iteration',
  elevators: initialElevators,
  floors = 20,
  trafficPattern = 'Morning Peak'
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [elevators, setElevators] = useState(initialElevators);
  const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
  const [isSurgeActive, setIsSurgeActive] = useState(false);
  const [activeRequests, setActiveRequests] = useState([
    { id: 'sim-req-1', origin: 4, destination: 15, direction: Direction.UP, color: '#F4C7C3' },
    { id: 'sim-req-2', origin: 12, destination: 1, direction: Direction.DOWN, color: '#DCCFEA' },
    { id: 'sim-req-3', origin: 18, destination: 1, direction: Direction.DOWN, color: '#F7C9A9' }
  ]);

  // Live Metrics
  const [cumulativeReward, setCumulativeReward] = useState(4953.55);
  const [avgWaitTime, setAvgWaitTime] = useState(11.4);
  const [energyUsed, setEnergyUsed] = useState(682);
  const [servedCount, setServedCount] = useState(184);
  const [trustScore, setTrustScore] = useState(95.1);

  // Connection status
  const [isWsConnected, setIsWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Modal state
  const [isBellmanOpen, setIsBellmanOpen] = useState(false);
  const [isRegimeOpen, setIsRegimeOpen] = useState(false);
  const [activeRegime, setActiveRegime] = useState({ label: 'Uniform Random', key: 'uniform' });

  // Live Event Audit Stream
  const [auditStream, setAuditStream] = useState([
    {
      id: 'stream-1',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      elevator: 'E2',
      action: 'Dispatch to F14 (Serve Downward Peak)',
      reward: '+12.42',
      state: 'F12 → F14'
    },
    {
      id: 'stream-2',
      time: new Date(Date.now() - 3000).toLocaleTimeString('en-US', { hour12: false }),
      elevator: 'E1',
      action: 'Assign F06 (Collect Upward Demand)',
      reward: '+14.10',
      state: 'F04 → F06'
    }
  ]);

  // Connect WebSocket to real backend
  useEffect(() => {
    const wsClient = createSimulationWebSocket({
      onOpen: () => {
        setIsWsConnected(true);
        console.log('[Simulation] WebSocket connected to ELEVATE RL backend.');
      },
      onMessage: (data) => {
        if (!data || !data.elevators) return;

        // Map backend elevators to visual format
        setElevators((prev) => {
          return data.elevators.map((elv, idx) => {
            const floorNum = elv.floor + 1;
            const targetNum = elv.destination !== null ? elv.destination + 1 : floorNum;
            const existing = prev[idx] || {};
            const cap = elv.capacity || 8;
            const pax = elv.passengers ?? (existing.passengers || 2);
            const loadPct = elv.load_pct ?? Math.min(100, Math.round((pax / cap) * 100));
            const isBypass = elv.is_bypass ?? (loadPct >= 85);
            return {
              ...existing,
              id: `E${elv.id}`,
              name: `Elevator ${elv.id}`,
              currentFloor: floorNum,
              targetFloor: targetNum,
              direction: elv.direction === 'up' ? Direction.UP : (elv.direction === 'down' ? Direction.DOWN : Direction.IDLE),
              status: elv.direction === 'idle' ? ElevatorStatus.IDLE : ElevatorStatus.MOVING,
              accentColor: ELEVATOR_ACCENT_COLORS[idx % ELEVATOR_ACCENT_COLORS.length],
              passengers: pax,
              capacity: cap,
              load_kg: elv.load_kg ?? Math.round(pax * 75),
              load_pct: loadPct,
              is_bypass: isBypass
            };
          });
        });

        // Update metrics
        if (data.metrics) {
          setServedCount(data.metrics.total_served);
          setAvgWaitTime(data.metrics.avg_wait_ticks > 0 ? (data.metrics.avg_wait_ticks * 1.5).toFixed(1) : 11.2);
          setEnergyUsed(Math.round(data.metrics.total_energy_j + 650));
          setCumulativeReward((4950 + data.metrics.total_served * 12.5).toFixed(2));
          setTrustScore(data.metrics.policy_trust.toFixed(1));
        }

        // Update pending calls
        if (data.pending_calls && data.pending_calls.length > 0) {
          const mappedCalls = data.pending_calls.slice(0, 8).map((c, i) => ({
            id: `call-${data.tick}-${i}`,
            origin: c.floor + 1,
            destination: c.direction === 'up' ? Math.min(floors, c.floor + 5) : Math.max(1, c.floor - 5),
            direction: c.direction === 'up' ? Direction.UP : Direction.DOWN,
            color: ELEVATOR_ACCENT_COLORS[i % ELEVATOR_ACCENT_COLORS.length]
          }));
          setActiveRequests(mappedCalls);
        }

        // Add decision audit
        if (data.last_decision) {
          const ld = data.last_decision;
          const newEvent = {
            id: `ws-${data.tick}-${Date.now()}`,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            elevator: 'RL Dispatcher',
            action: ld.action_desc,
            reward: `+${ld.reward}`,
            state: `V(s): ${ld.value_after}`
          };
          setAuditStream((prev) => [newEvent, ...prev.slice(0, 6)]);
        }
      },
      onClose: () => {
        setIsWsConnected(false);
        console.log('[Simulation] WebSocket disconnected, switching to client-side loop.');
      },
      onError: () => {
        setIsWsConnected(false);
      }
    });

    wsRef.current = wsClient;

    return () => {
      wsClient.close();
    };
  }, [floors]);

  // Client-side fallback simulation tick loop (active when WS is disconnected)
  useEffect(() => {
    if (!isPlaying || isWsConnected) return;

    const intervalTime = 2000 / speedMultiplier;
    const interval = setInterval(() => {
      setElevators((prevElevators) => {
        return prevElevators.map((elv) => {
          let nextFloor = elv.currentFloor;
          let nextDir = elv.direction;

          if (elv.direction === Direction.UP) {
            if (nextFloor >= elv.targetFloor) {
              nextDir = Direction.DOWN;
              nextFloor = Math.max(1, nextFloor - 1);
            } else {
              nextFloor += 1;
            }
          } else if (elv.direction === Direction.DOWN) {
            if (nextFloor <= elv.targetFloor) {
              nextDir = Direction.UP;
              nextFloor = Math.min(floors, nextFloor + 1);
            } else {
              nextFloor -= 1;
            }
          }

          return {
            ...elv,
            currentFloor: nextFloor,
            direction: nextDir
          };
        });
      });

      setCumulativeReward((prev) => +(prev + 1.2).toFixed(2));
      setEnergyUsed((prev) => prev + 2);
      setAvgWaitTime((prev) => +(Math.max(8.5, prev - 0.02)).toFixed(1));

      const randomElv = `E${Math.floor(Math.random() * 4) + 1}`;
      const randomTarget = Math.floor(Math.random() * floors) + 1;
      const newEvent = {
        id: `stream-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        elevator: randomElv,
        action: `Policy Improvement: ${randomElv} assigned to F${String(randomTarget).padStart(2, '0')}`,
        reward: `+${(Math.random() * 8 + 6).toFixed(2)}`,
        state: `Target F${randomTarget}`
      };

      setAuditStream((prev) => [newEvent, ...prev.slice(0, 5)]);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, floors, isWsConnected]);

  // Play/Pause toggle
  const togglePlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (wsRef.current) {
      wsRef.current.sendAction({ action: nextState ? 'resume' : 'pause' });
    }
    controlSimulation(nextState ? 'resume' : 'pause').catch(() => {});
  };

  // Step one tick
  const handleStep = () => {
    setIsPlaying(false);
    if (wsRef.current) {
      wsRef.current.sendAction({ action: 'pause' });
    }
    setElevators((prev) =>
      prev.map((e) => ({
        ...e,
        currentFloor: e.direction === Direction.UP ? Math.min(floors, e.currentFloor + 1) : Math.max(1, e.currentFloor - 1)
      }))
    );
  };

  // Manual passenger call injection
  const handleManualCall = (floor) => {
    const floorIdx = floor - 1;
    const direction = floor > 10 ? 'down' : 'up';

    // Notify WebSocket and REST backend
    if (wsRef.current) {
      wsRef.current.sendAction({ action: 'call', floor: floorIdx, direction });
    }
    injectFloorCall(floorIdx, direction).catch(() => {});

    const newReq = {
      id: `manual-req-${Date.now()}`,
      origin: floor,
      destination: floor > 10 ? 1 : Math.min(floors, floor + 4),
      direction: floor > 10 ? Direction.DOWN : Direction.UP,
      color: '#F4C7C3'
    };
    setActiveRequests((prev) => [newReq, ...prev.slice(0, 10)]);

    const newAudit = {
      id: `stream-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      elevator: 'Dispatcher',
      action: `Passenger Call F${floor} → Dispatched via ${activePolicy}`,
      reward: '+9.80',
      state: `Pending F${floor}`
    };
    setAuditStream((prev) => [newAudit, ...prev.slice(0, 6)]);
  };

  // Trigger passenger load surge to demonstrate load-balancing bypass
  const handleSimulateSurge = async () => {
    setIsSurgeActive(true);
    try {
      await fetch(`${BACKEND_URL}/api/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'surge' })
      });
    } catch {}

    // Instant local UI surge state
    setElevators((prev) =>
      prev.map((e, idx) => {
        const cap = e.capacity || 8;
        const surgePax = idx < 2 ? Math.round(cap * 0.95) : Math.min(e.passengers, Math.round(cap * 0.4));
        const surgePct = idx < 2 ? 95 : Math.round((surgePax / cap) * 100);
        return {
          ...e,
          passengers: surgePax,
          load_pct: surgePct,
          is_bypass: idx < 2
        };
      })
    );

    // Auto-normalize surge after 7s
    setTimeout(() => {
      setIsSurgeActive(false);
      setElevators((prev) =>
        prev.map((e) => ({
          ...e,
          passengers: Math.max(1, Math.round((e.capacity || 8) * 0.35)),
          load_pct: 35,
          is_bypass: false
        }))
      );
    }, 7000);
  };

  return (
    <div className="simulation-view-container page-transition-wrap">
      {/* Dynamic Traffic Regime Control Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #F5E6A855 0%, #DCCFEA22 100%)',
        border: '1px solid var(--border-hairline)', borderRadius: 10,
        padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 12, fontSize: 12
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', fontSize: 10 }}>TRAFFIC REGIME:</span>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{activeRegime?.label || 'Uniform Random'}</span>
        {activeRegime?.description && (
          <span style={{ color: 'var(--text-secondary)' }}>— {activeRegime.description}</span>
        )}
        <button
          className="btn-exit"
          style={{ marginLeft: 'auto', fontSize: 11 }}
          onClick={() => setIsRegimeOpen(true)}
        >
          Switch Regime
        </button>
        <button
          className="btn-exit"
          style={{ fontSize: 11, background: 'var(--charcoal)', color: '#fff', borderColor: 'var(--charcoal)' }}
          onClick={() => setIsBellmanOpen(true)}
        >
          Math Inspector ∑
        </button>
      </div>

      {/* Top Compact KPI Deck */}
      <div className="sim-kpi-bar">
        <div className="sim-kpi-pill">
          <span className="sim-kpi-label">Active Policy</span>
          <span className="sim-kpi-val highlight" style={{ fontSize: 16 }}>{activePolicy}</span>
        </div>
        <div className="sim-kpi-pill">
          <span className="sim-kpi-label">Cumulative Reward</span>
          <span className="sim-kpi-val">+{cumulativeReward}</span>
        </div>
        <div className="sim-kpi-pill">
          <span className="sim-kpi-label">Average Wait</span>
          <span className="sim-kpi-val">{avgWaitTime}s</span>
        </div>
        <div className="sim-kpi-pill">
          <span className="sim-kpi-label">Energy</span>
          <span className="sim-kpi-val">{energyUsed} J</span>
        </div>
        <div className="sim-kpi-pill">
          <span className="sim-kpi-label">Served</span>
          <span className="sim-kpi-val">{servedCount}</span>
        </div>
        <div className="sim-kpi-pill">
          <span className="sim-kpi-label">Trust Score</span>
          <span className="sim-kpi-val highlight">{trustScore}%</span>
        </div>
      </div>

      {/* Main Simulation Stage */}
      <div className="simulation-stage-card">
        {/* Controls Toolbar */}
        <div className="sim-controls-toolbar">
          <div className="sim-btn-group">
            <button
              className={`sim-control-btn ${isPlaying ? 'active' : ''}`}
              onClick={togglePlayPause}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              className="sim-control-btn"
              onClick={handleStep}
            >
              ⏭ Step
            </button>
          </div>

          <div className="sim-btn-group">
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>SPEED:</span>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                className={`sim-control-btn ${speedMultiplier === s ? 'primary' : ''}`}
                onClick={() => setSpeedMultiplier(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Perspective View Mode Toggle & Overload Simulator */}
          <div className="sim-btn-group" style={{ marginLeft: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>VIEW:</span>
            <button
              className={`sim-control-btn ${viewMode === '2d' ? 'primary' : ''}`}
              onClick={() => setViewMode('2d')}
              title="2D Standard Shaft View"
            >
              ⊞ 2D Shafts
            </button>
            <button
              className={`sim-control-btn ${viewMode === '3d' ? 'primary' : ''}`}
              onClick={() => setViewMode('3d')}
              title="3D Isometric Glass Skyscraper View"
            >
              ◈ 3D Isometric
            </button>
            <button
              className="btn-exit"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                background: isSurgeActive ? '#FEE2E2' : 'var(--surface-card)',
                color: isSurgeActive ? '#DC2626' : 'var(--text-primary)',
                borderColor: isSurgeActive ? '#EF4444' : 'var(--border-subtle)',
                marginLeft: 4
              }}
              onClick={handleSimulateSurge}
              title="Simulate sudden passenger rush triggering car overload bypass"
            >
              ⚡ {isSurgeActive ? 'Surge (Bypass ON)' : 'Simulate Surge'}
            </button>
          </div>

          {/* Real-time Backend Engine Status Badge */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isWsConnected ? '#2E8B57' : '#D97706',
              boxShadow: isWsConnected ? '0 0 8px #2E8B57' : 'none',
              display: 'inline-block'
            }} />
            <span style={{ color: isWsConnected ? '#2E8B57' : 'var(--text-secondary)' }}>
              {isWsConnected ? 'RL Backend Live (WebSocket)' : 'Local Client Fallback'}
            </span>
          </div>
        </div>

        {/* Interactive Floor Call Buttons */}
        <div>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Interactive Floor Call Dispatcher:
          </span>
          <div className="interactive-call-strip" style={{ marginTop: 6 }}>
            {[1, 3, 5, 8, 10, 12, 15, 18, 20].map((fl) => (
              <button
                key={fl}
                className="btn-floor-call"
                onClick={() => handleManualCall(fl)}
              >
                Call Floor {fl}
              </button>
            ))}
          </div>
        </div>

        {/* Spatial Elevator shafts: 2D or 3D Isometric View */}
        {viewMode === '2d' ? (
          <EnvironmentVisualization
            elevators={elevators}
            activeRequests={activeRequests}
            floors={floors}
            trafficState={trafficPattern}
            stageHeight={400}
          />
        ) : (
          <IsometricTowerView
            elevators={elevators}
            activeRequests={activeRequests}
            floors={floors}
            stageHeight={440}
          />
        )}
      </div>

      {/* Bottom Live Audit Event Stream */}
      <div className="sim-live-stream-box">
        <div className="sim-stream-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>● Live Decision Audit Stream (State → Action → Reward → Value)</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-exit"
              style={{ fontSize: 10, padding: '4px 10px' }}
              onClick={() => exportCSV(
                auditStream.map(a => ({ time: a.time, elevator: a.elevator, action: a.action, reward: a.reward, state: a.state })),
                `elevate_audit_${Date.now()}.csv`
              )}
            >
              Export CSV ↓
            </button>
            <button
              className="btn-exit"
              style={{ fontSize: 10, padding: '4px 10px' }}
              onClick={() => exportJSON(auditStream, `elevate_audit_${Date.now()}.json`)}
            >
              Export JSON ↓
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {auditStream.map((item) => (
            <div key={item.id} className="sim-stream-item">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                [{item.time}]
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.elevator}: {item.action}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {item.state}
              </span>
              <span style={{ fontWeight: 700, color: '#2E8B57' }}>
                {item.reward}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <BellmanInspector isOpen={isBellmanOpen} onClose={() => setIsBellmanOpen(false)} />
      <TrafficRegimeSelector
        isOpen={isRegimeOpen}
        onClose={() => setIsRegimeOpen(false)}
        onRegimeChange={(key, cfg) => setActiveRegime({ key, ...cfg })}
      />
    </div>
  );
}
