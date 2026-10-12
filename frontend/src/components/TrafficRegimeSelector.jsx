import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../services/api.js';

const REGIME_ICONS = {
  morning: '🌅',
  evening: '🌆',
  lunch: '🍽️',
  event: '🎭',
  maintenance: '🔧',
  uniform: '🔀',
};

const REGIME_COLORS = {
  morning: '#F5E6A8',
  evening: '#DCCFEA',
  lunch: '#C8E5D4',
  event: '#F4C7C3',
  maintenance: '#BCE3EB',
  uniform: '#F7C9A9',
};

/**
 * TrafficRegimeSelector
 * Displays all 6 regimes as clickable cards; calls POST /api/regime to switch.
 * Shows the active regime's description and arrival rate.
 */
export default function TrafficRegimeSelector({ isOpen, onClose, onRegimeChange }) {
  const [regimes, setRegimes] = useState({});
  const [currentKey, setCurrentKey] = useState('uniform');
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchRegimes();
  }, [isOpen]);

  const fetchRegimes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/regime`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const d = await res.json();
        setRegimes(d.available || {});
        setCurrentKey(d.current?.key || 'uniform');
      }
    } catch {
      // Offline fallback — show static definitions
      setRegimes({
        morning:     { label: 'Morning Peak',   description: '80% upward from lobby — employees arriving', arrival_rate: 0.60 },
        evening:     { label: 'Evening Peak',   description: '75% downward to lobby — employees departing', arrival_rate: 0.55 },
        lunch:       { label: 'Lunch Hour',     description: 'Inter-floor traffic — cafeteria / mid-floors', arrival_rate: 0.35 },
        event:       { label: 'Event Mode',     description: 'Burst traffic to/from event floor (top-3)', arrival_rate: 0.75 },
        maintenance: { label: 'Maintenance',    description: 'Reduced traffic — off-hours with low demand', arrival_rate: 0.10 },
        uniform:     { label: 'Uniform Random', description: 'Baseline stochastic traffic across all floors', arrival_rate: 0.30 },
      });
    } finally {
      setLoading(false);
    }
  };

  const selectRegime = async (key) => {
    setSwitching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/regime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regime: key }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const d = await res.json();
        setCurrentKey(key);
        if (onRegimeChange) onRegimeChange(key, d.active_regime);
      } else {
        setCurrentKey(key); // optimistic UI even if offline
        if (onRegimeChange) onRegimeChange(key, { key, ...regimes[key] });
      }
    } catch {
      setCurrentKey(key);
      if (onRegimeChange) onRegimeChange(key, { key, ...regimes[key] });
    } finally {
      setSwitching(false);
    }
  };

  if (!isOpen) return null;

  const current = regimes[currentKey];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 720, width: '95vw' }}
      >
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">SIMULATION CONTROL</div>
            <h2 className="modal-title">Traffic Regime Selector</h2>
            <p className="modal-sub">Choose a real-world demand pattern — the MDP call-generation adapts instantly</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
            Loading regime options...
          </div>
        )}

        {/* Active regime badge */}
        {current && (
          <div style={{
            background: (REGIME_COLORS[currentKey] || '#F5E6A8') + '55',
            border: `2px solid ${REGIME_COLORS[currentKey] || '#F5E6A8'}`,
            borderRadius: 12, padding: '12px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <span style={{ fontSize: 28 }}>{REGIME_ICONS[currentKey] || '🔀'}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ACTIVE REGIME</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{current.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{current.description}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ARRIVAL RATE</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {((current.arrival_rate || 0.3) * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>per tick</div>
            </div>
          </div>
        )}

        {/* Regime Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, marginBottom: 20
        }}>
          {Object.entries(regimes).map(([key, regime]) => {
            const isActive = key === currentKey;
            const color = REGIME_COLORS[key] || '#F5E6A8';
            return (
              <button
                key={key}
                onClick={() => selectRegime(key)}
                disabled={switching}
                style={{
                  background: isActive ? color + '66' : color + '22',
                  border: `${isActive ? 2 : 1}px solid ${isActive ? color : color + '88'}`,
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s ease',
                  outline: isActive ? `2px solid ${color}` : 'none',
                  outlineOffset: 2,
                  opacity: switching && !isActive ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{REGIME_ICONS[key] || '🔀'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{regime.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  {regime.description}
                </div>
                <div style={{
                  marginTop: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em'
                  }}>ARRIVAL λ</span>
                  <span style={{
                    fontSize: 13, fontWeight: 800,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {((regime.arrival_rate || 0.3) * 100).toFixed(0)}%
                  </span>
                </div>
                {isActive && (
                  <div style={{
                    marginTop: 8, fontSize: 10, fontWeight: 700,
                    color: '#2E8B57', letterSpacing: '0.1em'
                  }}>● ACTIVE</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Academic context note */}
        <div style={{
          background: '#F5F5FF', borderRadius: 10, padding: '12px 16px',
          border: '1px solid #DDDDF0', fontSize: 12, color: 'var(--text-secondary)',
          lineHeight: 1.6, marginBottom: 20
        }}>
          <strong>Academic Note:</strong> Each regime modifies the MDP call-arrival distribution P(call | floor).
          The RL policy adapts its value function through Bellman updates: V*(s) = max<sub>a</sub>[R(s,a) + γ·V*(s')].
          Morning/Evening peaks test floor-biased demand; Event mode tests burst-load robustness.
        </div>

        <div className="modal-footer">
          <button className="btn-exit" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
