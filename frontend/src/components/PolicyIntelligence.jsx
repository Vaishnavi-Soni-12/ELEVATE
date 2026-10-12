import React from 'react';
import BentoCard from './BentoCard.jsx';

/**
 * PolicyIntelligence: Selected policy metrics, trust scoring, and simulation deployment
 * Exactly matches bottom-left block of sim 1.png
 */
export default function PolicyIntelligence({
  policyData,
  onDeploy
}) {
  const { selectedPolicy, badge, description, metrics } = policyData;

  return (
    <BentoCard className="policy-intelligence-card">
      <div className="policy-intel-left">
        {/* Header */}
        <div className="bento-header" style={{ marginBottom: 16 }}>
          <div className="bento-title-group">
            <h2>POLICY INTELLIGENCE</h2>
            <span className="bento-subtitle">Selected policy and performance</span>
          </div>
        </div>

        {/* Policy Highlight Banner */}
        <div className="policy-highlight-box">
          <div className="policy-box-header">
            <span className="policy-box-name">{selectedPolicy}</span>
            <span className="badge-recommended">{badge}</span>
          </div>
          <p className="policy-box-desc">{description}</p>
        </div>

        {/* Metrics Grid */}
        <div className="policy-metrics-grid">
          <div className="policy-metric-cell">
            <span className="policy-metric-label">Reward</span>
            <span className="policy-metric-val">{metrics.reward}</span>
          </div>
          <div className="policy-metric-cell">
            <span className="policy-metric-label">Trust</span>
            <span className="policy-metric-val green">{metrics.trust}</span>
          </div>
          <div className="policy-metric-cell">
            <span className="policy-metric-label">Confidence</span>
            <span className="policy-metric-val green">{metrics.confidence}</span>
          </div>
          <div className="policy-metric-cell">
            <span className="policy-metric-label">Convergence</span>
            <span className="policy-metric-val">{metrics.convergence}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="btn-deploy-simulation"
          onClick={onDeploy}
          title="Transfer active policy artifact into the live simulator"
        >
          <span>Deploy to Simulation</span>
          <span>→</span>
        </button>
      </div>

      {/* Right Column: Pastel Sculpture & Brand Metadata */}
      <div className="policy-intel-right">
        <svg className="policy-sculpture-svg" viewBox="0 0 120 140" fill="none">
          {/* Pastel Sphere */}
          <circle cx="65" cy="50" r="38" fill="url(#spherePeachGrad)" opacity="0.85" />
          {/* Intersecting Pastel Arches */}
          <path
            d="M20 140 L20 90 A 28 28 0 0 1 76 90 L76 140 Z"
            fill="url(#archBlushGrad)"
            opacity="0.9"
          />
          <path
            d="M50 140 L50 105 A 18 18 0 0 1 86 105 L86 140 Z"
            fill="#FFF9F3"
            opacity="0.8"
          />
          <defs>
            <linearGradient id="spherePeachGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F7C9A9" />
              <stop offset="100%" stopColor="#F4C7C3" />
            </linearGradient>
            <linearGradient id="archBlushGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF9F3" />
              <stop offset="100%" stopColor="#EFE8E1" />
            </linearGradient>
          </defs>
        </svg>

        <div className="policy-brand-vertical">
          <span>OPTIMIZE</span>
          <span>ADAPT</span>
          <span>ELEVATE</span>
        </div>
      </div>
    </BentoCard>
  );
}
