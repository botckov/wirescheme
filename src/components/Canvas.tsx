import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { Connector, Wire, Viewport, AppMode, ConnectingState, Point } from '../types';
import NodeComponent from './Node';
import WireComponent from './Wire';
import { hitTestConnector, hitTestPin, getAbsolutePin, buildWirePath } from '../utils/geometry';

interface CanvasProps {
  connectors: Connector[];
  wires: Wire[];
  viewport: Viewport;
  mode: AppMode;
  wiresVisible: boolean;
  selectedConnId: string | null;
  selectedWireId: string | null;
  connecting: ConnectingState | null;
  onViewportChange: (vp: Partial<Viewport>) => void;
  onMoveConnector: (id: string, x: number, y: number) => void;
  onSelectConnector: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onPinClick: (connId: string, pinIdx: number) => void;
  onDrop: (libId: string, worldX: number, worldY: number) => void;
}

const GRID_SIZE = 24;

const Canvas: React.FC<CanvasProps> = ({
  connectors, wires, viewport, mode, wiresVisible,
  selectedConnId, selectedWireId, connecting,
  onViewportChange, onMoveConnector, onSelectConnector, onSelectWire, onPinClick, onDrop,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [mouseWorld, setMouseWorld] = useState<Point | null>(null);

  // Drag state (use ref to avoid stale closures in pointer handlers)
  const dragRef = useRef<{ connId: string; offX: number; offY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startVX: number; startVY: number } | null>(null);

  // ── Resize observer ───────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Coordinate helpers ────────────────────────────────────────
  const screenToWorld = useCallback(
    (sx: number, sy: number): Point => {
      const rect = svgRef.current!.getBoundingClientRect();
      return {
        x: (sx - rect.left - viewport.x) / viewport.scale,
        y: (sy - rect.top - viewport.y) / viewport.scale,
      };
    },
    [viewport]
  );

  // ── Pointer events ────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const world = screenToWorld(e.clientX, e.clientY);
      setMouseWorld(world);

      if (panRef.current) {
        const { startX, startY, startVX, startVY } = panRef.current;
        onViewportChange({
          x: startVX + (e.clientX - startX),
          y: startVY + (e.clientY - startY),
        });
        return;
      }

      if (dragRef.current) {
        onMoveConnector(
          dragRef.current.connId,
          world.x - dragRef.current.offX,
          world.y - dragRef.current.offY
        );
      }
    },
    [screenToWorld, onViewportChange, onMoveConnector]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && mode === 'pan')) {
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startVX: viewport.x,
          startVY: viewport.y,
        };
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        return;
      }
      if (e.button !== 0) return;

      const world = screenToWorld(e.clientX, e.clientY);

      // If in connecting mode — handled by pin clicks only
      if (connecting) return;

      // Check pin hit first (small radius)
      const pinHit = hitTestPin(world.x, world.y, connectors);
      if (pinHit) {
        onPinClick(pinHit.connId, pinHit.pinIdx);
        return;
      }

      // Check connector hit
      const conn = hitTestConnector(world.x, world.y, connectors);
      if (conn) {
        onSelectConnector(conn.id);
        dragRef.current = {
          connId: conn.id,
          offX: world.x - conn.x,
          offY: world.y - conn.y,
        };
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        return;
      }

      // Clicked empty canvas — deselect
      onSelectConnector(null);
      onSelectWire(null);
    },
    [mode, viewport, connecting, connectors, screenToWorld, onSelectConnector, onSelectWire, onPinClick]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    panRef.current = null;
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.15, Math.min(4, viewport.scale * factor));
      const rect = svgRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      onViewportChange({
        scale: newScale,
        x: mx - (mx - viewport.x) * (newScale / viewport.scale),
        y: my - (my - viewport.y) * (newScale / viewport.scale),
      });
    },
    [viewport, onViewportChange]
  );

  // ── Drag-and-drop from library panel ─────────────────────────
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const libId = e.dataTransfer.getData('libId');
      if (!libId) return;
      const world = screenToWorld(e.clientX, e.clientY);
      onDrop(libId, world.x, world.y);
    },
    [screenToWorld, onDrop]
  );

  // ── Connecting ghost line ─────────────────────────────────────
  let ghostPath: string | null = null;
  if (connecting && mouseWorld) {
    const fromConn = connectors.find((c) => c.id === connecting.connId);
    if (fromConn) {
      const from = getAbsolutePin(fromConn, connecting.pinIdx);
      ghostPath = buildWirePath(from, mouseWorld);
    }
  }

  const cursor = mode === 'pan' ? (panRef.current ? 'grabbing' : 'grab') : 'default';

  return (
    <svg
      ref={svgRef}
      width={size.w}
      height={size.h}
      style={{
        position: 'absolute',
        inset: 0,
        cursor,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ── Dot grid background ─────────────────────────────── */}
      <defs>
        <pattern
          id="ws-grid-dot"
          x={viewport.x % (GRID_SIZE * viewport.scale)}
          y={viewport.y % (GRID_SIZE * viewport.scale)}
          width={GRID_SIZE * viewport.scale}
          height={GRID_SIZE * viewport.scale}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={GRID_SIZE * viewport.scale / 2}
            cy={GRID_SIZE * viewport.scale / 2}
            r={Math.max(0.5, viewport.scale * 0.6)}
            fill="#252d3d"
          />
        </pattern>
      </defs>
      <rect width={size.w} height={size.h} fill="url(#ws-grid-dot)" />

      {/* ── World transform group ────────────────────────────── */}
      <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.scale})`}>

        {/* Wires (rendered below nodes) */}
        {wiresVisible && wires.map((wire) => (
          <WireComponent
            key={wire.id}
            wire={wire}
            connectors={connectors}
            isSelected={selectedWireId === wire.id}
            onClick={onSelectWire}
          />
        ))}

        {/* Ghost connecting line */}
        {ghostPath && (
          <path
            d={ghostPath}
            fill="none"
            stroke="rgba(62,184,255,0.7)"
            strokeWidth={2 / viewport.scale}
            strokeLinecap="round"
            strokeDasharray={`${6 / viewport.scale} ${4 / viewport.scale}`}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Connectors / Nodes */}
        {connectors.map((conn) => (
          <NodeComponent
            key={conn.id}
            connector={conn}
            wires={wires}
            isSelected={selectedConnId === conn.id}
            connecting={connecting}
            onPointerDown={(e, connId) => {
              if (connecting) return; // handled by pin click
              e.stopPropagation();
              const world = screenToWorld(e.clientX, e.clientY);
              const c = connectors.find((x) => x.id === connId)!;
              onSelectConnector(connId);
              dragRef.current = {
                connId,
                offX: world.x - c.x,
                offY: world.y - c.y,
              };
              (e.target as SVGElement).setPointerCapture(e.pointerId);
            }}
            onPinClick={onPinClick}
          />
        ))}
      </g>
    </svg>
  );
};

export default Canvas;
