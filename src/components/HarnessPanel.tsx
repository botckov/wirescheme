import React, { useState } from 'react';
import type { HarnessNode, HarnessEdge, Connector } from '../types';

interface HarnessPanelProps {
  nodes: HarnessNode[];
  edges: HarnessEdge[];
  connectors: Connector[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectingFrom: string | null;
  onAddConnectorNode: () => void;
  onAddJunctionNode: () => void;
  onStartConnect: () => void;
  onCancelConnect: () => void;
  onDeleteSelected: () => void;
  onUpdateNode: (id: string, changes: Partial<HarnessNode>) => void;
  onUpdateEdge: (id: string, changes: Partial<HarnessEdge>) => void;
  onLinkConnector: (nodeId: string, connectorId: string) => void;
  onZoomFit: () => void;
}

const CONDUIT_TYPES = ['', 'УС16', 'УС20', 'УС22', 'УС25', 'УС32', 'УС40'];

const HarnessPanel: React.FC<HarnessPanelProps> = ({
  nodes, edges, connectors,
  selectedNodeId, selectedEdgeId, connectingFrom,
  onAddConnectorNode, onAddJunctionNode, onStartConnect, onCancelConnect,
  onDeleteSelected, onUpdateNode, onUpdateEdge, onLinkConnector, onZoomFit,
}) => {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  return (
    <div className="ws-harness-panel">
      {/* Toolbar */}
      <div className="ws-harness-toolbar">
        <span className="ws-harness-title">Жгут</span>

        <button className="ws-tbtn" onClick={onAddConnectorNode} title="Добавить узел-фишку">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="10" height="6" rx="2" />
          </svg>
          + Фишка
        </button>

        <button className="ws-tbtn" onClick={onAddJunctionNode} title="Добавить развилку">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="6" height="6" rx="1" strokeWidth="2" />
          </svg>
          + Развилка
        </button>

        <button
          className={`ws-tbtn${connectingFrom ? ' active' : ''}`}
          onClick={connectingFrom ? onCancelConnect : onStartConnect}
          title="Соединить узлы рёбром"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="11" x2="11" y2="1" />
            <circle cx="1" cy="11" r="1.5" fill="currentColor" />
            <circle cx="11" cy="1" r="1.5" fill="currentColor" />
          </svg>
          {connectingFrom ? 'Отмена' : 'Соединить'}
        </button>

        {(selectedNodeId || selectedEdgeId) && (
          <button className="ws-tbtn danger" onClick={onDeleteSelected} title="Удалить выбранное">
            ✕
          </button>
        )}

        <button className="ws-tbtn" style={{ marginLeft: 'auto' }} onClick={onZoomFit} title="Вместить схему">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="4" height="4" rx="1" />
            <rect x="8" y="8" width="4" height="4" rx="1" />
            <path d="M6 3h5v5M8 11H3V6" />
          </svg>
        </button>
      </div>

      {/* Properties */}
      <div className="ws-harness-props">
        {selectedNode && (
          <NodeProperties
            node={selectedNode}
            connectors={connectors}
            onUpdate={(ch) => onUpdateNode(selectedNode.id, ch)}
            onLink={(cid) => onLinkConnector(selectedNode.id, cid)}
          />
        )}
        {selectedEdge && (
          <EdgeProperties
            edge={selectedEdge}
            nodes={nodes}
            onUpdate={(ch) => onUpdateEdge(selectedEdge.id, ch)}
          />
        )}
        {!selectedNode && !selectedEdge && (
          <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ws-text-dim)', lineHeight: 1.6 }}>
            {connectingFrom
              ? '⚡ Кликните на второй узел для соединения'
              : 'Выберите узел или ребро · ПКМ или средняя кнопка — панорама'}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Node properties ───────────────────────────────────────────────
interface NodePropsProps {
  node: HarnessNode;
  connectors: Connector[];
  onUpdate: (changes: Partial<HarnessNode>) => void;
  onLink: (connectorId: string) => void;
}

const NodeProperties: React.FC<NodePropsProps> = ({ node, connectors, onUpdate, onLink }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--ws-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ws-text-dim)', marginBottom: 2 }}>
        {node.type === 'junction' ? 'Развилка' : 'Фишка (узел)'}
      </div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Метка</span>
        <input
          className="ws-prop-input"
          value={node.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder={node.type === 'junction' ? 'Т, У, П…' : '568, БО34…'}
          maxLength={16}
        />
      </div>

      {node.type === 'connector' && (
        <div className="ws-prop-row">
          <span className="ws-prop-key">Фишка</span>
          <select
            className="ws-prop-input"
            value={node.connectorId ?? ''}
            onChange={(e) => onLink(e.target.value)}
          >
            <option value="">— не привязана —</option>
            {connectors.map((c) => (
              <option key={c.id} value={c.id}>
                Ф{c.num}{c.label ? ` (${c.label})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

// ── Edge properties ───────────────────────────────────────────────
interface EdgePropsProps {
  edge: HarnessEdge;
  nodes: HarnessNode[];
  onUpdate: (changes: Partial<HarnessEdge>) => void;
}

const EdgeProperties: React.FC<EdgePropsProps> = ({ edge, nodes, onUpdate }) => {
  const from = nodes.find((n) => n.id === edge.fromId);
  const to = nodes.find((n) => n.id === edge.toId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--ws-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ws-text-dim)', marginBottom: 2 }}>
        Сегмент жгута
      </div>

      <div className="ws-prop-row" style={{ fontSize: 10 }}>
        <span className="ws-prop-key" style={{ color: 'var(--ws-text-dim)' }}>Узлы</span>
        <span style={{ fontFamily: 'var(--ws-mono)', fontSize: 10, color: 'var(--ws-text)' }}>
          {from?.label ?? '?'} → {to?.label ?? '?'}
        </span>
      </div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Гофра</span>
        <select
          className="ws-prop-input"
          value={edge.conduitType}
          onChange={(e) => onUpdate({ conduitType: e.target.value })}
        >
          {CONDUIT_TYPES.map((t) => (
            <option key={t} value={t}>{t || '— нет —'}</option>
          ))}
        </select>
      </div>

      <div className="ws-prop-row">
        <span className="ws-prop-key">Длина (см)</span>
        <input
          className="ws-prop-input"
          type="number"
          min={0}
          value={edge.length}
          onChange={(e) => onUpdate({ length: Number(e.target.value) })}
        />
      </div>
    </div>
  );
};

export default HarnessPanel;
