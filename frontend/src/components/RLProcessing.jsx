import React from 'react';
import BentoCard from './BentoCard.jsx';

/**
 * RLProcessing: Parallel algorithm progress and convergence tracking
 * Exactly matches top-right block of sim 1.png
 */
export default function RLProcessing({ algorithms }) {
  // Render icon based on algorithm
  const renderAlgoIcon = (type, color) => {
    switch (type) {
      case 'grid':
        return (
          <div className="algo-icon-wrapper" style={{ background: `${color}44` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#D66D67" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
            </svg>
          </div>
        );
      case 'sparkle':
        return (
          <div className="algo-icon-wrapper" style={{ background: `${color}55` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#8E78A8" strokeWidth="2">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'code':
        return (
          <div className="algo-icon-wrapper" style={{ background: `${color}55` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#4F8C68" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="8 6 2 12 8 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case 'neural':
      default:
        return (
          <div className="algo-icon-wrapper" style={{ background: `${color}66` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B08638" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="20" cy="12" r="2" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="12" cy="20" r="2" />
              <line x1="6" y1="12" x2="9" y2="12" />
              <line x1="15" y1="12" x2="18" y2="12" />
              <line x1="12" y1="6" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="18" />
            </svg>
          </div>
        );
    }
  };

  return (
    <BentoCard className="rl-processing-card">
      {/* Header */}
      <div className="bento-header">
        <div className="bento-title-group">
          <h2>RL PROCESSING</h2>
          <span className="bento-subtitle">Parallel algorithm execution</span>
        </div>

        <div className="status-badge-running">
          <span className="pulse-dot" />
          <span>Running</span>
        </div>
      </div>

      {/* Algorithms List */}
      <div className="algorithms-list">
        {algorithms.map((algo) => (
          <div key={algo.id} className="algo-row">
            {renderAlgoIcon(algo.icon, algo.color)}

            <div className="algo-content-col">
              <div className="algo-top-line">
                <span className="algo-name">{algo.name}</span>
                <span className="algo-progress-val">{algo.progress}%</span>
              </div>

              <div className="algo-progress-track">
                <div
                  className="algo-progress-fill"
                  style={{
                    width: `${algo.progress}%`,
                    background: `linear-gradient(90deg, ${algo.color}aa 0%, ${algo.color} 100%)`
                  }}
                />
              </div>
            </div>

            <div className={`algo-status-col ${algo.isConverged ? 'converged' : 'running'}`}>
              <div className="algo-status-text-block">
                <span className="algo-status-label">{algo.status}</span>
                <span className="algo-status-sub">{algo.substatus}</span>
              </div>

              {algo.isConverged ? (
                <div className="icon-converged-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2E8B57" strokeWidth="2.5" style={{ width: 11, height: 11 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <div className="icon-running-spin" />
              )}
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
