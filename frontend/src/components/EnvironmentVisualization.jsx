import React from 'react';
import BentoCard from './BentoCard.jsx';
import ElevatorCar from './ElevatorCar.jsx';

/**
 * EnvironmentVisualization: Primary spatial building & elevator representation
 * Exactly matches top-left block of sim 1.png
 */
export default function EnvironmentVisualization({
  elevators,
  activeRequests = [],
  floors = 20,
  trafficState = 'High',
  onElevatorClick,
  stageHeight = 350
}) {
  const guideFloors = [20, 15, 10, 5, 1];

  return (
    <BentoCard className="environment-card">
      {/* Header */}
      <div className="bento-header">
        <div className="bento-title-group">
          <h2>ENVIRONMENT</h2>
          <span className="bento-subtitle">Live building state</span>
        </div>

        <div className="env-meta-tags">
          <div className="env-meta-item">
            <span className="env-meta-val">{floors}</span>
            <span className="env-meta-label">Floors</span>
          </div>
          <div className="env-meta-item">
            <span className="env-meta-val">{elevators.length}</span>
            <span className="env-meta-label">Elevators</span>
          </div>
          <div className="env-meta-item">
            <span className="env-meta-val">{trafficState}</span>
            <span className="env-meta-label">Traffic</span>
          </div>
        </div>
      </div>

      {/* Interactive Building Canvas */}
      <div className="environment-canvas-container">
        {/* Horizontal floor guide rules */}
        <div className="floor-guides">
          {guideFloors.map((fl) => (
            <div key={fl} className="floor-guide-row">
              <span className="floor-number-label">{fl}</span>
              <div className="floor-rule-line" />
            </div>
          ))}
        </div>

        {/* Vertical Shafts & Cabs */}
        <div className="shafts-stage" style={{ height: `${stageHeight}px` }}>
          {/* Passenger Request Particles floating in space */}
          {activeRequests.slice(0, 14).map((req, idx) => {
            const yPercent = 100 - ((req.origin - 1) / (floors - 1)) * 100;
            // Distribute across shaft channels subtly
            const xPercent = 8 + (idx * 15) % 75;
            return (
              <div
                key={req.id || idx}
                className="request-particle"
                style={{
                  top: `${Math.max(4, Math.min(94, yPercent))}%`,
                  left: `${xPercent}%`,
                  backgroundColor: req.color || '#F4C7C3',
                  animationDelay: `${idx * 0.25}s`
                }}
                title={`Request: Floor ${req.origin} → ${req.destination}`}
              />
            );
          })}

          {/* Elevators */}
          {elevators.map((elv) => (
            <div key={elv.id} className="elevator-shaft-col">
              <div className="shaft-track-line" />
              <ElevatorCar
                elevator={elv}
                totalFloors={floors}
                stageHeight={stageHeight}
                onClick={onElevatorClick}
              />
              <span className="shaft-id-label">{elv.id}</span>
            </div>
          ))}
        </div>

        {/* Right Inset Details */}
        <div className="env-right-inset">
          {/* Active Requests Card */}
          <div className="active-requests-card">
            <span className="active-requests-card-title">Active Requests</span>
            <div className="active-requests-val-row">
              <span className="active-requests-count">{activeRequests.length || 12}</span>
              {/* Mini pastel bar chart graphic */}
              <div className="mini-chart-bars">
                <div className="mini-chart-bar" style={{ height: '10px', background: '#F4C7C3' }} />
                <div className="mini-chart-bar" style={{ height: '16px', background: '#F7C9A9' }} />
                <div className="mini-chart-bar" style={{ height: '22px', background: '#DCCFEA' }} />
                <div className="mini-chart-bar" style={{ height: '18px', background: '#C8E5D4' }} />
              </div>
            </div>
          </div>

          {/* Editorial Quote */}
          <p className="env-editorial-quote">
            Smooth movement.<br />
            Smarter decisions.<br />
            —
          </p>

          {/* Pastel Architectural 3D Sculpture Graphic (matching sim 1.png bottom right) */}
          <svg className="env-sculpture-svg" viewBox="0 0 160 150" fill="none">
            {/* Background soft glowing sun/sphere */}
            <circle cx="115" cy="50" r="32" fill="url(#sunGrad)" opacity="0.75" />
            {/* Curved Architectural Arch */}
            <path
              d="M30 150 L30 80 A 45 45 0 0 1 120 80 L120 150 Z"
              fill="url(#archGrad)"
              opacity="0.9"
            />
            {/* Inner Portal Arch Cutout */}
            <path
              d="M55 150 L55 95 A 20 20 0 0 1 95 95 L95 150 Z"
              fill="#FFF9F3"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5E6A8" />
                <stop offset="100%" stopColor="#F7C9A9" />
              </linearGradient>
              <linearGradient id="archGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F4C7C3" />
                <stop offset="60%" stopColor="#FAF2EB" />
                <stop offset="100%" stopColor="#F8ECE7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </BentoCard>
  );
}
