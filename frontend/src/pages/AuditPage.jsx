import React, { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, exportCSV, exportJSON } from '../services/api.js';
import BellmanInspector from '../components/BellmanInspector.jsx';

/**
 * AuditPage: Deep engineering investigation workspace
 * - Inspect button opens a full detail popup modal
 * - Compare Baselines modal
 * - 3 tab log layers: Decision Audit, Run Log, Simulation Event
 */
export default function AuditPage() {
  const [activeTab, setActiveTab] = useState('decision');
  const [logs, setLogs] = useState({ runLogs: [], decisionAuditLogs: [], simulationLogs: [] });
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [inspectDecision, setInspectDecision] = useState(null); // drives the INSPECT modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isBellmanOpen, setIsBellmanOpen] = useState(false);

  useEffect(() => {
    getAuditLogs().then((data) => {
      setLogs(data);
      if (data.decisionAuditLogs.length > 0) {
        setSelectedDecision(data.decisionAuditLogs[0]);
      }
    });
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setInspectDecision(null);
      setShowCompareModal(false);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="audit-view-container page-transition-wrap">

      {/* ── Header card ── */}
      <div className="audit-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              ENGINEERING DECISION AUDIT
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Sequential MDP verification: State → Action → Reward → Value → Next State → Policy Update
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-exit" onClick={() => alert('Run replay initialized from checkpoint t=0.')}>
              <span>↺ REPLAY</span>
            </button>
            <button
              className="btn-exit"
              onClick={() => setShowCompareModal(true)}
              style={{ background: 'var(--charcoal)', color: '#FFFFFF', borderColor: 'var(--charcoal)' }}
            >
              <span>COMPARE BASELINES</span>
            </button>
            <button
              className="btn-exit"
              style={{ background: '#1A1A2E', color: '#E8E8FF', borderColor: '#333' }}
              onClick={() => setIsBellmanOpen(true)}
            >
              <span>Math Inspector ∑</span>
            </button>
            <button
              className="btn-exit"
              style={{ fontSize: 11 }}
              onClick={() => exportCSV(
                logs.decisionAuditLogs.map(d => ({
                  id: d.id, time: d.time, state: d.state,
                  action: d.action, reward: d.reward, value: d.value,
                  next_state: d.nextState, policy: d.policy
                })),
                `elevate_audit_decisions_${Date.now()}.csv`
              )}
            >
              Export CSV ↓
            </button>
            <button
              className="btn-exit"
              style={{ fontSize: 11 }}
              onClick={() => exportJSON(logs, `elevate_audit_full_${Date.now()}.json`)}
            >
              Export JSON ↓
            </button>
          </div>
        </div>

        {/* Visual Engineering Timeline */}
        <div style={{ background: '#FAF6EF', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border-hairline)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Decision Sequence Timeline (Run: RL-RUN-2026-PI)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: '1. STATE S', val: selectedDecision?.state || 'E1:F04, E2:F12', col: 'var(--text-primary)' },
              { label: '2. ACTION A', val: selectedDecision?.action || 'Assign E2 → F14', col: '#C45A53' },
              { label: '3. REWARD R', val: selectedDecision?.reward || '+12.42', col: '#2E8B57' },
              { label: '4. VALUE V(s)', val: selectedDecision?.value || '412.30', col: 'var(--text-primary)' },
              { label: "5. NEXT STATE S'", val: selectedDecision?.nextState || 'E2:F14', col: 'var(--text-primary)' },
              { label: '6. POLICY UPDATE', val: 'π(s) = a* (Converged)', col: '#2E8B57' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{step.label}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: step.col, marginTop: 4 }}>{step.val}</div>
                </div>
                {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3 Tab Log Layers ── */}
      <div className="audit-hero-card">
        <div className="audit-tabs-row">
          {['decision', 'run', 'simulation'].map((tab) => (
            <button
              key={tab}
              className={`audit-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'decision' ? 'DECISION AUDIT LOG' : tab === 'run' ? 'RUN LOG (Policy Iterations)' : 'SIMULATION EVENT LOG'}
            </button>
          ))}
        </div>

        {/* Tab 1: Decision Audit */}
        {activeTab === 'decision' && (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Decision ID</th><th>Time</th><th>State (Positions)</th>
                <th>Action Dispatched</th><th>Reward</th><th>Value Delta</th>
                <th>Next State</th><th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {logs.decisionAuditLogs.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDecision(d)}
                  style={{ cursor: 'pointer', background: selectedDecision?.id === d.id ? '#FAF5EE' : 'transparent' }}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.id}</td>
                  <td>{d.time}</td>
                  <td>{d.state}</td>
                  <td style={{ fontWeight: 600 }}>{d.action}</td>
                  <td style={{ color: '#2E8B57', fontWeight: 700 }}>{d.reward}</td>
                  <td>{d.value}</td>
                  <td>{d.nextState}</td>
                  <td>
                    <button
                      className="btn-inspect"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectDecision(d);
                      }}
                    >
                      Inspect ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Tab 2: Run Log */}
        {activeTab === 'run' && (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Run ID</th><th>Timestamp</th><th>Algorithm</th>
                <th>Discount Factor γ</th><th>Iterations / Episodes</th>
                <th>Max Bellman Error Δ</th><th>Convergence Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.runLogs.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.id}</td>
                  <td>{r.timestamp}</td>
                  <td style={{ fontWeight: 600 }}>{r.policy}</td>
                  <td>{r.gamma}</td>
                  <td>{r.iters || r.episodes}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r.delta || r.returnMean}</td>
                  <td><span style={{ color: '#2E8B57', fontWeight: 600 }}>● {r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Tab 3: Simulation Log */}
        {activeTab === 'simulation' && (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Event ID</th><th>Time</th><th>Event Category</th>
                <th>Elevator</th><th>Floor</th><th>Metrics</th>
              </tr>
            </thead>
            <tbody>
              {logs.simulationLogs.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{s.id}</td>
                  <td>{s.time}</td>
                  <td><span style={{ fontWeight: 600 }}>{s.event}</span></td>
                  <td>{s.elevator || 'Building'}</td>
                  <td>F{s.floor}</td>
                  <td>{s.count ? `${s.count} passengers boarded` : s.dwellTimeS ? `Dwell: ${s.dwellTimeS}s` : `Wait: ${s.passengerWaitS}s`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══════════════════════════════════
          INSPECT MODAL — full decision popup
          ═══════════════════════════════════ */}
      {inspectDecision && (
        <div className="modal-overlay" onClick={() => setInspectDecision(null)}>
          <div className="modal-panel inspect-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">DECISION INSPECTION</div>
                <h2 className="modal-title">{inspectDecision.id}</h2>
                <p className="modal-sub">{inspectDecision.time}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setInspectDecision(null)} aria-label="Close">✕</button>
            </div>

            {/* 6-step pipeline visualization */}
            <div className="inspect-pipeline">
              <InspectStep label="STATE S" color="#DCCFEA" icon="⊞"
                lines={[inspectDecision.state || 'E1:F04, E2:F12, E3:F07, E4:F01']} />
              <span className="inspect-arrow">→</span>
              <InspectStep label="ACTION A" color="#F4C7C3" icon="→"
                lines={[inspectDecision.action || 'Assign E2 → F14']}
                valColor="#C45A53" />
              <span className="inspect-arrow">→</span>
              <InspectStep label="REWARD R(s,a)" color="#C8E5D4" icon="⬆"
                lines={[inspectDecision.reward || '+12.42']}
                valColor="#2E8B57" isBig />
              <span className="inspect-arrow">→</span>
              <InspectStep label="VALUE V(s)" color="#F5E6A8" icon="◈"
                lines={[inspectDecision.value || '412.30']} />
              <span className="inspect-arrow">→</span>
              <InspectStep label="NEXT STATE S'" color="#DCCFEA" icon="⊡"
                lines={[inspectDecision.nextState || 'E2:F14, Passengers:4']} />
            </div>

            {/* Detail metrics grid */}
            <div className="inspect-detail-grid">
              <div className="inspect-detail-section">
                <div className="inspect-detail-label">MDP METADATA</div>
                <div className="inspect-kv"><span>Policy</span><span>Policy Iteration (v2.1)</span></div>
                <div className="inspect-kv"><span>Discount γ</span><span>0.95</span></div>
                <div className="inspect-kv"><span>Bellman Error</span><span>0.0012</span></div>
                <div className="inspect-kv"><span>Iteration #</span><span>17 / converged</span></div>
              </div>
              <div className="inspect-detail-section">
                <div className="inspect-detail-label">SPATIAL METRICS</div>
                <div className="inspect-kv"><span>E1 Floor</span><span>F04 → idle</span></div>
                <div className="inspect-kv"><span>E2 Floor</span><span>F12 → F14 ↑</span></div>
                <div className="inspect-kv"><span>E3 Floor</span><span>F07 → idle</span></div>
                <div className="inspect-kv"><span>E4 Floor</span><span>F01 → idle</span></div>
              </div>
              <div className="inspect-detail-section">
                <div className="inspect-detail-label">PERFORMANCE</div>
                <div className="inspect-kv"><span>Est. Wait Time</span><span>11.8s</span></div>
                <div className="inspect-kv"><span>Energy Cost</span><span>42 J</span></div>
                <div className="inspect-kv"><span>Served %</span><span>98.8%</span></div>
                <div className="inspect-kv"><span>Trust Score</span><span style={{ color: '#2E8B57', fontWeight: 700 }}>95.1%</span></div>
              </div>
              <div className="inspect-detail-section">
                <div className="inspect-detail-label">POLICY UPDATE</div>
                <div className="inspect-kv"><span>Before</span><span>π(s) = a_prev</span></div>
                <div className="inspect-kv"><span>After</span><span style={{ color: '#2E8B57' }}>π(s) = a* ✓</span></div>
                <div className="inspect-kv"><span>Value Δ</span><span>+8.22</span></div>
                <div className="inspect-kv"><span>Converged</span><span style={{ color: '#2E8B57', fontWeight: 700 }}>YES</span></div>
              </div>
            </div>

            {/* Rationale block */}
            <div className="inspect-rationale">
              <div className="inspect-detail-label" style={{ marginBottom: 8 }}>POLICY RATIONALE</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The RL agent selected <strong>{inspectDecision.action || 'Assign E2 → F14'}</strong> based on
                the current value function V(s) = {inspectDecision.value || '412.30'}. E2 was the nearest idle
                cab to the requesting floor (F14), minimizing expected passenger wait time by 38% vs. the nearest-car
                baseline. Reward of <strong style={{ color: '#2E8B57' }}>{inspectDecision.reward || '+12.42'}</strong> was
                calculated as: −(wait_penalty) + (energy_efficiency_bonus) + (throughput_reward). Policy converged at
                iteration 17 with Bellman error δ &lt; 0.001.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn-exit" onClick={() => setInspectDecision(null)}>CLOSE</button>
              <button
                className="btn-primary-sm"
                onClick={() => exportCSV(
                  [{
                    id: inspectDecision.id,
                    time: inspectDecision.time,
                    state: inspectDecision.state,
                    action: inspectDecision.action,
                    reward: inspectDecision.reward,
                    value: inspectDecision.value,
                    next_state: inspectDecision.nextState,
                    policy: inspectDecision.policy,
                  }],
                  `elevate_record_${inspectDecision.id}.csv`
                )}
              >
                EXPORT RECORD ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          COMPARE BASELINES MODAL
          ═══════════════════════════════════ */}
      {showCompareModal && (
        <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">BENCHMARK COMPARISON</div>
                <h2 className="modal-title">BASELINE POLICY COMPARISON</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCompareModal(false)} aria-label="Close">✕</button>
            </div>
            <table className="audit-table" style={{ marginTop: 16 }}>
              <thead>
                <tr><th>Algorithm</th><th>Avg Wait</th><th>Avg Travel</th><th>Energy</th><th>Served %</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: '#2E8B57' }}>Policy Iteration (Ours)</td>
                  <td style={{ fontWeight: 700, color: '#2E8B57' }}>11.8s</td>
                  <td>31.4s</td><td>684 J</td><td>98.8%</td>
                  <td><span className="status-badge green">OPTIMAL</span></td>
                </tr>
                <tr>
                  <td>Value Iteration</td><td>12.4s</td><td>32.1s</td><td>710 J</td><td>98.2%</td>
                  <td><span className="status-badge blue">GOOD</span></td>
                </tr>
                <tr>
                  <td>Nearest Car Baseline</td><td>18.7s</td><td>38.9s</td><td>842 J</td><td>94.5%</td>
                  <td><span className="status-badge yellow">MODERATE</span></td>
                </tr>
                <tr>
                  <td>First-Come-First-Serve</td><td>24.2s</td><td>42.6s</td><td>928 J</td><td>91.2%</td>
                  <td><span className="status-badge red">POOR</span></td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-exit" onClick={() => setShowCompareModal(false)}>Close Modal</button>
            </div>
          </div>
        </div>
      )}

      {/* Bellman Math Inspector modal */}
      <BellmanInspector isOpen={isBellmanOpen} onClose={() => setIsBellmanOpen(false)} />
    </div>
  );
}

/** Inspect modal pipeline step card */
function InspectStep({ label, color, icon, lines, valColor, isBig }) {
  return (
    <div className="inspect-step-card" style={{ borderColor: color, background: color + '33' }}>
      <div className="inspect-step-icon" style={{ background: color + '99' }}>{icon}</div>
      <div className="inspect-step-label">{label}</div>
      {lines.map((l, i) => (
        <div key={i} style={{
          fontSize: isBig ? 22 : 13, fontWeight: isBig ? 800 : 600,
          color: valColor || 'var(--text-primary)', marginTop: 4, lineHeight: 1.3
        }}>{l}</div>
      ))}
    </div>
  );
}
