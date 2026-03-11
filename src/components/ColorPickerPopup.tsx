import React from 'react';
import { WIRE_COLORS } from '../constants';

interface ColorPickerPopupProps {
  position: { x: number; y: number };
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({
  position, selectedColor, onSelectColor, onConfirm, onCancel,
}) => {
  const colorInfo = WIRE_COLORS.find((c) => c.hex === selectedColor) ?? WIRE_COLORS[0];

  return (
    <div
      className="ws-popup"
      style={{
        position: 'fixed',
        left: Math.min(position.x, window.innerWidth - 240),
        top: Math.min(position.y, window.innerHeight - 260),
        zIndex: 1000,
        width: 220,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="ws-popup-title">Цвет провода</div>

      {/* Preview */}
      <div className="ws-cp-preview">
        <div
          className="ws-cp-preview-dot"
          style={{ background: selectedColor }}
        />
        <span style={{ fontSize: 11, color: 'var(--ws-text-mid)' }}>{colorInfo.name}</span>
      </div>

      {/* Swatches grid */}
      <div className="ws-cp-grid">
        {WIRE_COLORS.map((col) => (
          <button
            key={col.hex}
            title={col.name}
            onClick={() => onSelectColor(col.hex)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: col.hex,
              border: selectedColor === col.hex ? '2px solid white' : '2px solid transparent',
              cursor: 'pointer',
              transform: selectedColor === col.hex ? 'scale(1.15)' : undefined,
              transition: 'transform 0.1s, border-color 0.1s',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button className="ws-btn-primary" onClick={onConfirm} style={{ flex: 1 }}>
          ⚡ Соединить
        </button>
        <button className="ws-tbtn" onClick={onCancel}>✕</button>
      </div>
    </div>
  );
};

export default ColorPickerPopup;
