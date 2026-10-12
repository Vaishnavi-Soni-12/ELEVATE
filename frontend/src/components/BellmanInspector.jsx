import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_URL } from '../services/api.js';

/**
 * BellmanInspector — Mathematical Foundations Inspector
 * Renders live Bellman equation components fetched from /api/bellman.
 * Shows: formula, current V*(s), top Q-values, convergence error, regime.
 */
export default function BellmanInspector({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchBellman = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/bellman`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setError(null);
      } else {
        setError('Backend returned error');
      }
    } catch (e) {
      setError('Backend offline — showing illustrative values');
      // Provide illustrative offline data
      setData({
        tick: 42,
        algorithm: 'policy_iteration',
        gamma: 0.95,
        current_state: [3, 11, 6, 0],
        state_label: 'E1:F03, E2:F11, E3:F06, E4:F00',
        current_v: 412.30,
        bellman_error: 0.000084,
        convergence_iters: 17,
        converged: true,
        top_actions: [
          { action_idx: 13, deltas: [0, -1, 1, 0], reward: 8.42, next_value: 421.2, q_value: 14.56 },
          { action_idx: 7,  deltas: [1, 0, 0, -1], reward: 6.10, next_value: 418.8, q_value: 12.26 },
          { action_idx: 4,  deltas: [0, 1, 0, 0],  reward: 5.80, next_value: 416.1, q_value: 11.60 },
        ],
        formula: 'V*([3,11,6,0]) = max_a [R(s,a) + 0.95*V*(s\')]',
        current_bellman: 'V*=412.3, best Q=14.56',
        regime: { key: 'uniform', label: 'Uniform Random', description: 'Baseline stochastic traffic', arrival_rate: 0.30 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchBellman();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchBellman, 2000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isOpen, autoRefresh]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const algoLabel = (data?.algorithm || 'policy_iteration').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 780, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">MATHEMATICAL FOUNDATIONS INSPECTOR</div>
            <h2 className="modal-title">Live Bellman Equation Viewer</h2>
            <p className="modal-sub">V*(s) = max<sub>a</sub> [R(s,a) + γ · V*(s')] — real values from running MDP</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading && !data && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Fetching Bellman snapshot from RL engine...
          </div>
        )}

        {error && (
          <div style={{
            background: '#FFF8E7', border: '1px solid #F5C842', borderRadius: 8,
            padding: '8px 14px', fontSize: 12, color: '#856004', marginBottom: 16
          }}>
            ⚠ {error}
          </div>
        )}

        {data && (
          <>
            {/* Big Formula Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A2E 100%)',
              borderRadius: 16, padding: '24px 28px', marginBottom: 20,
              border: '1px solid #333', position: 'relative', overflow: 'hidden'
            }}>
              {/* Decorative glow */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(100, 120, 255, 0.15)', filter: 'blur(30px)'
              }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#888', marginBottom: 12 }}>
                BELLMAN OPTIMALITY EQUATION
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700,
                color: '#E8E8FF', letterSpacing: '0.02em', lineHeight: 1.5
              }}>
                V*(s) = max<span style={{ color: '#F4C7C3' }}>a</span>{' '}
                <span style={{ color: '#AAAAAA' }}>[</span>
                <span style={{ color: '#C8E5D4' }}>R(s,a)</span>
                {' + '}
                <span style={{ color: '#F5E6A8' }}>γ</span>
                {' · '}
                <span style={{ color: '#DCCFEA' }}>V*(s')</span>
                <span style={{ color: '#AAAAAA' }}>]</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, color: '#9999CC',
                marginTop: 10, lineHeight: 1.6
              }}>
                <span style={{ color: '#888' }}>{'// '}</span>
                Current: V*(<span style={{ color: '#E8E8FF' }}>{data.state_label}</span>) ={'  '}
                <span style={{ color: '#C8E5D4', fontWeight: 700 }}>{data.current_v}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666',
                marginTop: 6
              }}>
                γ = <span style={{ color: '#F5E6A8' }}>{data.gamma}</span>
                {' | '}δ (Bellman Error) = <span style={{ color: data.bellman_error < 0.001 ? '#2E8B57' : '#D97706' }}>
                  {data.bellman_error?.toExponential(2)}
                </span>
                {' | '}
                {data.converged
                  ? <span style={{ color: '#2E8B57' }}>Converged in {data.convergence_iters} iter</span>
                  : <span style={{ color: '#D97706' }}>Converging... iter {data.convergence_iters}</span>
                }
              </div>
            </div>

            {/* Algorithm + Regime Row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <InfoBadge label="ALGORITHM" value={algoLabel} color="#DCCFEA" />
              <InfoBadge label="TICK" value={`#${data.tick}`} color="#F5E6A8" />
              <InfoBadge label="STATE SPACE" value={`${data.current_state?.length} elevators`} color="#C8E5D4" />
              <InfoBadge label="TRAFFIC REGIME" value={data.regime?.label || 'Uniform'} color="#F4C7C3" />
              <InfoBadge label="ARRIVAL λ" value={`${((data.regime?.arrival_rate || 0.3) * 100).toFixed(0)}%/tick`} color="#BCE3EB" />
            </div>

            {/* Top Actions Q-value Table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10
              }}>
                TOP-3 ACTION Q-VALUES — Q(s,a) = R(s,a) + γ·V*(s')
              </div>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Action (Δ per elevator)</th>
                    <th>R(s,a)</th>
                    <th>γ·V*(s')</th>
                    <th>Q(s,a)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.top_actions || []).map((a, i) => {
                    const gammaV = (data.gamma * a.next_value).toFixed(4);
                    const deltaStr = a.deltas
                      .map((d, ei) => d > 0 ? `E${ei+1}↑` : d < 0 ? `E${ei+1}↓` : null)
                      .filter(Boolean).join(', ') || 'All Hold';
                    return (
                      <tr key={a.action_idx} style={{ background: i === 0 ? '#FAF5EE' : 'transparent' }}>
                        <td style={{ fontWeight: 700, color: i === 0 ? '#2E8B57' : 'var(--text-secondary)' }}>
                          {i === 0 ? '★ π*(s)' : `#${i + 1}`}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{deltaStr}</td>
                        <td style={{ color: '#2E8B57', fontWeight: 600 }}>{a.reward}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#7B5EA7' }}>{gammaV}</td>
                        <td style={{
                          fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: i === 0 ? '#C45A53' : 'var(--text-primary)'
                        }}>{a.q_value}</td>
                        <td>
                          {i === 0
                            ? <span className="status-badge green">OPTIMAL</span>
                            : <span className="status-badge blue">SUBOPT.</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bellman Backup Visual */}
            <div style={{
              background: '#FAF6EF', borderRadius: 12, padding: '16px 20px',
              border: '1px solid var(--border-hairline)', marginBottom: 20
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.1em' }}>
                BELLMAN BACKUP DIAGRAM
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <BackupNode label="s" value={data.state_label} color="#DCCFEA" />
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(data.top_actions || []).slice(0, 2).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        background: i === 0 ? '#C8E5D4' : '#F5E6A8',
                        borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        border: `1px solid ${i === 0 ? '#2E8B57' : '#D97706'}`
                      }}>
                        a{i} → R={a.reward}
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                      <BackupNode label="s'" value={`V=${a.next_value}`} color="#F4C7C3" small />
                    </div>
                  ))}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18, marginLeft: 8 }}>→</span>
                <BackupNode label="V*(s)" value={data.current_v} color="#DCCFEA" highlight />
              </div>
            </div>

            {/* Footer Controls */}
            <div className="modal-footer">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={e => {
                    setAutoRefresh(e.target.checked);
                    clearInterval(intervalRef.current);
                    if (e.target.checked) {
                      intervalRef.current = setInterval(fetchBellman, 2000);
                    }
                  }}
                />
                Auto-refresh (2s)
              </label>
              <button className="btn-exit" onClick={fetchBellman}>Refresh Now</button>
              <button className="btn-exit" onClick={onClose}>CLOSE</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoBadge({ label, value, color }) {
  return (
    <div style={{
      background: color + '33', border: `1px solid ${color}88`,
      borderRadius: 8, padding: '6px 14px', display: 'flex', flexDirection: 'column', gap: 2
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function BackupNode({ label, value, color, small, highlight }) {
  return (
    <div style={{
      background: color + (highlight ? 'CC' : '55'),
      border: `${highlight ? 2 : 1}px solid ${color}`,
      borderRadius: 8, padding: small ? '4px 10px' : '8px 14px',
      textAlign: 'center', minWidth: small ? 80 : 120
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: small ? 11 : 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}
