import React from 'react';
import type { Connector, Wire, ConnectingState } from '../types';
import { connSize, getConnDef } from '../utils/geometry';
import { PIN_SCALE, PIN_OUTER_PAD } from '../constants';

interface NodeProps {
  connector: Connector;
  wires: Wire[];
  isSelected: boolean;
  connecting: ConnectingState | null;
  onPointerDown: (e: React.PointerEvent, connId: string) => void;
  onPinClick: (connId: string, pinIdx: number) => void;
}

const BORDER = 2;
const CORNER = 2;

function getPinBg(state: string, wireColor?: string): string {
  if (state === 'occupied' || state === 'pair') return wireColor ?? '#ff8c42';
  if (state === 'active')    return '#1a3a5a';
  if (state === 'available') return '#1a3a2a';
  return '#0d1018';
}

// ── Terminal ──────────────────────────────────────────────────────
const TerminalNode: React.FC<{
  connector: Connector;
  wires: Wire[];
  isSelected: boolean;
  connecting: ConnectingState | null;
  onPointerDown: (e: React.PointerEvent, connId: string) => void;
  onPinClick: (connId: string, pinIdx: number) => void;
}> = ({ connector, wires, isSelected, onPointerDown, onPinClick }) => {
  const R = 38;
  const pin = connector.pins[0];
  const isOccupied  = pin?.state === 'occupied';
  const isActive    = pin?.state === 'active';
  const isAvailable = pin?.state === 'available';
  const wire = isOccupied && pin.wireId ? wires.find((w) => w.id === pin.wireId) : null;
  const ringColor = wire ? wire.color : isActive ? '#3eb8ff' : isAvailable ? '#3ddc84' : '#888';

  return (
    <g transform={`translate(${connector.x},${connector.y})`} style={{ cursor: 'grab' }}
      onPointerDown={(e) => onPointerDown(e, connector.id)}>
      <defs>
        <filter id={`tshadow_${connector.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation={isSelected ? 8 : 3}
            floodColor={isSelected ? '#3eb8ff' : '#000'} floodOpacity={isSelected ? 0.8 : 0.5} />
        </filter>
      </defs>
      <circle r={R} fill="#111318" stroke={isSelected ? '#3eb8ff' : ringColor}
        strokeWidth={isSelected ? 3 : 2.5} filter={`url(#tshadow_${connector.id})`} />
      <circle r={R * 0.62} fill="#0a0c10" stroke={ringColor}
        strokeWidth={isOccupied || isActive || isAvailable ? 3 : 1.5}
        onClick={(e) => { e.stopPropagation(); onPinClick(connector.id, 0); }}
        style={{ cursor: 'crosshair' }} />
      {(isActive || isAvailable) && (
        <circle r={R * 0.62} fill="none"
          stroke={isActive ? '#3eb8ff' : '#3ddc84'} strokeWidth={6} opacity={0.3}
          style={{ pointerEvents: 'none' }} />
      )}
      <text x={0} y={connector.label ? -5 : 0} textAnchor="middle"
        dominantBaseline={connector.label ? 'auto' : 'middle'}
        fontSize={15} fontFamily="'JetBrains Mono', monospace" fontWeight="700"
        fill={isOccupied ? ringColor : '#c8d4f0'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {connector.num}
      </text>
      {connector.label && (
        <text x={0} y={9} textAnchor="middle" dominantBaseline="hanging"
          fontSize={10} fontFamily="'JetBrains Mono', monospace" fill="#8090b0"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {connector.label}
        </text>
      )}
    </g>
  );
};

// ── Main connector ────────────────────────────────────────────────
const NodeComponent: React.FC<NodeProps> = ({
  connector, wires, isSelected, connecting, onPointerDown, onPinClick,
}) => {
  const def = getConnDef(connector.libId);

  if (connector.libId === 'terminal') {
    return <TerminalNode connector={connector} wires={wires} isSelected={isSelected}
      connecting={connecting} onPointerDown={onPointerDown} onPinClick={onPinClick} />;
  }

  const { w, h } = connSize(connector);
  const bodyH = h - (def.lock ? 14 : 0);
  const totalPins = def.rows * def.cols;

  const gridW = w - PIN_OUTER_PAD * 2;
  const gridH = bodyH - PIN_OUTER_PAD * 2;
  const pinW = gridW / def.cols;
  const pinH = gridH / def.rows;
  const gridX = -w / 2 + PIN_OUTER_PAD;
  const gridY = -h / 2 + PIN_OUTER_PAD;

  function getWireForPin(pinIdx: number): Wire | null {
    const pin = connector.pins[pinIdx];
    if (!pin || pin.state !== 'occupied' || !pin.wireId) return null;
    return wires.find((wr) => wr.id === pin.wireId) ?? null;
  }

  return (
    <g
      transform={`translate(${connector.x},${connector.y}) rotate(${connector.rotation})`}
      style={{ cursor: 'grab' }}
      onPointerDown={(e) => onPointerDown(e, connector.id)}
    >
      <defs>
        <filter id={`shadow_${connector.id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation={isSelected ? 10 : 4}
            floodColor={def.color} floodOpacity={isSelected ? 0.9 : 0.5} />
        </filter>
      </defs>

      {/* Корпус */}
      <rect x={-w/2} y={-h/2} width={w} height={bodyH} rx={6} ry={6}
        fill={def.color} filter={`url(#shadow_${connector.id})`} />

      {/* Выделение */}
      {isSelected && (
        <rect x={-w/2} y={-h/2} width={w} height={bodyH} rx={6} ry={6}
          fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} />
      )}

      {/* Герметичный разъём */}
      {def.id === 'grey20s' && (
        <rect x={-w/2+2} y={-h/2+2} width={w-4} height={bodyH-4} rx={5} ry={5}
          fill="none" stroke="#cc5500" strokeWidth={3} />
      )}

      {/* Фон сетки */}
      <rect x={gridX} y={gridY} width={gridW} height={gridH} rx={3} fill="#0d1018" />

      {/* Замок */}
      {def.lock && (
        <rect x={-14} y={h/2 - 14 - (h - bodyH)/2 - 14} width={28} height={12}
          rx={3} ry={3} fill="#e8c547" />
      )}

      {/* Пины */}
      {Array.from({ length: totalPins }, (_, pinIdx) => {
        const row = Math.floor(pinIdx / def.cols);
        const col = pinIdx % def.cols;
        const px = gridX + col * pinW;
        const py = gridY + row * pinH;

        const pin = connector.pins[pinIdx];
        const wire = getWireForPin(pinIdx);
        const state: string = pin?.state ?? 'free';
        const isOccupied  = state === 'occupied' || state === 'pair';
        const isActive    = state === 'active';
        const isAvailable = state === 'available';

        const bgColor = (isOccupied && connecting)
          ? '#3a1010'
          : getPinBg(state, wire?.color);

        const mark   = wire?.mark   ?? '';
        const length = wire?.length ?? 0;
        const hasMark   = mark.length > 0;
        const hasLength = length > 0;

        const markSize = Math.max(7,  Math.min(pinW * 0.30, pinH * 0.34, 14));
        const lenSize  = Math.max(6,  Math.min(pinW * 0.23, pinH * 0.26, 11));
        const idxSize  = Math.max(6,  Math.min(pinW * 0.28, pinH * 0.28, 12));

        const borderStroke =
          isActive      ? '#3eb8ff' :
          isAvailable   ? '#3ddc84' :
          isOccupied    ? 'rgba(255,255,255,0.10)' :
                          'rgba(255,255,255,0.05)';

        return (
          <g key={pinIdx}
            onClick={(e) => { e.stopPropagation(); onPinClick(connector.id, pinIdx); }}
            style={{ cursor: 'crosshair' }}
          >
            {(isActive || isAvailable) && (
              <rect x={px + 1} y={py + 1} width={pinW - 2} height={pinH - 2}
                rx={CORNER} fill={isActive ? '#3eb8ff' : '#3ddc84'} opacity={0.15}
                style={{ pointerEvents: 'none' }} />
            )}

            <rect
              x={px + 1} y={py + 1}
              width={pinW - 2} height={pinH - 2}
              rx={CORNER}
              fill={bgColor}
              stroke={borderStroke}
              strokeWidth={isActive || isAvailable ? 1.5 : 0.5}
            />

            {isOccupied && !connecting && (hasMark || hasLength) ? (
              <>
                {hasMark && (
                  <text
                    x={px + pinW / 2}
                    y={py + pinH / 2 - (hasLength ? lenSize * 0.6 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={markSize}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                    fill="rgba(255,255,255,0.95)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {mark}
                  </text>
                )}
                {hasLength && (
                  <text
                    x={px + pinW / 2}
                    y={py + pinH / 2 + (hasMark ? markSize * 0.65 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={lenSize}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="rgba(200,212,240,0.70)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {length}
                  </text>
                )}
              </>
            ) : (
              <text
                x={px + pinW / 2} y={py + pinH / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={idxSize} fontFamily="monospace"
                fill={isOccupied ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {pinIdx + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Разделители */}
      <g style={{ pointerEvents: 'none' }}>
        {Array.from({ length: def.cols - 1 }, (_, i) => {
          const x = gridX + (i + 1) * pinW;
          return <line key={`v${i}`} x1={x} y1={gridY} x2={x} y2={gridY + gridH}
            stroke="rgba(255,255,255,0.22)" strokeWidth={BORDER} />;
        })}
        {Array.from({ length: def.rows - 1 }, (_, i) => {
          const y = gridY + (i + 1) * pinH;
          return <line key={`h${i}`} x1={gridX} y1={y} x2={gridX + gridW} y2={y}
            stroke="rgba(255,255,255,0.22)" strokeWidth={BORDER} />;
        })}
      </g>

      {/* Номер фишки */}
      <text x={0} y={h/2 - (def.lock ? 2 : -2) - 14}
        textAnchor="middle" dominantBaseline="auto"
        fontSize={11} fontFamily="'Manrope', sans-serif" fontWeight="bold"
        fill="rgba(255,255,255,0.75)"
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {connector.num}
      </text>
    </g>
  );
};

export default NodeComponent;
