import React from 'react';
import type { Wire, Connector } from '../types';
import { getAbsolutePin, buildWirePath, getWireControlPoints, bezierPoint } from '../utils/geometry';

interface WireProps {
  wire: Wire;
  connectors: Connector[];
  isSelected: boolean;
  onClick: (id: string) => void;
}

const WireComponent: React.FC<WireProps> = ({ wire, connectors, isSelected, onClick }) => {
  const fromConn = connectors.find((c) => c.id === wire.fromConn);
  const toConn = connectors.find((c) => c.id === wire.toConn);

  if (!fromConn || !toConn) return null;

  const from = getAbsolutePin(fromConn, wire.fromPin);
  const to = getAbsolutePin(toConn, wire.toPin);
  const pathD = buildWirePath(from, to);
  const { cx1, cy1, cx2, cy2 } = getWireControlPoints(from, to);

  // Midpoint for label
  const mx = bezierPoint(from.x, cx1, cx2, to.x, 0.5);
  const my = bezierPoint(from.y, cy1, cy2, to.y, 0.5);
  const label = [wire.mark, wire.signal].filter(Boolean).join(' · ');

  const strokeWidth = isSelected ? 3 : 2;

  return (
    <g onClick={() => onClick(wire.id)} style={{ cursor: 'pointer' }}>
      {/* Wider invisible hit target */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        strokeLinecap="round"
      />

      {/* Glow layer for selected */}
      {isSelected && (
        <path
          d={pathD}
          fill="none"
          stroke={wire.color}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />
      )}

      {/* Main wire */}
      <path
        d={pathD}
        fill="none"
        stroke={wire.color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Label pill */}
      {label && (
        <g>
          <rect
            x={mx - label.length * 3.5 - 4}
            y={my - 12}
            width={label.length * 7 + 8}
            height={14}
            rx={3}
            fill="rgba(10,12,16,0.82)"
          />
          <text
            x={mx}
            y={my - 2}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={wire.color}
            fontSize={10}
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="600"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

export default WireComponent;
