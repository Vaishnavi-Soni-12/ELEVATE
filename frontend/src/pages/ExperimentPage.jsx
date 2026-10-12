import React, { useState } from 'react';
import { runExperimentBenchmark, exportCSV, exportJSON } from '../services/api.js';

/**
 * ExperimentPage: Configuration matrix for multi-elevator MDP experiments
 * Meets Section 18 requirements
 */
export default function ExperimentPage({ onExperimentComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  // Configuration state
  const [building, setBuilding] = useState({
    floors: 20,
    elevators: 4,
    capacity: 14,
    travelTime: 1.2,
    doorTime: 2.0
  });

  const [passengerModel, setPassengerModel] = useState({
    arrivalRate: 2.5,
    groupSize: 1.2,
    distribution: 'Poisson'
  });

  const [trafficPattern, setTrafficPattern] = useState('Morning Peak');

  const [dynamicConditions, setDynamicConditions] = useState({
    trafficIncrease: false,
    trafficDecrease: false,
    highDemandFloor: 15,
    elevatorFailure: 'None'
  });

  const [rlParams, setRlParams] = useState({
    gamma: 0.95,
    convergenceThreshold: '1e-4',
    maxIterations: 50,
    episodes: 2000,
    randomSeed: 42,
    explorationStrategy: 'ε-Greedy'
  });

  const [objectiveWeights, setObjectiveWeights] = useState({
    waitingTime: 40,
    travelTime: 25,
    energy: 15,
    fairness: 10,
    unserved: 10
  });

  const handleRun = async () => {
    setIsRunning(true);
    const res = await runExperimentBenchmark({
      building,
      passengerModel,
      trafficPattern,
      dynamicConditions,
      rlParams,
      objectiveWeights
    });
    setResults(res);
    setIsRunning(false);
    if (onExperimentComplete) onExperimentComplete(res);
  };

  return (
    <div className="experiment-view-container page-transition-wrap">
      {/* Header & Primary Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            RL EXPERIMENT LABORATORY
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Configure building parameters, traffic modes, objective weights, and train adaptive policies.
          </p>
        </div>

        <button
          className="btn-primary-cta"
          onClick={handleRun}
          disabled={isRunning}
          style={{ opacity: isRunning ? 0.7 : 1 }}
        >
          <span>{isRunning ? 'EVALUATING POLICIES...' : 'RUN EXPERIMENT'}</span>
          <span>→</span>
        </button>
      </div>

      {/* 6-Module Spacious Configuration Bento Grid */}
      <div className="experiment-grid">
        {/* Module 1: BUILDING */}
        <div className="config-section-card">
          <span className="config-section-title">1. Building Configuration</span>
          <div className="config-field">
            <label className="config-field-label">
              <span>Floors:</span>
              <span>{building.floors}</span>
            </label>
            <input
              type="range"
              min="5"
              max="40"
              value={building.floors}
              onChange={(e) => setBuilding({ ...building, floors: Number(e.target.value) })}
              className="config-slider"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">
              <span>Elevator Shafts:</span>
              <span>{building.elevators}</span>
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={building.elevators}
              onChange={(e) => setBuilding({ ...building, elevators: Number(e.target.value) })}
              className="config-slider"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">Cab Capacity (Persons):</label>
            <input
              type="number"
              value={building.capacity}
              onChange={(e) => setBuilding({ ...building, capacity: Number(e.target.value) })}
              className="config-input"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">Travel Time Per Floor (s):</label>
            <input
              type="number"
              step="0.1"
              value={building.travelTime}
              onChange={(e) => setBuilding({ ...building, travelTime: Number(e.target.value) })}
              className="config-input"
            />
          </div>
        </div>

        {/* Module 2: PASSENGER MODEL */}
        <div className="config-section-card">
          <span className="config-section-title">2. Passenger Model</span>
          <div className="config-field">
            <label className="config-field-label">
              <span>Arrival Rate (passengers/min):</span>
              <span>{passengerModel.arrivalRate}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={passengerModel.arrivalRate}
              onChange={(e) => setPassengerModel({ ...passengerModel, arrivalRate: Number(e.target.value) })}
              className="config-slider"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">Average Group Size:</label>
            <input
              type="number"
              step="0.1"
              value={passengerModel.groupSize}
              onChange={(e) => setPassengerModel({ ...passengerModel, groupSize: Number(e.target.value) })}
              className="config-input"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">Origin/Destination Distribution:</label>
            <select
              value={passengerModel.distribution}
              onChange={(e) => setPassengerModel({ ...passengerModel, distribution: e.target.value })}
              className="config-select"
            >
              <option value="Poisson">Poisson Distribution</option>
              <option value="Uniform">Uniform Random</option>
              <option value="Gaussian">Gaussian Peak Clusters</option>
            </select>
          </div>
        </div>

        {/* Module 3: TRAFFIC PATTERN */}
        <div className="config-section-card">
          <span className="config-section-title">3. Traffic Pattern</span>
          <div className="config-field">
            <label className="config-field-label">Active Scenario Profile:</label>
            <select
              value={trafficPattern}
              onChange={(e) => setTrafficPattern(e.target.value)}
              className="config-select"
            >
              <option value="Morning Peak">Morning Peak (80% Upward from F1)</option>
              <option value="Evening Peak">Evening Peak (75% Downward to F1)</option>
              <option value="Uniform">Uniform Random (Random Floors)</option>
              <option value="Lunch">Lunch Hour (Inter-floor Cafeteria)</option>
              <option value="Event">Event Mode (Concentrated Floor)</option>
              <option value="Custom">Custom MDP State Matrix</option>
            </select>
          </div>
        </div>

        {/* Module 4: DYNAMIC CONDITIONS */}
        <div className="config-section-card">
          <span className="config-section-title">4. Dynamic Conditions</span>
          <div className="config-field">
            <label className="config-field-label">Simulate Elevator Failure:</label>
            <select
              value={dynamicConditions.elevatorFailure}
              onChange={(e) => setDynamicConditions({ ...dynamicConditions, elevatorFailure: e.target.value })}
              className="config-select"
            >
              <option value="None">None (All Online)</option>
              <option value="E1">Elevator 1 Offline (Maintenance)</option>
              <option value="E2">Elevator 2 Offline (Maintenance)</option>
              <option value="E3">Elevator 3 Offline (Maintenance)</option>
            </select>
          </div>

          <div className="config-field">
            <label className="config-field-label">High Demand Target Floor:</label>
            <input
              type="number"
              min="1"
              max={building.floors}
              value={dynamicConditions.highDemandFloor}
              onChange={(e) => setDynamicConditions({ ...dynamicConditions, highDemandFloor: Number(e.target.value) })}
              className="config-input"
            />
          </div>
        </div>

        {/* Module 5: RL HYPERPARAMETERS */}
        <div className="config-section-card">
          <span className="config-section-title">5. RL Parameters (MDP)</span>
          <div className="config-field">
            <label className="config-field-label">
              <span>Discount Factor γ (Gamma):</span>
              <span>{rlParams.gamma}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={rlParams.gamma}
              onChange={(e) => setRlParams({ ...rlParams, gamma: Number(e.target.value) })}
              className="config-slider"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">Max Iterations:</label>
            <input
              type="number"
              value={rlParams.maxIterations}
              onChange={(e) => setRlParams({ ...rlParams, maxIterations: Number(e.target.value) })}
              className="config-input"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">Exploration Strategy:</label>
            <select
              value={rlParams.explorationStrategy}
              onChange={(e) => setRlParams({ ...rlParams, explorationStrategy: e.target.value })}
              className="config-select"
            >
              <option value="ε-Greedy">ε-Greedy with Linear Decay</option>
              <option value="Boltzmann">Boltzmann Temperature Softmax</option>
              <option value="UCB">Upper Confidence Bound (UCB1)</option>
            </select>
          </div>
        </div>

        {/* Module 6: OBJECTIVE WEIGHTS */}
        <div className="config-section-card">
          <span className="config-section-title">6. Reward Function Weights</span>
          <div className="config-field">
            <label className="config-field-label">
              <span>Waiting Time Penalty (α):</span>
              <span>{objectiveWeights.waitingTime}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="70"
              value={objectiveWeights.waitingTime}
              onChange={(e) => setObjectiveWeights({ ...objectiveWeights, waitingTime: Number(e.target.value) })}
              className="config-slider"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">
              <span>Energy Efficiency (γ):</span>
              <span>{objectiveWeights.energy}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={objectiveWeights.energy}
              onChange={(e) => setObjectiveWeights({ ...objectiveWeights, energy: Number(e.target.value) })}
              className="config-slider"
            />
          </div>

          <div className="config-field">
            <label className="config-field-label">
              <span>Fairness / Max Wait (δ):</span>
              <span>{objectiveWeights.fairness}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="40"
              value={objectiveWeights.fairness}
              onChange={(e) => setObjectiveWeights({ ...objectiveWeights, fairness: Number(e.target.value) })}
              className="config-slider"
            />
          </div>
        </div>
      </div>

      {/* Benchmark Results Display */}
      {results && (
        <div className="config-section-card page-transition-wrap" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="config-section-title" style={{ marginBottom: 0 }}>Evaluation Benchmark Results</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-exit"
                style={{ fontSize: 11 }}
                onClick={() => exportCSV(
                  results.comparison.map(r => ({
                    algorithm: r.algorithm, avg_wait: r.avgWaitTime,
                    avg_travel: r.avgTravelTime, energy_j: r.energyUnits,
                    served_rate: r.servedRate, fairness: r.fairnessIndex,
                    is_best: r.isBest ? 'YES' : 'NO'
                  })),
                  `elevate_benchmark_${Date.now()}.csv`
                )}
              >
                Export CSV ↓
              </button>
              <button
                className="btn-exit"
                style={{ fontSize: 11 }}
                onClick={() => exportJSON(results, `elevate_benchmark_${Date.now()}.json`)}
              >
                Export JSON ↓
              </button>
            </div>
          </div>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Avg Wait Time</th>
                <th>Avg Travel Time</th>
                <th>Energy (Joules)</th>
                <th>Served Rate</th>
                <th>Fairness Index</th>
              </tr>
            </thead>
            <tbody>
              {results.comparison.map((item) => (
                <tr key={item.algorithm} style={{ background: item.isBest ? '#FAF5EE' : 'transparent' }}>
                  <td style={{ fontWeight: item.isBest ? 700 : 500, color: item.isBest ? '#2E8B57' : 'inherit' }}>
                    {item.algorithm} {item.isBest && '★ OPTIMAL'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.avgWaitTime}</td>
                  <td>{item.avgTravelTime}</td>
                  <td>{item.energyUnits} J</td>
                  <td style={{ color: item.isBest ? '#2E8B57' : 'inherit', fontWeight: 600 }}>{item.servedRate}</td>
                  <td>{item.fairnessIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
