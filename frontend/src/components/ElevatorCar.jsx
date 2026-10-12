import React from 'react';
import { Direction } from '../types/elevator.js';

/**
 * ElevatorCar: Physical elevator cab representation with real-time Load Balancing Sensor
 * Shows floor position, direction arrow, passenger load bar, and BYPASS indicator when >= 85% full.
 */
export default function ElevatorCar({
  elevator,
  totalFloors = 20,
  stageHeight = 350,
  onClick
}) {
  const cabHeight = 60;
  const usableHeight = stageHeight - cabHeight;
  const floorRatio = Math.max(0, Math.min(1, (elevator.currentFloor - 1) / (totalFloors - 1)));
  const translateY = usableHeight - (floorRatio * usableHeight);

  const renderArrow = () => {
    if (elevator.direction === Direction.UP) return '↑';
    if (elevator.direction === Direction.DOWN) return '↓';
    return '•';
  };

  // Load balancing sensor calculations
  const passengers = typeof elevator.passengers === 'number'
    ? elevator.passengers
    : (Array.isArray(elevator.passengers) ? elevator.passengers.length : 2);
  const capacity = elevator.capacity || 8;
  const loadPct = typeof elevator.load_pct === 'number'
    ? elevator.load_pct
    : Math.min(100, Math.round((passengers / capacity) * 100));
  const isBypass = elevator.is_bypass || loadPct >= 85;

  const loadColor = isBypass ? '#EF4444' : (loadPct > 60 ? '#D97706' : '#2E8B57');

  const bgStyle = {
    background: isBypass
      ? 'linear-gradient(180deg, #FEE2E2 0%, #FECACA 100%)'
      : `linear-gradient(180deg, ${elevator.accentColor}44 0%, ${elevator.accentColor}88 100%)`,
    borderColor: isBypass ? '#EF4444' : `${elevator.accentColor}cc`,
    transform: `translateY(${translateY}px)`,
    boxShadow: isBypass ? '0 0 10px rgba(239, 68, 68, 0.4)' : undefined
  };

  return (
    <div
      className="elevator-cab"
      style={bgStyle}
      onClick={() => onClick && onClick(elevator)}
      title={`${elevator.name}: Floor ${elevator.currentFloor} | Load: ${passengers}/${capacity} pax (${loadPct}%) ${isBypass ? '— [CAPACITY BYPASS ACTIVE]' : ''}`}
    >
      {/* Overload Bypass Badge */}
      {isBypass && (
        <div style={{
          position: 'absolute',
          top: -16,
          background: '#EF4444',
          color: '#fff',
          fontSize: 7.5,
          fontWeight: 800,
          padding: '1px 4px',
          borderRadius: 4,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          BYPASS
        </div>
      )}

      <span className="elevator-direction-arrow">{renderArrow()}</span>
      <span className="elevator-cab-floor">F{String(elevator.currentFloor).padStart(2, '0')}</span>

      {/* Mini Load Balancing Gauge */}
      <div style={{
        width: '80%',
        height: 3.5,
        background: 'rgba(41, 39, 39, 0.15)',
        borderRadius: 2,
        marginTop: 3,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(100, loadPct)}%`,
          height: '100%',
          background: loadColor,
          transition: 'width 0.3s ease, background-color 0.3s ease'
        }} />
      </div>
    </div>
  );
}
