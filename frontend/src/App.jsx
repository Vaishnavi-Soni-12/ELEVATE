import React, { useState, useEffect } from 'react';
import AppShell from './components/AppShell.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LaboratoryPage from './pages/LaboratoryPage.jsx';
import SimulationPage from './pages/SimulationPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import ExperimentPage from './pages/ExperimentPage.jsx';
import ConfigModal from './components/ConfigModal.jsx';
import { getLaboratoryState } from './services/api.js';

/**
 * ELEVATE: Root Application Controller
 * Manages view transitions. Starts on the Landing Page.
 * Connects directly to FastAPI RL backend.
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // start on landing
  const [laboratoryData, setLaboratoryData] = useState(null);
  const [activePolicy, setActivePolicy] = useState('Policy Iteration');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Pre-fetch lab data in background so it's ready when user enters
  useEffect(() => {
    refreshLabData();
  }, []);

  const refreshLabData = () => {
    getLaboratoryState().then((data) => {
      setLaboratoryData(data);
      if (data?.policyIntelligence?.selectedPolicy) {
        setActivePolicy(data.policyIntelligence.selectedPolicy);
      }
    });
  };

  const handleExit = () => {
    setCurrentPage('landing');
  };

  const handleEnterLaboratory = () => {
    setCurrentPage('laboratory');
  };

  const handleDeployToSimulation = () => {
    setCurrentPage('simulation');
  };

  // ── Landing page ──
  if (currentPage === 'landing') {
    return (
      <div className="app-container">
        <LandingPage
          onEnterLaboratory={handleEnterLaboratory}
          onViewSystem={handleEnterLaboratory}
        />
      </div>
    );
  }

  // ── Loading guard — only if lab data isn't ready yet and user navigated away from landing ──
  if (!laboratoryData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-secondary)',
        fontSize: 13,
        letterSpacing: '0.08em',
        background: 'var(--bg-canvas)',
      }}>
        Initializing ELEVATE Intelligent Laboratory...
      </div>
    );
  }

  // ── AppShell pages ──
  return (
    <>
      <AppShell
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        onExit={handleExit}
        onOpenConfig={() => setIsConfigOpen(true)}
      >
        {currentPage === 'laboratory' && (
          <LaboratoryPage
            laboratoryData={laboratoryData}
            onDeployToSimulation={handleDeployToSimulation}
            onOpenFullAudit={() => setCurrentPage('audit')}
            onElevatorClick={(elv) => {
              console.log('Elevator inspected:', elv);
            }}
          />
        )}

        {currentPage === 'simulation' && (
          <SimulationPage
            activePolicy={activePolicy}
            elevators={laboratoryData.elevators}
            floors={laboratoryData.building.floors}
            trafficPattern={laboratoryData.building.trafficState}
          />
        )}

        {currentPage === 'audit' && (
          <AuditPage />
        )}

        {currentPage === 'experiment' && (
          <ExperimentPage
            onExperimentComplete={(res) => {
              console.log('Experiment completed:', res);
            }}
          />
        )}
      </AppShell>

      {/* Dynamic Building & RL Architecture Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigApplied={(configResult) => {
          refreshLabData();
          if (configResult?.algorithm_selected) {
            const readable = configResult.algorithm_selected.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            setActivePolicy(readable);
          }
        }}
      />
    </>
  );
}
