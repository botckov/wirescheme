import React from 'react';
import type { AppMode } from '../types';

interface ToolbarProps {
  mode: AppMode;
  zoom: number;
  wiresVisible: boolean;
  canUndo: boolean;
  onSetMode: (mode: AppMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onUndo: () => void;
  onToggleWires: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  mode, zoom, wiresVisible, canUndo,
  onSetMode, onZoomIn, onZoomOut, onZoomFit,
  onUndo, onToggleWires, onClearAll, onExport, onImport,
}) => {
  return (
    <header className="ws-header">
      <div className="ws-logo">
        Wire<em>Scheme</em>
      </div>

      <div className="ws-sep" />

      {/* Mode tools */}
      <div className="ws-toolbar">
        <button
          className={`ws-tbtn${mode === 'select' ? ' active' : ''}`}
          onClick={() => onSetMode('select')}
          title="Выбор (V)"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 2l10 4-5 1-2 5z" />
          </svg>
          Выбор
        </button>
        <button
          className={`ws-tbtn${mode === 'pan' ? ' active' : ''}`}
          onClick={() => onSetMode('pan')}
          title="Панорама (H)"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 2v10M2 7h10" />
            <circle cx="7" cy="7" r="2" />
          </svg>
          Рука
        </button>
      </div>

      <div className="ws-sep" />

      {/* Zoom */}
      <div className="ws-toolbar">
        <button className="ws-tbtn" onClick={onZoomIn} title="Увеличить (+)">＋</button>
        <span className="ws-zoom-display">{Math.round(zoom * 100)}%</span>
        <button className="ws-tbtn" onClick={onZoomOut} title="Уменьшить (−)">－</button>
        <button className="ws-tbtn" onClick={onZoomFit} title="Вместить всё">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="4" height="4" rx="1" />
            <rect x="8" y="8" width="4" height="4" rx="1" />
            <path d="M6 3h5v5M8 11H3V6" />
          </svg>
          Вместить
        </button>
      </div>

      <div className="ws-sep" />

      {/* Actions */}
      <div className="ws-toolbar">
        <button
          className="ws-tbtn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Отменить (Ctrl+Z)"
          style={{ opacity: canUndo ? 1 : 0.4 }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 5H2V3" />
            <path d="M2 5A5 5 0 1 1 3 9" />
          </svg>
          Отмена
        </button>

        <button
          className={`ws-tbtn${!wiresVisible ? ' active' : ''}`}
          onClick={onToggleWires}
          title="Показать/скрыть провода (W)"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 7 Q5 3 7 7 Q9 11 12 7" />
          </svg>
          Провода
        </button>

        <button className="ws-tbtn danger" onClick={onClearAll} title="Очистить холст">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
          Очистить
        </button>
      </div>

      <div className="ws-toolbar" style={{ marginLeft: 'auto' }}>
        <button className="ws-tbtn accent" onClick={onExport} title="Экспорт проекта">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 2v7M4 6l3 3 3-3" />
            <path d="M2 10v2h10v-2" />
          </svg>
          Экспорт
        </button>
        <button className="ws-tbtn" onClick={onImport} title="Импорт проекта">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 9V2M4 5l3-3 3 3" />
            <path d="M2 10v2h10v-2" />
          </svg>
          Импорт
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
