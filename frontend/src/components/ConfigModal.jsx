import React, { useState, useEffect } from 'react';
import { configureBuilding } from '../services/api.js';

/**
 * ConfigModal: Runtime Building Configuration & RL Algorithm Setup
 * Allows the user to dynamically adjust elevators, floors, gamma, and algorithms.
 * Renders as a true centered modal popup with backdrop blur and escape key handling.
 */
export default function ConfigModal({ isOpen, onClose, onConfigApplied }) {
  const [numFloors, setNumFloors] = useState(20);
  const [numElevators, setNumElevators] = useState(4);
  const [capacity, setCapacity] = useState(8);
  const [gamma, setGamma] = useState(0.95);
  const [algorithm, setAlgorithm] = useState('auto');
  const [qEpisodes, setQEpisodes] = useState(5000);
  const [simTickMs, setSimTickMs] = useState(400);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // State space estimate: Floors ^ Elevators
  const stateSpace = Math.pow(numFloors, numElevators);
  const recommendedAlgo = stateSpace <= 1000 
    ? 'Policy Iteration (Exact DP)' 
    : (stateSpace <= 8000 ? 'Value Iteration (Bellman Sweeps)' : 'Q-Learning (Model-Free RL)');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await configureBuilding({
        num_floors: numFloors,
        num_elevators: numElevators,
        capacity,
        gamma,
        algorithm,
        q_episodes: qEpisodes,
        sim_tick_ms: simTickMs
      });

      const algoReadable = res.algorithm_selected.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setFeedback({
        type: 'success',
        msg: `Building configured! RL trained via ${algoReadable} (${res.state_space_size.toLocaleString()} states).`
      });

      if (onConfigApplied) {
        onConfigApplied(res);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: `Failed to configure: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: 640, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">RUNTIME RL CONFIG</div>
            <h2 className="modal-title">Building & Dispatch Architecture</h2>
            <p className="modal-sub">Dynamically customize floor counts, car capacity, discount factor γ, and solver</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: feedback.type === 'success' ? '#E8F5E9' : '#FDF0EF',
            color: feedback.type === 'success' ? '#2E8B57' : '#C45A53',
            border: `1px solid ${feedback.type === 'success' ? '#2E8B57' : '#F4C7C3'}`,
            marginBottom: 18
          }}>
            {feedback.type === 'success' ? '✓ ' : '⚠ '}{feedback.msg}
          </div>
        )}

        {/* Architecture Preview Box */}
        <div style={{
          background: 'linear-gradient(135deg, #FAF6EF 0%, #F5EFFB 100%)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              State Space Estimate |S| = Floors<sup>Cars</sup>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {stateSpace > 1e7 ? `${stateSpace.toExponential(2)} states` : `${stateSpace.toLocaleString()} states`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Auto-Selected Solver
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#2E8B57', marginTop: 4 }}>
              {recommendedAlgo}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Sliders Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="config-field">
              <label className="config-field-label">
                <span>Floors ({numFloors})</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{numFloors}</span>
              </label>
              <input
                type="range"
                min={2}
                max={30}
                value={numFloors}
                onChange={(e) => setNumFloors(Number(e.target.value))}
                className="config-slider"
              />
            </div>

            <div className="config-field">
              <label className="config-field-label">
                <span>Elevator Shafts ({numElevators})</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{numElevators}</span>
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={numElevators}
                onChange={(e) => setNumElevators(Number(e.target.value))}
                className="config-slider"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="config-field">
              <label className="config-field-label">
                <span>Car Capacity (Persons)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{capacity}</span>
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="config-input"
              />
            </div>

            <div className="config-field">
              <label className="config-field-label">
                <span>Discount Factor γ (Gamma)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{gamma}</span>
              </label>
              <input
                type="range"
                min={0.5}
                max={0.99}
                step={0.01}
                value={gamma}
                onChange={(e) => setGamma(Number(e.target.value))}
                className="config-slider"
              />
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="config-field">
            <label className="config-field-label">
              <span>Reinforcement Learning Algorithm</span>
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="config-select"
            >
              <option value="auto">Auto-Select based on State Space Complexity (Recommended)</option>
              <option value="policy_iteration">Policy Iteration (Exact DP — Ideal for ≤1,000 states)</option>
              <option value="value_iteration">Value Iteration (Bellman Sweeps — Ideal for ≤8,000 states)</option>
              <option value="q_learning">Q-Learning (Model-Free Exploration — Ideal for Massive Towers)</option>
              <option value="dqn">Deep Q-Network (DQN — Pure-NumPy Neural Q-Estimator)</option>
            </select>
          </div>

          {/* Additional Tuning Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="config-field">
              <label className="config-field-label">
                <span>Q-Episodes (if Q-Learning)</span>
              </label>
              <input
                type="number"
                min={500}
                max={20000}
                step={500}
                value={qEpisodes}
                onChange={(e) => setQEpisodes(Number(e.target.value))}
                className="config-input"
              />
            </div>

            <div className="config-field">
              <label className="config-field-label">
                <span>Sim Tick Interval (ms)</span>
              </label>
              <input
                type="number"
                min={100}
                max={2000}
                step={50}
                value={simTickMs}
                onChange={(e) => setSimTickMs(Number(e.target.value))}
                className="config-input"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn-exit"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-sm"
              disabled={loading}
              style={{ minWidth: 200, background: 'var(--charcoal)', color: '#fff', borderColor: 'var(--charcoal)' }}
            >
              {loading ? 'Training RL Policy...' : 'Apply & Train Policy →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
