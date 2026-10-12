import React from 'react';

/**
 * AppShell: Top navigation header, left sidebar with botanical artwork, and main viewport wrapper
 */
export default function AppShell({
  currentPage,
  onNavigate,
  onExit,
  onOpenConfig,
  children
}) {
  return (
    <div className="app-container">
      {/* Top Global Navigation */}
      <header className="app-header">
        <div className="brand-wrapper" onClick={() => onNavigate('laboratory')}>
          <img src="/favicon.png" alt="ELEVATE Emblem" className="brand-emblem-img" />
          <div className="brand-text-block">
            <span className="brand-title">ELEVATE</span>
            <span className="brand-subtitle">ADAPTIVE ELEVATOR INTELLIGENCE</span>
          </div>
        </div>

        <div className="header-center-philosophy">
          <span>LEARN</span>
          <span className="bullet">·</span>
          <span>EVALUATE</span>
          <span className="bullet">·</span>
          <span>IMPROVE</span>
          <span className="bullet">·</span>
          <span>MOVE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn-exit"
            onClick={onOpenConfig}
            title="Configure Building & Reinforcement Learning Model"
            style={{ background: 'rgba(0,0,0,0.03)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>CONFIG</span>
          </button>

          <button className="btn-exit" onClick={onExit} title="Return to Landing Page (Preserves State)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>EXIT</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="app-workspace">
        {/* Left Sidebar Navigation */}
        <aside className="sidebar-nav">
          <nav className="sidebar-menu">
            <button
              className={`nav-item ${currentPage === 'laboratory' ? 'active' : ''}`}
              onClick={() => onNavigate('laboratory')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Laboratory</span>
            </button>

            <button
              className={`nav-item ${currentPage === 'simulation' ? 'active' : ''}`}
              onClick={() => onNavigate('simulation')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              <span>Simulation</span>
            </button>

            <button
              className={`nav-item ${currentPage === 'audit' ? 'active' : ''}`}
              onClick={() => onNavigate('audit')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Audit</span>
            </button>

            <button
              className={`nav-item ${currentPage === 'experiment' ? 'active' : ''}`}
              onClick={() => onNavigate('experiment')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M10 2v7.31L4.35 18.2A2 2 0 0 0 6.04 21h11.92a2 2 0 0 0 1.69-2.8L14 9.31V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 9.3a6.5 6.5 0 0 1-4 0" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Experiment</span>
            </button>
          </nav>

          {/* Bottom Sidebar Botanical Art & Editorial Quote */}
          <div className="sidebar-footer">
            {/* Elegant SVG Botanical Branch (Matching the watercolor leaf in sim 1.png) */}
            <svg className="sidebar-botanical-art" viewBox="0 0 100 130" fill="none">
              <path
                d="M15 125 C 25 90, 45 60, 85 20"
                stroke="#C9DDBB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M32 98 C 15 90, 10 75, 20 60 C 35 70, 36 85, 32 98 Z"
                fill="url(#leafGradBlush)"
                opacity="0.8"
              />
              <path
                d="M48 78 C 30 70, 25 50, 40 38 C 55 48, 52 65, 48 78 Z"
                fill="url(#leafGradSage)"
                opacity="0.8"
              />
              <path
                d="M65 52 C 55 35, 60 20, 75 15 C 85 28, 78 45, 65 52 Z"
                fill="url(#leafGradPeach)"
                opacity="0.75"
              />
              <defs>
                <linearGradient id="leafGradBlush" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F4C7C3" />
                  <stop offset="100%" stopColor="#FFF9F3" />
                </linearGradient>
                <linearGradient id="leafGradSage" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C9DDBB" />
                  <stop offset="100%" stopColor="#FFF9F3" />
                </linearGradient>
                <linearGradient id="leafGradPeach" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F7C9A9" />
                  <stop offset="100%" stopColor="#FFFDF9" />
                </linearGradient>
              </defs>
            </svg>

            <p className="sidebar-quote">
              “Higher intelligence for a kinder tomorrow.”
            </p>

            <span className="sidebar-version">ELEVATE v1.0.0</span>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="main-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
