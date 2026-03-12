import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { HarnessNode, HarnessEdge, Viewport, Connector, Point } from '../types';

interface HarnessCanvasProps {
  nodes: HarnessNode[];
  edges: HarnessEdge[];
  connectors: Connector[];
  viewport: Viewport;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  highlightedConnectorId: string | null;
  connectingFrom: string | null;
  onViewportChange: (vp: Partial<Viewport>) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onNodeClick: (id: string) => void;
  onCanvasClick: (x: number, y: number) => void;
}

const NODE_W = 72;
const NODE_H = 40;
const JUNC_W = 36;
const JUNC_H = 36;

const HarnessCanvas: React.FC<HarnessCanvasProps> = ({
  nodes, edges, connectors, viewport,
  selectedNodeId, selectedEdgeId, highlightedConnectorId, connectingFrom,
  onViewportChange, onMoveNode, onSelectNode, onSelectEdge, onNodeClick, onCanvasClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 300 });
  const [mouseWorld, setMouseWorld] = useState<Point | null>(null);

  const dragRef = useRef<{ nodeId: string; offX: number; offY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startVX: number; startVY: number } | null>(null);

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

  const getNodeRect = (node: HarnessNode) => {
    const w = node.type === 'junction' ? JUNC_W : NODE_W;
    const h = node.type === 'junction' ? JUNC_H : NODE_H;
    return { w, h };
  };

  const hitTestNode = (wx: number, wy: number): HarnessNode | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const { w, h } = getNodeRect(n);
      if (wx >= n.x - w / 2 && wx <= n.x + w / 2 && wy >= n.y - h / 2 && wy <= n.y + h / 2) {
        return n;
      }
    }
    return null;
  };

  const hitTestEdge = (wx: number, wy: number): HarnessEdge | null => {
    const THRESH = 8;
    for (const edge of edges) {
      const from = nodes.find((n) => n.id === edge.fromId);
      const to = nodes.find((n) => n.id === edge.toId);
      if (!from || !to) continue;
      // Distance from point to line segment
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((wx - from.x) * dx + (wy - from.y) * dy) / len2));
      const px = from.x + t * dx - wx;
      const py = from.y + t * dy - wy;
      if (Math.sqrt(px * px + py * py) < THRESH) return edge;
    }
    return null;
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || e.button === 2) {
        panRef.current = { startX: e.clientX, startY: e.clientY, startVX: viewport.x, startVY: viewport.y };
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        return;
      }
      if (e.button !== 0) return;

      const world = screenToWorld(e.clientX, e.clientY);

      // Node hit
      const node = hitTestNode(world.x, world.y);
      if (node) {
        if (connectingFrom) {
          onNodeClick(node.id);
          return;
        }
        onSelectNode(node.id);
        dragRef.current = { nodeId: node.id, offX: world.x - node.x, offY: world.y - node.y };
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        return;
      }

      // Edge hit
      const edge = hitTestEdge(world.x, world.y);
      if (edge) {
        onSelectEdge(edge.id);
        return;
      }

      // Empty canvas
      onSelectNode(null);
      onSelectEdge(null);
      if (!connectingFrom) {
        onCanvasClick(world.x, world.y);
      }
    },
    [viewport, connectingFrom, nodes, edges, screenToWorld, onSelectNode, onSelectEdge, onNodeClick, onCanvasClick]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const world = screenToWorld(e.clientX, e.clientY);
      setMouseWorld(world);

      if (panRef.current) {
        const { startX, startY, startVX, startVY } = panRef.current;
        onViewportChange({ x: startVX + (e.clientX - startX), y: startVY + (e.clientY - startY) });
        return;
      }

      if (dragRef.current) {
        onMoveNode(dragRef.current.nodeId, world.x - dragRef.current.offX, world.y - dragRef.current.offY);
      }
    },
    [screenToWorld, onViewportChange, onMoveNode]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    panRef.current = null;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.2, Math.min(4, viewport.scale * factor));
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

  // Ghost line while connecting
  let ghostLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (connectingFrom && mouseWorld) {
    const fromNode = nodes.find((n) => n.id === connectingFrom);
    if (fromNode) {
      ghostLine = { x1: fromNode.x, y1: fromNode.y, x2: mouseWorld.x, y2: mouseWorld.y };
    }
  }

  return (
    <svg
      ref={svgRef}
      width={size.w}
      height={size.h}
      style={{ position: 'absolute', inset: 0, touchAction: 'none', userSelect: 'none', cursor: connectingFrom ? 'crosshair' : 'default' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Grid dots */}
      <defs>
        <pattern
          id="harness-grid"
          x={viewport.x % (20 * viewport.scale)}
          y={viewport.y % (20 * viewport.scale)}
          width={20 * viewport.scale}
          height={20 * viewport.scale}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={10 * viewport.scale}
            cy={10 * viewport.scale}
            r={Math.max(0.4, viewport.scale * 0.5)}
            fill="#252d3d"
          />
        </pattern>
      </defs>
      <rect width={size.w} height={size.h} fill="url(#harness-grid)" />

      <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.scale})`}>

        {/* Edges */}
        {edges.map((edge) => {
          const from = nodes.find((n) => n.id === edge.fromId);
          const to = nodes.find((n) => n.id === edge.toId);
          if (!from || !to) return null;
          const isSelected = selectedEdgeId === edge.id;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          const hasLabel = edge.conduitType || edge.length > 0;

          return (
            <g key={edge.id} onClick={(e) => { e.stopPropagation(); onSelectEdge(edge.id); }} style={{ cursor: 'pointer' }}>
              {/* Hit target */}
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={14} />
              {/* Glow */}
              {isSelected && (
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="#3eb8ff" strokeWidth={6} strokeOpacity={0.3} />
              )}
              {/* Line */}
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isSelected ? '#3eb8ff' : '#5a7080'}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              {/* Label */}
              {hasLabel && (
                <g>
                  <rect
                    x={mx - 26}
                    y={my - 13}
                    width={52}
                    height={26}
                    rx={3}
                    fill="#111318"
                    stroke="#252d3d"
                    strokeWidth={1}
                  />
                  {edge.conduitType && (
                    <text x={mx} y={my - 2} textAnchor="middle" fontSize={9}
                      fontFamily="'JetBrains Mono', monospace" fill="#8090b0">
                      {edge.conduitType}
                    </text>
                  )}
                  {edge.length > 0 && (
                    <text x={mx} y={my + 9} textAnchor="middle" fontSize={10}
                      fontFamily="'JetBrains Mono', monospace" fill="#c8d4f0" fontWeight="600">
                      {edge.length} см
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Ghost connecting line */}
        {ghostLine && (
          <line
            x1={ghostLine.x1} y1={ghostLine.y1} x2={ghostLine.x2} y2={ghostLine.y2}
            stroke="rgba(62,184,255,0.6)" strokeWidth={2}
            strokeDasharray="6 4"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Nodes */}
        {nodes.map((node) => {
          const { w, h } = getNodeRect(node);
          const isSelected = selectedNodeId === node.id;
          const isConnecting = connectingFrom === node.id;
          // Find linked connector
          const linkedConn = node.connectorId
            ? connectors.find((c) => c.id === node.connectorId)
            : null;
          const isHighlighted = linkedConn && highlightedConnectorId === linkedConn.id;
          const isJunction = node.type === 'junction';

          let borderColor = '#303a50';
          let borderWidth = 1.5;
          if (isSelected || isConnecting) { borderColor = '#3eb8ff'; borderWidth = 2.5; }
          if (isHighlighted) { borderColor = '#f0c040'; borderWidth = 3; }

          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              style={{ cursor: 'grab' }}
              onClick={(e) => { e.stopPropagation(); if (connectingFrom) onNodeClick(node.id); else onSelectNode(node.id); }}
            >
              {/* Highlight glow */}
              {isHighlighted && (
                <rect
                  x={-w / 2 - 4} y={-h / 2 - 4}
                  width={w + 8} height={h + 8}
                  rx={isJunction ? 4 : 6}
                  fill="rgba(240,192,64,0.15)"
                  stroke="#f0c040"
                  strokeWidth={1}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Body */}
              <rect
                x={-w / 2} y={-h / 2}
                width={w} height={h}
                rx={isJunction ? 4 : 6}
                fill={isJunction ? '#1a2030' : '#0d1a28'}
                stroke={borderColor}
                strokeWidth={borderWidth}
              />

              {/* Junction: just a big bold letter */}
              {isJunction && (
                <text
                  x={0} y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={18}
                  fontFamily="'Manrope', sans-serif"
                  fontWeight="700"
                  fill="#c8d4f0"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label}
                </text>
              )}

              {/* Connector node: number + optional linked indicator */}
              {!isJunction && (
                <>
                  <text
                    x={0} y={linkedConn ? -4 : 0}
                    textAnchor="middle"
                    dominantBaseline={linkedConn ? 'auto' : 'middle'}
                    fontSize={14}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                    fill={isHighlighted ? '#f0c040' : '#c8d4f0'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label}
                  </text>
                  {linkedConn && (
                    <text
                      x={0} y={8}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fontSize={8}
                      fontFamily="'Manrope', sans-serif"
                      fill="#5a9f6a"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      Ф{linkedConn.num}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}

      </g>
    </svg>
  );
};

export default HarnessCanvas;
