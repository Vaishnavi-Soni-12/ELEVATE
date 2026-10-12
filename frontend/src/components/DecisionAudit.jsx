import React from 'react';
import BentoCard from './BentoCard.jsx';

/**
 * DecisionAudit: Live decision trace pipeline (State -> Action -> Reward -> Next State)
 * Exactly matches bottom-right block of sim 1.png
 */
export default function DecisionAudit({
  auditData,
  onOpenFullAudit
}) {
  const { timestamp, stateSummary, actionSummary, reward, nextStateSummary } = auditData;

  return (
    <BentoCard className="decision-audit-card">
      <div>
        {/* Header */}
        <div className="bento-header" style={{ marginBottom: 16 }}>
          <div className="bento-title-group">
            <h2>DECISION AUDIT</h2>
            <span className="bento-subtitle">Latest decision from the RL agent</span>
          </div>

          <div className="audit-clock-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timestamp}</span>
          </div>
        </div>

        {/* Sequential Decision Pipeline */}
        <div className="decision-pipeline-row">
          {/* Node 1: STATE */}
          <div className="pipeline-node">
            <div className="pipeline-icon-circle" style={{ background: '#DCCFEA77' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7A6894" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="pipeline-stage-title">STATE</span>
            <div className="pipeline-stage-content">
              {Object.entries(stateSummary).map(([k, v]) => (
                <div key={k}>{k}: {v}</div>
              ))}
            </div>
          </div>

          <span className="pipeline-arrow">→</span>

          {/* Node 2: ACTION */}
          <div className="pipeline-node">
            <div className="pipeline-icon-circle" style={{ background: '#F4C7C377' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C45A53" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="pipeline-stage-title">ACTION</span>
            <div className="pipeline-stage-content">
              <div>{actionSummary.label}</div>
              <div style={{ fontWeight: 700 }}>{actionSummary.target}</div>
            </div>
          </div>

          <span className="pipeline-arrow">→</span>

          {/* Node 3: REWARD */}
          <div className="pipeline-node">
            <div className="pipeline-icon-circle" style={{ background: '#C8E5D488' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#2E8B57" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
                <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
                <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
              </svg>
            </div>
            <span className="pipeline-stage-title">REWARD</span>
            <div className="pipeline-stage-content reward">
              {reward}
            </div>
          </div>

          <span className="pipeline-arrow">→</span>

          {/* Node 4: NEXT STATE */}
          <div className="pipeline-node">
            <div className="pipeline-icon-circle" style={{ background: '#DCCFEA77' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7A6894" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="pipeline-stage-title">NEXT STATE</span>
            <div className="pipeline-stage-content">
              <div>{nextStateSummary.target}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Actions & Quote */}
      <div className="decision-audit-bottom-row">
        <button className="btn-open-audit" onClick={onOpenFullAudit}>
          <span>Open Full Audit</span>
          <span>→</span>
        </button>

        <p className="audit-editorial-quote">
          “Every decision builds a better flow.”
        </p>
      </div>
    </BentoCard>
  );
}
