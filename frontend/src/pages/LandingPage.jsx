import React, { useEffect, useRef } from 'react';

/**
 * LandingPage — ELEVATE
 * Matches Stitch MCP landing design: minimal, spatial, editorial, warm ivory.
 */
export default function LandingPage({ onEnterLaboratory, onViewSystem }) {
  const canvasRef = useRef(null);

  // Subtle floating particle animation for the background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 3 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: ['#F4C7C3','#DCCFEA','#C8E5D4','#F5E6A8','#F7C9A9'][Math.floor(Math.random()*5)]
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + 'bb';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <div className="landing-root page-transition-wrap">
      <canvas ref={canvasRef} className="landing-canvas" aria-hidden="true" />

      {/* ── Mini top bar ── */}
      <header className="landing-topbar">
        <div className="landing-brand">
          <img src="/favicon.png" alt="ELEVATE emblem" className="landing-topbar-emblem" />
          <div>
            <span className="landing-topbar-name">ELEVATE</span>
            <span className="landing-topbar-sub"> / SPATIAL RESEARCH SUITE V1.0.4</span>
          </div>
        </div>
        <div className="landing-topbar-status">
          <span className="landing-status-dot green" />
          <span>DISPATCH ENGINE: ONLINE</span>
          <span className="landing-status-sep">·</span>
          <span>LATENCY: 4.0ms</span>
          <span className="landing-status-sep">·</span>
          <span>CONFIDENCE: 95.4%</span>
        </div>
      </header>

      {/* ── Main hero split ── */}
      <main className="landing-main">
        {/* Left hero column */}
        <div className="landing-left">
          <div className="landing-tech-badge">
            <span className="badge-dot" />
            REINFORCEMENT LEARNING / CONTROL SYSTEM
          </div>

          <h1 className="landing-hero-title">ELEVATE</h1>

          <p className="landing-hero-accent">
            ADAPTIVE INTELLIGENCE FOR VERTICAL MOVEMENT.
          </p>

          <p className="landing-hero-desc">
            A reinforcement-learning cyber-physical dispatch system that evaluates,
            improves, and deploys high-trust kinematic elevator policies across
            complex high-density architectures.
          </p>

          <div className="landing-cta-group">
            <button className="btn-primary-cta" onClick={onEnterLaboratory}>
              ENTER LABORATORY <span className="cta-arrow">→</span>
            </button>
            <button className="btn-secondary-cta" onClick={onViewSystem}>
              <span className="btn-secondary-icon">⊹</span> SPECIFICATION
            </button>
          </div>

          {/* Stat chips */}
          <div className="landing-stat-row">
            <div className="landing-stat">
              <span className="landing-stat-val">95.1%</span>
              <span className="landing-stat-label">Policy Trust</span>
            </div>
            <div className="landing-stat">
              <span className="landing-stat-val">17 Iters</span>
              <span className="landing-stat-label">Convergence</span>
            </div>
            <div className="landing-stat">
              <span className="landing-stat-val">-42.8%</span>
              <span className="landing-stat-label">Wait Delta</span>
            </div>
          </div>
        </div>

        {/* Right spatial preview */}
        <div className="landing-right">
          <div className="landing-spatial-card">
            <div className="spatial-card-header">
              <span className="spatial-env-label">SPATIAL ENVIRONMENT</span>
              <div className="spatial-card-title-row">
                <span className="spatial-title">Kinematic Core 4×20</span>
                <span className="spatial-live-badge">
                  <span className="badge-dot green" /> LIVE DISPATCH
                </span>
              </div>
            </div>

            {/* Elevator shaft SVG */}
            <div className="spatial-shaft-area">
              <LandingElevatorSVG />
            </div>

            {/* Bottom metric bar */}
            <div className="spatial-metric-bar">
              <div className="spatial-metric">
                <span className="spatial-metric-label">POLICY STATE</span>
                <span className="spatial-metric-val teal">OPTIMAL</span>
              </div>
              <div className="spatial-metric">
                <span className="spatial-metric-label">ACTIVE REQ.</span>
                <span className="spatial-metric-val">24 QUEUED</span>
              </div>
              <div className="spatial-metric">
                <span className="spatial-metric-label">EST. ENERGY</span>
                <span className="spatial-metric-val">-18.4 kWh</span>
              </div>
              <div className="spatial-metric">
                <span className="spatial-metric-label">DISPATCH TICK</span>
                <span className="spatial-metric-val">+5,292</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 3 feature cards at bottom ── */}
      <section className="landing-features">
        <div className="landing-feature-card">
          <span className="lf-icon">⊞</span>
          <span className="lf-num">01 / POLICY</span>
          <h3 className="lf-title">Evaluate — Improve — Converge</h3>
          <p className="lf-desc">
            Continuous policy iteration updates optimal dispatch curves based on
            spatial flow patterns, passenger batch density, and kinematics.
          </p>
          <div className="lf-tags">
            <span>MODEL CLASS</span><span>MARKOV DECISION OPTIMA</span>
          </div>
        </div>

        <div className="landing-feature-card">
          <span className="lf-icon">⊡</span>
          <span className="lf-num">02 / SIMULATION</span>
          <h3 className="lf-title">Dynamic Demand — Adaptive Dispatch</h3>
          <p className="lf-desc">
            Generative passenger load scenarios pressure-test vertical kinematic
            paths, reducing total round-trip latency and idle cab stationary cost.
          </p>
          <div className="lf-tags">
            <span>SIMULATION TICK</span><span>REAL-TIME HARDWARE HIL</span>
          </div>
        </div>

        <div className="landing-feature-card">
          <span className="lf-icon">⊛</span>
          <span className="lf-num">03 / AUDIT</span>
          <h3 className="lf-title">Every Decision — 100% Traceable</h3>
          <p className="lf-desc">
            Deterministic state logs provide transparency for structural safety
            compliance, energy verification, and verifiable dispatch rationale.
          </p>
          <div className="lf-tags">
            <span>VERIFICATION AUDIT</span><span>ISO-COMPLIANT LOGS</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>ELEVATE</span>
        <span className="footer-quote">"Higher intelligence for a kinder tomorrow."</span>
        <span>© ELEVATE ADAPTIVE INTELLIGENCE · DEPLOYED FOR PHYSICAL SYSTEMS</span>
      </footer>
    </div>
  );
}

