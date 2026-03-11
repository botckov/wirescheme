import React from 'react';
import type { ConnectorDef } from '../types';
import { LIBRARY } from '../constants';

interface LibraryPanelProps {
  onAddConnector: (libId: string) => void;
}

function MiniSVG({ def }: { def: ConnectorDef }) {
  const w = 36, h = 36;
  const { cols, rows } = def;
  const ps = Math.min(w / (cols + 1), h / (rows + 1)) * 0.7;
  const padX = (w - cols * ps * 1.4) / 2 + ps * 0.7;
  const padY = (h - rows * ps * 1.4) / 2 + ps * 0.7;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="1" y="1" width={w - 2} height={h - 2} rx={4} fill={def.color} opacity={0.85} />
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const px = padX + c * ps * 1.4;
        const py = padY + r * ps * 1.4;
        return def.pin_shape === 'circle'
          ? <circle key={i} cx={px} cy={py} r={ps / 2} fill="#4a5a7a" />
          : <rect key={i} x={px - ps / 2} y={py - ps / 2} width={ps} height={ps} rx={1} fill="#4a5a7a" />;
      })}
    </svg>
  );
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddConnector }) => {
  function handleDragStart(e: React.DragEvent, libId: string) {
    e.dataTransfer.setData('libId', libId);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside className="ws-left-panel">
      <div className="ws-panel-title">Компоненты</div>
      <div className="ws-lib-list">
        {LIBRARY.map((def) => (
          <div
            key={def.id}
            className="ws-lib-item"
            draggable
            onDragStart={(e) => handleDragStart(e, def.id)}
            onDoubleClick={() => onAddConnector(def.id)}
            title={`Двойной клик или перетащите на холст`}
          >
            <div className="ws-lib-icon">
              <MiniSVG def={def} />
            </div>
            <div className="ws-lib-meta">
              <div className="ws-lib-name">{def.name}</div>
              <div className="ws-lib-sub">{def.alias} · {def.rows * def.cols}p</div>
            </div>
          </div>
        ))}
      </div>
      <button className="ws-add-btn" onClick={() => onAddConnector(LIBRARY[0].id)}>
        + Добавить компонент
      </button>
    </aside>
  );
};

export default LibraryPanel;
