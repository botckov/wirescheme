import React from 'react';
import type { Connector, Wire, ConnectingState } from '../types';
import { connSize, getConnDef, getPinLocalPos } from '../utils/geometry';
import { PIN_SCALE, PIN_OUTER_PAD } from '../constants';

interface NodeProps {
  connector: Connector;
  wires: Wire[];
  isSelected: boolean;
  connecting: ConnectingState | null;
  onPointerDown: (e: React.PointerEvent, connId: string) => void;
  onPinClick: (connId: string, pinIdx: number) => void;
}

const PIN_COLORS: Record<string, string> = {
  free:      '#3a4560',
  active:    '#3eb8ff',
  available: '#3ddc84',
  error:     '#ff4d4d',
};

// ── Terminal (клемма) rendering ───────────────────────────────────
const TerminalNode: React.FC<{
  connector: Connector;
  wires: Wire[];
  isSelected: boolean;
  connecting: ConnectingState | null;
  onPointerDown: (e: React.PointerEvent, connId: string) => void;
  onPinClick: (connId: string, pinIdx: number) => void;
}> = ({ connector, wires, isSelected, connecting, onPointerDown, onPinClick }) => {
  const R = 38;
  const pin = connector.pins[0];
  const isOccupied = pin?.state === 'occupied';
  const isActive = pin?.state === 'active';
  const isAvailable = pin?.state === 'available';

  const wire = isOccupied && pin.wireId ? wires.find((w) => w.id === pin.wireId) : null;
  const ringColor = wire ? wire.color : isActive ? '#3eb8ff' : isAvailable ? '#3ddc84' : '#888';

  return (
    <g
      transform={`translate(${connector.x},${connector.y})`}
      style={{ cursor: 'grab' }}
      onPointerDown={(e) => onPointerDown(e, connector.id)}
    >
      <defs>
        <filter id={`tshadow_${connector.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation={isSelected ? 8 : 3}
            floodColor={isSelected ? '#3eb8ff' : '#000'} floodOpacity={isSelected ? 0.8 : 0.5} />
        </filter>
      </defs>

      <circle
        r={R}
        fill="#111318"
        stroke={isSelected ? '#3eb8ff' : ringColor}
        strokeWidth={isSelected ? 3 : 2.5}
        filter={`url(#tshadow_${connector.id})`}
      />

      <circle
        r={R * 0.62}
        fill="#0a0c10"
        stroke={ringColor}
        strokeWidth={isOccupied || isActive || isAvailable ? 3 : 1.5}
        onClick={(e) => { e.stopPropagation(); onPinClick(connector.id, 0); }}
        style={{ cursor: 'crosshair' }}
      />

      {(isActive || isAvailable) && (
        <circle r={R * 0.62} fill="none"
          stroke={isActive ? '#3eb8ff' : '#3ddc84'}
          strokeWidth={6} opacity={0.3}
          style={{ pointerEvents: 'none' }}
        />
      )}

      <text
        x={0} y={connector.label ? -5 : 0}
        textAnchor="middle"
        dominantBaseline={connector.label ? 'auto' : 'middle'}
        fontSize={15}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        fill={isOccupied ? ringColor : '#c8d4f0'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {connector.num}
      </text>

      {connector.label && (
        <text
          x={0} y={9}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
          fill="#8090b0"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {connector.label}
        </text>
      )}
    </g>
  );
};

// ── Regular connector rendering ───────────────────────────────────
const NodeComponent: React.FC<NodeProps> = ({
  connector, wires, isSelected, connecting, onPointerDown, onPinClick,
}) => {
  const def = getConnDef(connector.libId);

  if (connector.libId === 'terminal') {
    return (
      <TerminalNode
        connector={connector} wires={wires} isSelected={isSelected}
        connecting={connecting} onPointerDown={onPointerDown} onPinClick={onPinClick}
      />
    );
  }

  const { w, h } = connSize(connector);
  const bodyH = h - (def.lock ? 14 : 0);
  const pinSize = PIN_SCALE * 0.52;
  const inPad = 6;
  const totalPins = def.rows * def.cols;

  function getPinColor(pinIdx: number): string {
    const pin = connector.pins[pinIdx];
    if (!pin) return '#3a4560';
    const { state, wireId } = pin;
    if (state === 'occupied') {
      if (connecting) return '#ff4d4d';
      const wire = wireId ? wires.find((w) => w.id === wireId) : null;
      return wire ? wire.color : '#ff8c42';
    }
    if (state === 'pair') {
      const wire = wireId ? wires.find((w) => w.id === wireId) : null;
      return wire ? wire.color : '#ffe066';
    }
    return PIN_COLORS[state] ?? '#3a4560';
  }

  function shouldGlow(pinIdx: number): boolean {
    const pin = connector.pins[pinIdx];
    return pin?.state === 'active' || pin?.state === 'available';
  }

  // Получить данные провода для пина
  function getWireData(pinIdx: number): { mark: string; length: number } | null {
    const pin = connector.pins[pinIdx];
    if (!pin || pin.state !== 'occupied' || !pin.wireId) return null;
    const wire = wires.find((w) => w.id === pin.wireId);
    if (!wire) return null;
    return { mark: wire.mark, length: wire.length };
  }

  return (
    <g
      transform={`translate(${connector.x},${connector.y}) rotate(${connector.rotation})`}
      style={{ cursor: 'grab' }}
      onPointerDown={(e) => onPointerDown(e, connector.id)}
    >
      <defs>
        <filter id={`shadow_${connector.id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0" dy="4"
            stdDeviation={isSelected ? 10 : 4}
            floodColor={def.color}
            floodOpacity={isSelected ? 0.9 : 0.5}
          />
        </filter>
        {totalPins > 0 && connector.pins.some((_, i) => shouldGlow(i)) && (
          <filter id={`pin_glow_${connector.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      <rect x={-w/2} y={-h/2} width={w} height={bodyH} rx={6} ry={6}
        fill={def.color} filter={`url(#shadow_${connector.id})`} />

      {isSelected && (
        <rect x={-w/2} y={-h/2} width={w} height={bodyH} rx={6} ry={6}
          fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} />
      )}

      {def.id === 'grey20s' && (
        <rect x={-w/2+2} y={-h/2+2} width={w-4} height={bodyH-4} rx={5} ry={5}
          fill="none" stroke="#cc5500" strokeWidth={3} />
      )}

      <rect x={-w/2+inPad} y={-h/2+inPad} width={w-inPad*2} height={bodyH-inPad*2}
        rx={4} ry={4} fill="#0d1018" />

      {def.lock && (
        <rect x={-14} y={h/2-14-(h-bodyH)/2-14} width={28} height={12} rx={3} ry={3} fill="#e8c547" />
      )}

      {Array.from({ length: totalPins }, (_, pinIdx) => {
        const row = Math.floor(pinIdx / def.cols);
        const col = pinIdx % def.cols;
        const px = -w/2 + PIN_OUTER_PAD + col * PIN_SCALE + PIN_SCALE/2;
        const py = -h/2 + PIN_OUTER_PAD + row * PIN_SCALE + PIN_SCALE/2;
        const color = getPinColor(pinIdx);
        const glow = shouldGlow(pinIdx);
        const pin = connector.pins[pinIdx];
        const isOccupied = pin?.state === 'occupied';
        const wireData = getWireData(pinIdx);

        // Размеры шрифтов адаптивно под размер пина
        const markFontSize = Math.max(8, pinSize * 0.28);
        const lengthFontSize = Math.max(7, pinSize * 0.22);

        return (
          <g key={pinIdx}
            onClick={(e) => { e.stopPropagation(); onPinClick(connector.id, pinIdx); }}
            style={{ cursor: 'crosshair' }}>
            {glow && (
              <rect x={px-pinSize/2-3} y={py-pinSize/2-3}
                width={pinSize+6} height={pinSize+6} rx={4} fill={color} opacity={0.25} />
            )}
            <rect x={px-pinSize/2} y={py-pinSize/2} width={pinSize} height={pinSize}
              rx={2} fill={color} />

            {/* Если пин занят — показываем маркировку провода и длину */}
            {isOccupied && wireData ? (
              <>
                {/* Маркировка провода (номер) — верхняя строка */}
                {wireData.mark && (
                  <text
                    x={px} y={py - pinSize * 0.1}
                    textAnchor="middle" dominantBaseline="auto"
                    fontSize={markFontSize}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                    fill="rgba(255,255,255,0.92)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {wireData.mark}
                  </text>
                )}
                {/* Длина провода — нижняя строка */}
                {wireData.length > 0 && (
                  <text
                    x={px} y={py + pinSize * 0.15}
                    textAnchor="middle" dominantBaseline="hanging"
                    fontSize={lengthFontSize}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="rgba(200,212,240,0.7)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {wireData.length}
                  </text>
                )}
              </>
            ) : (
              /* Если пин свободен — показываем номер пина как раньше */
              <text x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(7, pinSize * 0.36)} fontFamily="monospace"
                fill={isOccupied ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.25)'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {pinIdx + 1}
              </text>
            )}
          </g>
        );
      })}

      <text x={0} y={h/2-(def.lock ? 2 : -2)-14}
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
