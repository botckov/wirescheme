import React from 'react';
import type { Connector, Wire } from '../types';
import { WIRE_COLORS, WIRE_SECTIONS } from '../constants';
import { getConnDef } from '../utils/geometry';

interface PropertiesPanelProps {
  connectors: Connector[];
  wires: Wire[];
  selectedConnId: string | null;
  selectedWireId: string | null;
  onUpdateConnector: (id: string, changes: Partial<Connector>) => void;
  onDeleteConnector: (id: string) => void;
  onRotateConnector: (id: string) => void;
  onDuplicateConnector: (id: string) => void;
  onUpdateWire: (id: string, changes: Partial<Wire>) => void;
  onDeleteWire: (id: string) => void;
  onSelectWire: (id: string | null) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  connectors, wires, selectedConnId, selectedWireId,
  onUpdateConnector, onDeleteConnector, onRotateConnector, onDuplicateConnector,
  onUpdateWire, onDeleteWire, onSelectWire,
}) => {
  const selectedConn = connectors.find((c) => c.id === selectedConnId);
  const selectedWire = wires.find((w) => w.id === selectedWireId);

  return (
    <aside className="ws-right-panel">
      {/* ── Connector Properties ─────────────────────────────── */}
      {selectedConn && (
        <ConnectorProps
          connector={selectedConn}
          onUpdate={(changes) => onUpdateConnector(selectedConn.id, changes)}
          onDelete={() => onDeleteConnector(selectedConn.id)}
          onRotate={() => onRotateConnector(selectedConn.id)}
          onDuplicate={() => onDuplicateConnector(selectedConn.id)}
        />
      )}

      {/* ── Wire Properties ──────────────────────────────────── */}
      {selectedWire && (
        <WireProps
          wire={selectedWire}
          connectors={connectors}
          onUpdate={(changes) => onUpdateWire(selectedWire.id, changes)}
          onDelete={() => onDeleteWire(selectedWire.id)}
        />
      )}

      {/* ── No selection hint ────────────────────────────────── */}
      {!selectedConn && !selectedWire && (
        <div className="ws-prop-section">
          <div className="ws-prop-label">Свойства</div>
          <p style={{ fontSize: 11, color: 'var(--ws-text-dim)', lineHeight: 1.6 }}>
            Выберите компонент или провод для редактирования
          </p>
        </div>
      )}

      {/* ── Connections list ─────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--ws-border)', marginTop: 'auto' }}>
        <div className="ws-panel-title" style={{ padding: '10px 14px 6px' }}>
          Соединения ({wires.length})
        </div>
        <div className="ws-conn-list">
          {wires.map((w) => {
            const fc = connectors.find((x) => x.id === w.fromConn);
            const tc = connectors.find((x) => x.id === w.toConn);
            return (
              <div
                key={w.id}
                className={`ws-conn-item${selectedWireId === w.id ? ' selected' : ''}`}
                onClick={() => onSelectWire(w.id)}
              >
                <div className="ws-conn-dot" style={{ background: w.color }} />
                <span>
                  Ф{fc?.num ?? '?'}:{w.fromPin + 1} → Ф{tc?.num ?? '?'}:{w.toPin + 1}
                </span>
                {w.length > 0 && (
                  <span style={{ marginLeft: 'auto', color: 'var(--ws-text-dim)', fontSize: 10 }}>
                    {w.length}мм
                  </span>
                )}
                {w.mark && (
                  <span style={{ color: 'var(--ws-accent)', fontSize: 10, marginLeft: w.length > 0 ? 4 : 'auto' }}>
                    {w.mark}
                  </span>
                )}
              </div>
            );
          })}
          {wires.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--ws-text-dim)', padding: '8px 10px' }}>
              Нет соединений
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

// ── Sub-component: Connector Properties ──────────────────────────
interface ConnectorPropsProps {
  connector: Connector;
  onUpdate: (changes: Partial<Connector>) => void;
  onDelete: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
}

const ConnectorProps: React.FC<ConnectorPropsProps> = ({
  connector, onUpdate, onDelete, onRotate, onDuplicate,
}) => {
  const def = getConnDef(connector.libId);
  const occupiedCount = connector.pins.filter((p) => p.state === 'occupied').length;

  return (
    <div className="ws-prop-section">
      <div className="ws-prop-label">Компонент</div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Тип</span>
        <span className="ws-prop-val">{def.name}</span>
      </div>
      <div className="ws-prop-row">
        <span className="ws-prop-key">Номер</span>
        <span className="ws-prop-val" style={{ color: 'var(--ws-accent)', fontWeight: 600 }}>
          Ф{connector.num}
        </span>
      </div>
      <div className="ws-prop-row">
        <span className="ws-prop-key">Пины</span>
        <span className="ws-prop-val">{occupiedCount}/{connector.pins.length} занято</span>
      </div>
      <div className="ws-prop-row">
        <span className="ws-prop-key">Поворот</span>
        <span className="ws-prop-val">{connector.rotation}°</span>
      </div>

      <div className="ws-prop-row" style={{ marginTop: 8 }}>
        <span className="ws-prop-key">Метка</span>
        <input
          className="ws-prop-input"
          value={connector.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="ECU, BCM…"
          maxLength={24}
        />
      </div>

      <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
        <button className="ws-tbtn" style={{ fontSize: 11 }} onClick={onRotate}>⟳ Повернуть</button>
        <button className="ws-tbtn" style={{ fontSize: 11 }} onClick={onDuplicate}>⧉ Копировать</button>
        <button className="ws-tbtn danger" style={{ fontSize: 11 }} onClick={onDelete}>✕ Удалить</button>
      </div>
    </div>
  );
};

// ── Sub-component: Wire Properties ───────────────────────────────
interface WirePropsProps {
  wire: Wire;
  connectors: Connector[];
  onUpdate: (changes: Partial<Wire>) => void;
  onDelete: () => void;
}

const WireProps: React.FC<WirePropsProps> = ({ wire, connectors, onUpdate, onDelete }) => {
  const fc = connectors.find((c) => c.id === wire.fromConn);
  const tc = connectors.find((c) => c.id === wire.toConn);

  return (
    <div className="ws-prop-section" style={{ borderBottom: '1px solid var(--ws-border)' }}>
      <div className="ws-prop-label">Провод</div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Соединение</span>
        <span className="ws-prop-val" style={{ fontSize: 10 }}>
          Ф{fc?.num ?? '?'}:{wire.fromPin + 1} → Ф{tc?.num ?? '?'}:{wire.toPin + 1}
        </span>
      </div>

      <div className="ws-prop-row" style={{ marginTop: 6 }}>
        <span className="ws-prop-key">Маркировка</span>
        <input
          className="ws-prop-input"
          value={wire.mark}
          onChange={(e) => onUpdate({ mark: e.target.value })}
          placeholder="A3"
          maxLength={12}
        />
      </div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Длина (мм)</span>
        <input
          className="ws-prop-input"
          type="number"
          min={0}
          value={wire.length}
          onChange={(e) => onUpdate({ length: Number(e.target.value) })}
          placeholder="370"
        />
      </div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Сечение</span>
        <select
          className="ws-prop-input"
          value={wire.section}
          onChange={(e) => onUpdate({ section: e.target.value })}
        >
          {WIRE_SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Сигнал</span>
        <input
          className="ws-prop-input"
          value={wire.signal}
          onChange={(e) => onUpdate({ signal: e.target.value })}
          placeholder="+12V, GND…"
          maxLength={20}
        />
      </div>

      <div className="ws-prop-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
        <span className="ws-prop-key" style={{ width: '100%' }}>Цвет провода</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {WIRE_COLORS.map((col) => (
            <button
              key={col.hex}
              title={col.name}
              onClick={() => onUpdate({ color: col.hex })}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: col.hex,
                border: wire.color === col.hex ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer',
                transform: wire.color === col.hex ? 'scale(1.15)' : undefined,
                transition: 'transform 0.1s, border-color 0.1s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button className="ws-tbtn danger" style={{ fontSize: 11, flex: 1 }} onClick={onDelete}>
          ✕ Удалить провод
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
