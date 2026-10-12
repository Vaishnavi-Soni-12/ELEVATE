import React, { useRef, useEffect, useState } from 'react';
import { Direction } from '../types/elevator.js';

/**
 * IsometricTowerView: Lightweight 3D Glass Skyscraper Canvas
 * Renders a full 3D isometric view of elevator shafts, moving cabs, floor lines,
 * and passenger demand particles without any heavy 3D dependencies.
 */
export default function IsometricTowerView({
  elevators = [],
  activeRequests = [],
  floors = 20,
  stageHeight = 440
}) {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(0.45); // rotation angle in radians
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, angle: 0 });

  // Mouse interaction for manual rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStartRef.current = { x: e.clientX, angle };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    setAngle(dragStartRef.current.angle + dx * 0.008);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    let animId;
    let currentAngle = angle;

    const render = () => {
      if (autoRotate && !isDragging) {
        currentAngle += 0.003;
        setAngle(currentAngle);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = stageHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.6);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(1, '#FFF9F3');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Camera & Projection Setup
      const cx = width / 2;
      const cy = height * 0.68;
      const towerH = height * 0.52;
      const shaftSpacing = Math.min(65, (width * 0.45) / Math.max(1, elevators.length));
      const cabW = Math.min(32, shaftSpacing * 0.6);
      const cabD = cabW * 0.85;
      const cabH = Math.max(18, towerH / floors * 1.5);

      const cosA = Math.cos(currentAngle);
      const sinA = Math.sin(currentAngle);

      // 3D to 2D projection helper
      const project = (x, y, z) => ({
        px: cx + (x * cosA - y * sinA),
        py: cy + (x * sinA + y * cosA) * 0.42 - z
      });

      // 1. Base Foundation Platform (Hexagonal Glass Slab)
      const baseRadius = (elevators.length * shaftSpacing * 0.7) + 40;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3;
        const bx = Math.cos(theta) * baseRadius;
        const by = Math.sin(theta) * baseRadius;
        const pt = project(bx, by, 0);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.closePath();
      ctx.fillStyle = '#F4EDE4';
      ctx.fill();
      ctx.strokeStyle = '#D8CEBE';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Horizontal Floor Wireframes at Key Intervals
      const keyFloors = [1, Math.round(floors / 4), Math.round(floors / 2), Math.round((floors * 3) / 4), floors];
      keyFloors.forEach((f) => {
        const z = ((f - 1) / Math.max(1, floors - 1)) * towerH;
        ctx.beginPath();
        const p1 = project(-baseRadius * 0.8, -15, z);
        const p2 = project(baseRadius * 0.8, -15, z);
        const p3 = project(baseRadius * 0.8, 15, z);
        const p4 = project(-baseRadius * 0.8, 15, z);
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.lineTo(p3.px, p3.py);
        ctx.lineTo(p4.px, p4.py);
        ctx.closePath();
        ctx.strokeStyle = f === 1 ? 'rgba(46, 139, 87, 0.4)' : 'rgba(41, 39, 39, 0.08)';
        ctx.lineWidth = f === 1 || f === floors ? 1.5 : 1;
        ctx.stroke();

        // Floor Tag
        const tagPt = project(baseRadius * 0.8 + 12, 0, z);
        ctx.font = '600 10px monospace';
        ctx.fillStyle = f === 1 ? '#2E8B57' : '#9E9790';
        ctx.fillText(`F${String(f).padStart(2, '0')}`, tagPt.px, tagPt.py + 3);
      });

      // 3. Transparent Glass Shaft Columns
      elevators.forEach((elv, i) => {
        const sx = (i - (elevators.length - 1) / 2) * shaftSpacing;
        const sy = 0;

        // Draw shaft column guide tracks (vertical lines)
        const bPt = project(sx, sy, 0);
        const tPt = project(sx, sy, towerH);

        ctx.beginPath();
        ctx.moveTo(bPt.px, bPt.py);
        ctx.lineTo(tPt.px, tPt.py);
        ctx.strokeStyle = 'rgba(41, 39, 39, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Shaft label on base
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = '#77706B';
        ctx.textAlign = 'center';
        ctx.fillText(elv.name || `E${elv.id}`, bPt.px, bPt.py + 18);
      });

      // 4. Passenger Request Rings at Floors
      activeRequests.slice(0, 8).forEach((req) => {
        const z = ((req.origin - 1) / Math.max(1, floors - 1)) * towerH;
        const centerPt = project(0, 0, z);
        ctx.beginPath();
        ctx.arc(centerPt.px, centerPt.py, 8, 0, Math.PI * 2);
        ctx.fillStyle = req.color ? `${req.color}88` : '#F4C7C388';
        ctx.fill();
        ctx.strokeStyle = req.color || '#C45A53';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 5. 3D Moving Elevator Cabs (Isometric Cuboids)
      // Sort by depth (Y projected coordinate) for proper occlusion
      const sortedElevators = elevators
        .map((elv, idx) => {
          const sx = (idx - (elevators.length - 1) / 2) * shaftSpacing;
          const sy = 0;
          const depth = sx * sinA + sy * cosA;
          return { elv, idx, sx, sy, depth };
        })
        .sort((a, b) => a.depth - b.depth);

      sortedElevators.forEach(({ elv, sx, sy }) => {
        const z = ((elv.currentFloor - 1) / Math.max(1, floors - 1)) * towerH;
        const color = elv.accentColor || '#DCCFEA';
        const isBypass = elv.is_bypass || (elv.load_pct && elv.load_pct >= 85);

        // Define 8 vertices of the 3D cab cuboid
        const hw = cabW / 2;
        const hd = cabD / 2;

        const v0 = project(sx - hw, sy - hd, z);
        const v1 = project(sx + hw, sy - hd, z);
        const v2 = project(sx + hw, sy + hd, z);
        const v3 = project(sx - hw, sy + hd, z);

        const v4 = project(sx - hw, sy - hd, z + cabH);
        const v5 = project(sx + hw, sy - hd, z + cabH);
        const v6 = project(sx + hw, sy + hd, z + cabH);
        const v7 = project(sx - hw, sy + hd, z + cabH);

        // Top Face
        ctx.beginPath();
        ctx.moveTo(v4.px, v4.py);
        ctx.lineTo(v5.px, v5.py);
        ctx.lineTo(v6.px, v6.py);
        ctx.lineTo(v7.px, v7.py);
        ctx.closePath();
        ctx.fillStyle = isBypass ? '#FFD4D0' : color;
        ctx.fill();
        ctx.strokeStyle = isBypass ? '#EF4444' : '#29272740';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Front Face
        ctx.beginPath();
        ctx.moveTo(v1.px, v1.py);
        ctx.lineTo(v2.px, v2.py);
        ctx.lineTo(v6.px, v6.py);
        ctx.lineTo(v5.px, v5.py);
        ctx.closePath();
        ctx.fillStyle = isBypass ? 'rgba(239, 68, 68, 0.85)' : `${color}CC`;
        ctx.fill();
        ctx.strokeStyle = isBypass ? '#DC2626' : '#29272750';
        ctx.stroke();

        // Side Face
        ctx.beginPath();
        ctx.moveTo(v0.px, v0.py);
        ctx.lineTo(v1.px, v1.py);
        ctx.lineTo(v5.px, v5.py);
        ctx.lineTo(v4.px, v4.py);
        ctx.closePath();
        ctx.fillStyle = isBypass ? 'rgba(220, 38, 38, 0.70)' : `${color}99`;
        ctx.fill();
        ctx.strokeStyle = isBypass ? '#DC2626' : '#29272730';
        ctx.stroke();

        // Floor number & Direction Badge on Cab
        const centerPt = project(sx, sy, z + cabH / 2);
        ctx.font = '700 10.5px monospace';
        ctx.fillStyle = '#292727';
        ctx.textAlign = 'center';
        const arrow = elv.direction === Direction.UP ? '↑' : (elv.direction === Direction.DOWN ? '↓' : '•');
        ctx.fillText(`F${elv.currentFloor}${arrow}`, centerPt.px, centerPt.py + 3);

        // Load Meter Bar above Cab
        const loadPct = elv.load_pct || Math.round(((elv.passengers || 0) / Math.max(1, elv.capacity || 8)) * 100);
        const barW = cabW * 1.2;
        const barH = 4;
        const barPt = project(sx, sy, z + cabH + 6);
        ctx.fillStyle = 'rgba(41, 39, 39, 0.15)';
        ctx.fillRect(barPt.px - barW / 2, barPt.py, barW, barH);
        ctx.fillStyle = isBypass ? '#EF4444' : (loadPct > 60 ? '#D97706' : '#2E8B57');
        ctx.fillRect(barPt.px - barW / 2, barPt.py, (barW * Math.min(100, loadPct)) / 100, barH);

        // Bypass / Full Tag
        if (isBypass) {
          ctx.font = '700 8.5px sans-serif';
          ctx.fillStyle = '#DC2626';
          ctx.fillText('BYPASS', barPt.px, barPt.py - 3);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [elevators, activeRequests, floors, stageHeight, angle, autoRotate, isDragging]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-hairline)'
      }}
    >
      {/* 3D View Toolbar Overlay */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 18,
        right: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(4px)',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border-hairline)'
          }}>
            ◈ 3D ISOMETRIC GLASS TOWER
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Drag mouse to orbit camera
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button
            className="btn-exit"
            style={{ fontSize: 11, padding: '4px 12px' }}
            onClick={() => setAngle((a) => a - 0.25)}
            title="Rotate Left"
          >
            ↺ Left
          </button>
          <button
            className="btn-exit"
            style={{ fontSize: 11, padding: '4px 12px' }}
            onClick={() => setAngle((a) => a + 0.25)}
            title="Rotate Right"
          >
            ↻ Right
          </button>
          <button
            className="btn-exit"
            style={{
              fontSize: 11,
              padding: '4px 12px',
              background: autoRotate ? 'var(--charcoal)' : 'var(--surface-card)',
              color: autoRotate ? '#fff' : 'var(--text-primary)',
              borderColor: autoRotate ? 'var(--charcoal)' : 'var(--border-subtle)'
            }}
            onClick={() => setAutoRotate(!autoRotate)}
          >
            {autoRotate ? '⏸ Orbiting' : '▶ Auto-Orbit'}
          </button>
        </div>
      </div>

      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: stageHeight,
          display: 'block',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Bottom Telemetry Legend */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 18,
        right: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--text-muted)',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span><strong style={{ color: '#2E8B57' }}>● Normal</strong> (&lt;60%)</span>
          <span><strong style={{ color: '#D97706' }}>● High Load</strong> (60-84%)</span>
          <span><strong style={{ color: '#EF4444' }}>● Full / Bypass</strong> (≥85%)</span>
        </div>
        <span>Perspective Angle: {((angle * 180) / Math.PI % 360).toFixed(0)}°</span>
      </div>
    </div>
  );
}
