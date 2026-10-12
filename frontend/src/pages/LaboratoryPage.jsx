import React from 'react';
import EnvironmentVisualization from '../components/EnvironmentVisualization.jsx';
import RLProcessing from '../components/RLProcessing.jsx';
import PolicyIntelligence from '../components/PolicyIntelligence.jsx';
import DecisionAudit from '../components/DecisionAudit.jsx';

/**
 * LaboratoryPage: The central research laboratory dashboard
 * Faithfully implements the 4-module Bento layout from Stitch MCP (sim 1.png)
 */
export default function LaboratoryPage({
  laboratoryData,
  onDeployToSimulation,
  onOpenFullAudit,
  onElevatorClick
}) {
  const {
    building,
    elevators,
    activeRequests,
    algorithms,
    policyIntelligence,
    decisionAudit
  } = laboratoryData;

  return (
    <div className="bento-grid page-transition-wrap">
      {/* 1. ENVIRONMENT (Top Left) */}
      <EnvironmentVisualization
        elevators={elevators}
        activeRequests={activeRequests}
        floors={building.floors}
        trafficState={building.trafficState}
        onElevatorClick={onElevatorClick}
      />

      {/* 2. RL PROCESSING (Top Right) */}
      <RLProcessing
        algorithms={algorithms}
      />

      {/* 3. POLICY INTELLIGENCE (Bottom Left) */}
      <PolicyIntelligence
        policyData={policyIntelligence}
        onDeploy={onDeployToSimulation}
      />

      {/* 4. DECISION AUDIT (Bottom Right) */}
      <DecisionAudit
        auditData={decisionAudit}
        onOpenFullAudit={onOpenFullAudit}
      />
    </div>
  );
}
