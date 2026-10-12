/**
 * ELEVATE — Adaptive Elevator Intelligence
 * Frontend Data Models & Type Definitions
 * 
 * Formal interfaces aligned with Reinforcement Learning & Simulation backends:
 * - EnvironmentState, ElevatorState, PassengerRequest, TrafficState
 * - MDPState, Action, Transition, RewardBreakdown
 * - RLRun, RLAlgorithmResult, Policy, PolicyArtifact
 * - SimulationState, SimulationEvent, AuditEvent
 * - TrustScore, DecisionConfidence, ExperimentConfig, ExperimentResult
 */

export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  IDLE: 'IDLE'
};

export const ElevatorStatus = {
  MOVING: 'MOVING',
  DOORS_OPENING: 'DOORS_OPENING',
  DOORS_OPEN: 'DOORS_OPEN',
  DOORS_CLOSING: 'DOORS_CLOSING',
  IDLE: 'IDLE',
  MAINTENANCE: 'MAINTENANCE'
};

export const TrafficPattern = {
  UNIFORM: 'UNIFORM',
  MORNING_PEAK: 'MORNING_PEAK',
  EVENING_PEAK: 'EVENING_PEAK',
  LUNCH: 'LUNCH',
  EVENT: 'EVENT',
  CUSTOM: 'CUSTOM'
};

export const AlgorithmType = {
  POLICY_ITERATION: 'Policy Iteration',
  VALUE_ITERATION: 'Value Iteration',
  MONTE_CARLO: 'Monte Carlo',
  Q_LEARNING: 'Q-Learning'
};

/**
 * Passenger Request representation
 */
export const createPassengerRequest = ({
  id,
  originFloor,
  destinationFloor,
  direction = destinationFloor > originFloor ? Direction.UP : Direction.DOWN,
  timestamp = Date.now(),
  waitingTime = 0,
  assignedElevator = null,
  served = false
}) => ({
  id,
  originFloor,
  destinationFloor,
  direction,
  timestamp,
  waitingTime,
  assignedElevator,
  served
});

/**
 * Single Elevator State representation
 */
export const createElevatorState = ({
  id,
  name,
  currentFloor = 1,
  targetFloor = 1,
  direction = Direction.IDLE,
  status = ElevatorStatus.IDLE,
  capacity = 12,
  passengers = [],
  doorOpenProgress = 0, // 0 to 1
  energyUsed = 0,
  accentColor = '#F4C7C3'
}) => ({
  id,
  name,
  currentFloor,
  targetFloor,
  direction,
  status,
  capacity,
  passengers,
  doorOpenProgress,
  energyUsed,
  accentColor
});

/**
 * MDP State representation: S = (elevators, pending_requests, traffic_mode)
 */
export const createMDPState = ({
  elevators = [],
  activeRequests = [],
  trafficState = TrafficPattern.MORNING_PEAK,
  timestamp = Date.now()
}) => ({
  elevators: elevators.map(e => ({
    id: e.id,
    floor: e.currentFloor,
    direction: e.direction,
    load: e.passengers?.length || 0
  })),
  pendingRequests: activeRequests.map(r => ({
    id: r.id,
    from: r.originFloor,
    to: r.destinationFloor,
    wait: r.waitingTime
  })),
  trafficState,
  timestamp
});

/**
 * Action representation: a in A(s)
 */
export const createAction = ({
  elevatorId,
  targetFloor,
  assignedRequestId = null,
  actionType = 'DISPATCH'
}) => ({
  elevatorId,
  targetFloor,
  assignedRequestId,
  actionType,
  description: `Assign ${elevatorId} → F${String(targetFloor).padStart(2, '0')}`
});

/**
 * Reward Breakdown: R = -α(wait) - β(travel) - γ(energy) - δ(unserved)
 */
export const createRewardBreakdown = ({
  waitingTimePenalty = 0,
  travelTimePenalty = 0,
  energyPenalty = 0,
  unservedPenalty = 0,
  totalReward = 0
}) => ({
  waitingTimePenalty,
  travelTimePenalty,
  energyPenalty,
  unservedPenalty,
  totalReward
});

/**
 * Decision Audit Event
 */
export const createAuditEvent = ({
  id = `audit-${Date.now()}-${Math.floor(Math.random()*1000)}`,
  timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }),
  stateSummary = {},
  actionSummary = {},
  reward = 0,
  valueDelta = 0,
  nextStateSummary = {},
  policyName = 'Policy Iteration',
  confidence = 'High',
  trustScore = 95.1
}) => ({
  id,
  timestamp,
  stateSummary,
  actionSummary,
  reward,
  valueDelta,
  nextStateSummary,
  policyName,
  confidence,
  trustScore
});

/**
 * Experiment Configuration definition
 */
export const createExperimentConfig = ({
  building = {
    floors: 20,
    elevators: 4,
    capacity: 12,
    travelTimePerFloor: 1.2,
    doorDwellTime: 2.0
  },
  passengerModel = {
    arrivalRate: 2.5, // passengers per minute
    groupSizeMean: 1.2,
    distribution: 'Poisson'
  },
  trafficPattern = TrafficPattern.MORNING_PEAK,
  dynamicConditions = {
    trafficSpike: false,
    highDemandFloor: 15,
    failedElevatorId: null
  },
  rlParameters = {
    gamma: 0.95,
    convergenceThreshold: 0.0001,
    maxIterations: 50,
    episodes: 2000,
    randomSeed: 42,
    explorationStrategy: 'epsilon-greedy'
  },
  objectiveWeights = {
    waitingTime: 0.40,
    travelTime: 0.25,
    energy: 0.15,
    fairness: 0.10,
    unserved: 0.10
  }
}) => ({
  building,
  passengerModel,
  trafficPattern,
  dynamicConditions,
  rlParameters,
  objectiveWeights
});