/** Inline SVG elevator shaft visualization for the landing spatial card */
function LandingElevatorSVG() {
  return (
    <svg viewBox="0 0 580 280" fill="none" className="landing-shaft-svg">
      {/* Floor guide lines */}
      {[20, 16, 12, 8, 4, 1].map((fl, i) => {
        const y = 14 + i * 46;
        return (
          <g key={fl}>
            <text x="12" y={y + 4} fill="#A8A19B" fontSize="10" fontFamily="sans-serif">{fl > 9 ? fl : '0' + fl}</text>
            <line x1="38" y1={y} x2="560" y2={y} stroke="#E8E0D8" strokeWidth="0.8" strokeDasharray="4 3" />
          </g>
        );
      })}

      {/* 4 shaft tracks */}
      {[100, 210, 330, 450].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="270" stroke="#D4CCC4" strokeWidth="1.2" />
      ))}

      {/* E1 at F05 going UP — blush */}
      <rect x="79" y="190" width="42" height="52" rx="10" fill="#F4C7C355" stroke="#F4C7C3" strokeWidth="1.5" />
      <text x="100" y="213" fill="#292727" fontSize="13" fontWeight="bold" textAnchor="middle">↑</text>
      <text x="100" y="229" fill="#77706B" fontSize="9" textAnchor="middle">F05</text>

      {/* E2 at F16 going DOWN — lavender */}
      <rect x="189" y="10" width="42" height="52" rx="10" fill="#DCCFEA55" stroke="#DCCFEA" strokeWidth="1.5" />
      <text x="210" y="33" fill="#292727" fontSize="13" fontWeight="bold" textAnchor="middle">↓</text>
      <text x="210" y="49" fill="#77706B" fontSize="9" textAnchor="middle">F16</text>

      {/* E3 at F09 going UP — mint */}
      <rect x="309" y="148" width="42" height="52" rx="10" fill="#C8E5D455" stroke="#C8E5D4" strokeWidth="1.5" />
      <text x="330" y="171" fill="#292727" fontSize="13" fontWeight="bold" textAnchor="middle">↑</text>
      <text x="330" y="187" fill="#77706B" fontSize="9" textAnchor="middle">F09</text>

      {/* E4 at F12 going DOWN — butter */}
      <rect x="429" y="96" width="42" height="52" rx="10" fill="#F5E6A866" stroke="#F5E6A8" strokeWidth="1.5" />
      <text x="450" y="119" fill="#292727" fontSize="13" fontWeight="bold" textAnchor="middle">↓</text>
      <text x="450" y="135" fill="#77706B" fontSize="9" textAnchor="middle">F12</text>

      {/* Request particles */}
      <circle cx="155" cy="82"  r="5" fill="#F4C7C3" opacity="0.85" />
      <circle cx="270" cy="155" r="5" fill="#F7C9A9" opacity="0.85" />
      <circle cx="390" cy="60"  r="5" fill="#DCCFEA" opacity="0.85" />
      <circle cx="510" cy="205" r="5" fill="#C8E5D4" opacity="0.85" />

      {/* Shaft labels */}
      {['E1','E2','E3','E4'].map((lbl, i) => (
        <text key={lbl} x={[100,210,330,450][i]} y="280" fill="#A8A19B" fontSize="11" fontWeight="600" textAnchor="middle">{lbl}</text>
      ))}
    </svg>
  );
}
