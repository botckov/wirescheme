import React, { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { appReducer, initialState } from './hooks/useAppReducer';
import type { ConnectingState, Connector, Wire, HarnessNode, HarnessEdge } from './types';
import { getConnDef, uid, connSize } from './utils/geometry';
import { LIBRARY, WIRE_SECTIONS } from './constants';

import Toolbar from './components/Toolbar';
import LibraryPanel from './components/LibraryPanel';
import PropertiesPanel from './components/PropertiesPanel';
import Canvas from './components/Canvas';
import HarnessCanvas from './components/HarnessCanvas';
import HarnessPanel from './components/HarnessPanel';
import ColorPickerPopup from './components/ColorPickerPopup';
import Toast from './components/Toast';

const MIN_TOP_H = 120;
const MIN_BOT_H = 80;

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [pendingTarget, setPendingTarget] = useState<{ connId: string; pinIdx: number } | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedWireColor, setSelectedWireColor] = useState('#e63030');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Harness connecting state
  const [harnessConnectingFrom, setHarnessConnectingFrom] = useState<string | null>(null);

  // Диалог ввода номера при добавлении фишки
  const [pendingConn, setPendingConn] = useState<{ libId: string; worldX?: number; worldY?: number } | null>(null);
  const [pendingNum, setPendingNum] = useState('');
  const numInputRef = useRef<HTMLInputElement>(null);

  // Resizable splitter
  const [topHeight, setTopHeight] = useState<number>(0); // 0 = auto (60%)
  const splitterRef = useRef<boolean>(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((msg: string) => setToastMsg(msg), []);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        toast('↩ Отменено');
      }
      if (e.key === 'v' || e.key === 'V') dispatch({ type: 'SET_MODE', payload: 'select' });
      if (e.key === 'h' || e.key === 'H') dispatch({ type: 'SET_MODE', payload: 'pan' });
      if (e.key === 'w' || e.key === 'W') dispatch({ type: 'TOGGLE_WIRES' });
      if (e.key === 'Escape') {
        setConnecting(null);
        setPendingTarget(null);
        setColorPickerPos(null);
        setHarnessConnectingFrom(null);
        setPendingConn(null);
        resetPinStates();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) {
        if (state.selectedConnId) {
          dispatch({ type: 'DELETE_CONNECTOR', payload: state.selectedConnId });
          toast('🗑 Фишка удалена');
        } else if (state.selectedWireId) {
          dispatch({ type: 'DELETE_WIRE', payload: state.selectedWireId });
          toast('🗑 Провод удалён');
        } else if (state.selectedHarnessNodeId) {
          dispatch({ type: 'DELETE_HARNESS_NODE', payload: state.selectedHarnessNodeId });
          toast('🗑 Узел удалён');
        } else if (state.selectedHarnessEdgeId) {
          dispatch({ type: 'DELETE_HARNESS_EDGE', payload: state.selectedHarnessEdgeId });
          toast('🗑 Сегмент удалён');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedConnId, state.selectedWireId, state.selectedHarnessNodeId, state.selectedHarnessEdgeId]); // eslint-disable-line

  // ── Pin state helpers ─────────────────────────────────────────
  function resetPinStates() {
    state.connectors.forEach((c) => {
      c.pins.forEach((p) => {
        if (p.state !== 'occupied' && p.state !== 'pair') {
          dispatch({ type: 'UPDATE_PIN_STATE', payload: { connId: c.id, pinIdx: p.id, state: 'free' } });
        }
      });
    });
  }

  function setAllAvailable(fromConnId: string) {
    state.connectors.forEach((c) => {
      if (c.id === fromConnId) return;
      c.pins.forEach((p) => {
        if (p.state === 'free') {
          dispatch({ type: 'UPDATE_PIN_STATE', payload: { connId: c.id, pinIdx: p.id, state: 'available' } });
        }
      });
    });
  }

  // ── Pin click handler ─────────────────────────────────────────
  const handlePinClick = useCallback(
    (connId: string, pinIdx: number) => {
      const connector = state.connectors.find((c) => c.id === connId);
      if (!connector) return;
      const pin = connector.pins[pinIdx];
      if (!pin) return;

      if (!connecting) {
        if (pin.state === 'occupied') { toast('⚠ Пин уже занят'); return; }
        dispatch({ type: 'UPDATE_PIN_STATE', payload: { connId, pinIdx, state: 'active' } });
        setAllAvailable(connId);
        setConnecting({ connId, pinIdx });
        toast('Выберите второй пин для соединения');
      } else {
        if (connId === connecting.connId) {
          resetPinStates(); setConnecting(null);
          toast('⚠ Нельзя соединить пины одного компонента');
          return;
        }
        if (pin.state === 'occupied') { toast('⚠ Пин уже занят'); return; }
        setPendingTarget({ connId, pinIdx });
        setColorPickerPos({ x: 400, y: 300 });
      }
    },
    [connecting, state.connectors] // eslint-disable-line
  );

  const handleConfirmWire = useCallback(() => {
    if (!connecting || !pendingTarget) return;
    const wire: Wire = {
      id: uid('w'),
      fromConn: connecting.connId,
      fromPin: connecting.pinIdx,
      toConn: pendingTarget.connId,
      toPin: pendingTarget.pinIdx,
      color: selectedWireColor,
      mark: '',
      section: WIRE_SECTIONS[2],
      signal: '',
      length: 0,
    };
    dispatch({ type: 'ADD_WIRE', payload: wire });
    setConnecting(null); setPendingTarget(null); setColorPickerPos(null);
    toast('⚡ Соединение создано');
  }, [connecting, pendingTarget, selectedWireColor]);

  const handleCancelColorPicker = useCallback(() => {
    setConnecting(null); setPendingTarget(null); setColorPickerPos(null);
    resetPinStates();
  }, []); // eslint-disable-line

  // ── Add connector — открывает диалог ввода номера ────────────
  const handleAddConnector = useCallback(
    (libId: string, worldX?: number, worldY?: number) => {
      setPendingConn({ libId, worldX, worldY });
      setPendingNum('');
      setTimeout(() => numInputRef.current?.focus(), 50);
    },
    []
  );

  const handleConfirmAdd = useCallback(() => {
    if (!pendingConn) return;
    const num = parseInt(pendingNum, 10);
    if (isNaN(num) || num <= 0) { toast('⚠ Введите номер фишки'); return; }
    const { libId, worldX, worldY } = pendingConn;
    const def = getConnDef(libId);
    const nc: Connector = {
      id: uid('c'),
      libId,
      x: worldX ?? (800 / 2 - state.viewport.x) / state.viewport.scale,
      y: worldY ?? (600 / 2 - state.viewport.y) / state.viewport.scale,
      rotation: 0,
      num,
      label: '',
      pins: Array.from({ length: def.rows * def.cols }, (_, i) => ({
        id: i,
        state: 'free',
        wireId: null,
      })),
    };
    dispatch({ type: 'ADD_CONNECTOR', payload: nc });
    setPendingConn(null);
    setPendingNum('');
    toast(`Добавлена фишка №${num}: ${def.name}`);
  }, [pendingConn, pendingNum, state.viewport]);

  // ── Connector click → highlight in harness ────────────────────
  const handleSelectConnector = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_CONNECTOR', payload: id });
    dispatch({ type: 'SET_HIGHLIGHTED_CONNECTOR', payload: id });
  }, []);

  // ── Zoom to fit (upper) ───────────────────────────────────────
  const handleZoomFit = useCallback(() => {
    if (state.connectors.length === 0) {
      dispatch({ type: 'SET_VIEWPORT', payload: { x: 0, y: 0, scale: 1 } });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.connectors.forEach((c) => {
      const { w, h } = connSize(c);
      minX = Math.min(minX, c.x - w / 2);
      minY = Math.min(minY, c.y - h / 2);
      maxX = Math.max(maxX, c.x + w / 2);
      maxY = Math.max(maxY, c.y + h / 2);
    });
    const cw = window.innerWidth - 460;
    const ch = (topHeight || window.innerHeight * 0.6) - 74;
    const pad = 60;
    const scaleX = (cw - pad * 2) / (maxX - minX || 1);
    const scaleY = (ch - pad * 2) / (maxY - minY || 1);
    const scale = Math.max(0.15, Math.min(2, Math.min(scaleX, scaleY)));
    dispatch({ type: 'SET_VIEWPORT', payload: { scale, x: cw / 2 - ((minX + maxX) / 2) * scale, y: ch / 2 - ((minY + maxY) / 2) * scale } });
  }, [state.connectors, topHeight]);

  // ── Zoom to fit (harness) ─────────────────────────────────────
  const handleHarnessZoomFit = useCallback(() => {
    if (state.harnessNodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.harnessNodes.forEach((n) => {
      minX = Math.min(minX, n.x - 40);
      minY = Math.min(minY, n.y - 25);
      maxX = Math.max(maxX, n.x + 40);
      maxY = Math.max(maxY, n.y + 25);
    });
    const botH = bodyRef.current
      ? bodyRef.current.clientHeight - (topHeight || bodyRef.current.clientHeight * 0.6) - 6
      : 200;
    const cw = window.innerWidth - 460;
    const pad = 40;
    const scaleX = (cw - pad * 2) / (maxX - minX || 1);
    const scaleY = (botH - pad * 2) / (maxY - minY || 1);
    const scale = Math.max(0.2, Math.min(3, Math.min(scaleX, scaleY)));
    dispatch({
      type: 'SET_HARNESS_VIEWPORT',
      payload: { scale, x: cw / 2 - ((minX + maxX) / 2) * scale, y: botH / 2 - ((minY + maxY) / 2) * scale },
    });
  }, [state.harnessNodes, topHeight]);

  // ── Zoom in/out (upper) ───────────────────────────────────────
  const applyZoom = (factor: number) => {
    const { scale, x, y } = state.viewport;
    const newScale = Math.max(0.15, Math.min(4, scale * factor));
    const cw = window.innerWidth - 460;
    const ch = window.innerHeight - 74;
    dispatch({ type: 'SET_VIEWPORT', payload: { scale: newScale, x: cw / 2 - (cw / 2 - x) * (newScale / scale), y: ch / 2 - (ch / 2 - y) * (newScale / scale) } });
  };

  // ── Export / Import ───────────────────────────────────────────
  const handleExport = useCallback(() => {
    const data = {
      version: '2.0',
      meta: { name: 'WireScheme проект', created: new Date().toISOString() },
      connectors: state.connectors,
      connections: state.wires,
      harnessNodes: state.harnessNodes,
      harnessEdges: state.harnessEdges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'project.wsch';
    a.click();
    toast('💾 Экспортировано в project.wsch');
  }, [state.connectors, state.wires, state.harnessNodes, state.harnessEdges]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wsch,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target!.result as string);
          const connectors: Connector[] = (data.connectors ?? []).map((c: Connector) => {
            const def = getConnDef(c.libId);
            return {
              ...c,
              pins: c.pins ?? Array.from({ length: def.rows * def.cols }, (_, i) => ({ id: i, state: 'free', wireId: null })),
            };
          });
          const wires: Wire[] = data.connections ?? [];
          wires.forEach((w) => {
            const fc = connectors.find((c) => c.id === w.fromConn);
            const tc = connectors.find((c) => c.id === w.toConn);
            if (fc) { fc.pins[w.fromPin].state = 'occupied'; fc.pins[w.fromPin].wireId = w.id; }
            if (tc) { tc.pins[w.toPin].state = 'occupied'; tc.pins[w.toPin].wireId = w.id; }
          });
          dispatch({
            type: 'LOAD_PROJECT',
            payload: {
              connectors, wires,
              harnessNodes: data.harnessNodes ?? [],
              harnessEdges: data.harnessEdges ?? [],
            },
          });
          setTimeout(handleZoomFit, 50);
          toast('📂 Проект загружен');
        } catch {
          toast('❌ Ошибка загрузки');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [handleZoomFit]);

  const handleClearAll = useCallback(() => {
    if (state.connectors.length === 0 && state.harnessNodes.length === 0) return;
    if (!window.confirm('Очистить холст? Все данные будут удалены.')) return;
    dispatch({ type: 'CLEAR_ALL' });
    toast('🗑 Холст очищен');
  }, [state.connectors.length, state.harnessNodes.length]);

  // ── Harness: add nodes ────────────────────────────────────────
  const handleAddHarnessConnectorNode = useCallback(() => {
    const n: HarnessNode = {
      id: uid('hn'),
      type: 'connector',
      label: `${state.harnessNodes.filter((x) => x.type === 'connector').length + 1}`,
      x: (150 - state.harnessViewport.x) / state.harnessViewport.scale,
      y: (80 - state.harnessViewport.y) / state.harnessViewport.scale,
    };
    dispatch({ type: 'ADD_HARNESS_NODE', payload: n });
    toast('Добавлен узел фишки');
  }, [state.harnessNodes, state.harnessViewport]);

  const handleAddHarnessJunctionNode = useCallback(() => {
    const letters = ['Т', 'У', 'П', 'Р', 'Я', 'М', 'О', 'Н', 'К'];
    const used = state.harnessNodes.filter((x) => x.type === 'junction').length;
    const n: HarnessNode = {
      id: uid('hn'),
      type: 'junction',
      label: letters[used % letters.length],
      x: (200 - state.harnessViewport.x) / state.harnessViewport.scale,
      y: (80 - state.harnessViewport.y) / state.harnessViewport.scale,
    };
    dispatch({ type: 'ADD_HARNESS_NODE', payload: n });
    toast('Добавлена развилка');
  }, [state.harnessNodes, state.harnessViewport]);

  // ── Harness: connect nodes ────────────────────────────────────
  const handleHarnessNodeClick = useCallback((nodeId: string) => {
    if (!harnessConnectingFrom) {
      setHarnessConnectingFrom(nodeId);
      toast('Кликните на второй узел для соединения');
      return;
    }
    if (harnessConnectingFrom === nodeId) {
      setHarnessConnectingFrom(null);
      toast('⚠ Нельзя соединить узел с собой');
      return;
    }
    // Check duplicate edge
    const exists = state.harnessEdges.find(
      (e) => (e.fromId === harnessConnectingFrom && e.toId === nodeId) ||
              (e.fromId === nodeId && e.toId === harnessConnectingFrom)
    );
    if (exists) {
      setHarnessConnectingFrom(null);
      toast('⚠ Ребро уже существует');
      return;
    }
    const edge: HarnessEdge = {
      id: uid('he'),
      fromId: harnessConnectingFrom,
      toId: nodeId,
      conduitType: '',
      length: 0,
    };
    dispatch({ type: 'ADD_HARNESS_EDGE', payload: edge });
    setHarnessConnectingFrom(null);
    toast('✓ Сегмент добавлен');
  }, [harnessConnectingFrom, state.harnessEdges]);

  const handleHarnessCanvasClick = useCallback((_x: number, _y: number) => {
    if (harnessConnectingFrom) {
      setHarnessConnectingFrom(null);
    }
  }, [harnessConnectingFrom]);

  const handleDeleteHarnessSelected = useCallback(() => {
    if (state.selectedHarnessNodeId) {
      dispatch({ type: 'DELETE_HARNESS_NODE', payload: state.selectedHarnessNodeId });
      toast('🗑 Узел удалён');
    } else if (state.selectedHarnessEdgeId) {
      dispatch({ type: 'DELETE_HARNESS_EDGE', payload: state.selectedHarnessEdgeId });
      toast('🗑 Сегмент удалён');
    }
  }, [state.selectedHarnessNodeId, state.selectedHarnessEdgeId]);

  const handleLinkConnector = useCallback((nodeId: string, connectorId: string) => {
    dispatch({ type: 'UPDATE_HARNESS_NODE', payload: { id: nodeId, connectorId: connectorId || undefined } });
  }, []);

  // ── Splitter drag ─────────────────────────────────────────────
  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    splitterRef.current = true;
    const startY = e.clientY;
    const startH = topHeight || (bodyRef.current?.clientHeight ?? 500) * 0.6;

    const onMove = (ev: MouseEvent) => {
      if (!splitterRef.current || !bodyRef.current) return;
      const totalH = bodyRef.current.clientHeight;
      const newH = Math.max(MIN_TOP_H, Math.min(totalH - MIN_BOT_H, startH + (ev.clientY - startY)));
      setTopHeight(newH);
    };
    const onUp = () => {
      splitterRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Derived status ────────────────────────────────────────────
  const statusText = state.selectedConnId
    ? `Выбрана Ф${state.connectors.find((c) => c.id === state.selectedConnId)?.num ?? ''}`
    : state.selectedWireId ? 'Выбран провод'
    : state.selectedHarnessNodeId ? 'Выбран узел жгута'
    : state.selectedHarnessEdgeId ? 'Выбран сегмент жгута'
    : connecting ? '⚡ Выберите второй пин'
    : harnessConnectingFrom ? '⚡ Выберите второй узел'
    : 'Ничего не выбрано';

  return (
    <div className="ws-app">
      <Toolbar
        mode={state.mode}
        zoom={state.viewport.scale}
        wiresVisible={state.wiresVisible}
        canUndo={state.history.length > 0}
        onSetMode={(m) => dispatch({ type: 'SET_MODE', payload: m })}
        onZoomIn={() => applyZoom(1.2)}
        onZoomOut={() => applyZoom(0.8)}
        onZoomFit={handleZoomFit}
        onUndo={() => { dispatch({ type: 'UNDO' }); toast('↩ Отменено'); }}
        onToggleWires={() => dispatch({ type: 'TOGGLE_WIRES' })}
        onClearAll={handleClearAll}
        onExport={handleExport}
        onImport={handleImport}
      />

      <div className="ws-body" ref={bodyRef}>
        <LibraryPanel onAddConnector={handleAddConnector} />

        {/* ── Center column: top canvas + splitter + harness ── */}
        <div className="ws-center-col">

          {/* Upper canvas */}
          <div
            className="ws-canvas-wrap"
            style={{ height: topHeight ? `${topHeight}px` : '60%', flexShrink: 0 }}
          >
            <Canvas
              connectors={state.connectors}
              wires={state.wires}
              viewport={state.viewport}
              mode={state.mode}
              wiresVisible={state.wiresVisible}
              selectedConnId={state.selectedConnId}
              selectedWireId={state.selectedWireId}
              connecting={connecting}
              onViewportChange={(vp) => dispatch({ type: 'SET_VIEWPORT', payload: vp })}
              onMoveConnector={(id, x, y) => dispatch({ type: 'MOVE_CONNECTOR', payload: { id, x, y } })}
              onSelectConnector={handleSelectConnector}
              onSelectWire={(id) => dispatch({ type: 'SELECT_WIRE', payload: id })}
              onPinClick={handlePinClick}
              onDrop={handleAddConnector}
            />
            {state.connectors.length === 0 && (
              <div className="ws-hint-overlay">
                Перетащите компонент с панели или дважды кликните по нему
              </div>
            )}
          </div>

          {/* Splitter */}
          <div
            className="ws-splitter"
            onMouseDown={handleSplitterMouseDown}
            title="Тяните для изменения размера"
          >
            <div className="ws-splitter-handle" />
          </div>

          {/* Lower harness area */}
          <div className="ws-harness-wrap">
            <HarnessPanel
              nodes={state.harnessNodes}
              edges={state.harnessEdges}
              connectors={state.connectors}
              selectedNodeId={state.selectedHarnessNodeId}
              selectedEdgeId={state.selectedHarnessEdgeId}
              connectingFrom={harnessConnectingFrom}
              onAddConnectorNode={handleAddHarnessConnectorNode}
              onAddJunctionNode={handleAddHarnessJunctionNode}
              onStartConnect={() => { setHarnessConnectingFrom('_pending'); toast('Кликните на первый узел'); }}
              onCancelConnect={() => setHarnessConnectingFrom(null)}
              onDeleteSelected={handleDeleteHarnessSelected}
              onUpdateNode={(id, ch) => dispatch({ type: 'UPDATE_HARNESS_NODE', payload: { id, ...ch } })}
              onUpdateEdge={(id, ch) => dispatch({ type: 'UPDATE_HARNESS_EDGE', payload: { id, ...ch } })}
              onLinkConnector={handleLinkConnector}
              onZoomFit={handleHarnessZoomFit}
            />
            <div className="ws-harness-canvas-wrap">
              <HarnessCanvas
                nodes={state.harnessNodes}
                edges={state.harnessEdges}
                connectors={state.connectors}
                viewport={state.harnessViewport}
                selectedNodeId={state.selectedHarnessNodeId}
                selectedEdgeId={state.selectedHarnessEdgeId}
                highlightedConnectorId={state.highlightedConnectorId}
                connectingFrom={harnessConnectingFrom === '_pending' ? null : harnessConnectingFrom}
                onViewportChange={(vp) => dispatch({ type: 'SET_HARNESS_VIEWPORT', payload: vp })}
                onMoveNode={(id, x, y) => dispatch({ type: 'MOVE_HARNESS_NODE', payload: { id, x, y } })}
                onSelectNode={(id) => dispatch({ type: 'SELECT_HARNESS_NODE', payload: id })}
                onSelectEdge={(id) => dispatch({ type: 'SELECT_HARNESS_EDGE', payload: id })}
                onNodeClick={(id) => {
                  if (harnessConnectingFrom === '_pending') {
                    setHarnessConnectingFrom(id);
                    toast('Кликните на второй узел');
                  } else {
                    handleHarnessNodeClick(id);
                  }
                }}
                onCanvasClick={handleHarnessCanvasClick}
              />
              {state.harnessNodes.length === 0 && (
                <div className="ws-hint-overlay" style={{ top: '50%', transform: 'translate(-50%, -50%)' }}>
                  Добавьте узлы через панель слева от схемы
                </div>
              )}
            </div>
          </div>
        </div>

        <PropertiesPanel
          connectors={state.connectors}
          wires={state.wires}
          selectedConnId={state.selectedConnId}
          selectedWireId={state.selectedWireId}
          onUpdateConnector={(id, changes) => dispatch({ type: 'UPDATE_CONNECTOR', payload: { id, ...changes } })}
          onDeleteConnector={(id) => { dispatch({ type: 'DELETE_CONNECTOR', payload: id }); toast('🗑 Фишка удалена'); }}
          onRotateConnector={(id) => dispatch({ type: 'ROTATE_CONNECTOR', payload: id })}
          onDuplicateConnector={(id) => { dispatch({ type: 'DUPLICATE_CONNECTOR', payload: id }); toast('⧉ Скопировано'); }}
          onUpdateWire={(id, changes) => dispatch({ type: 'UPDATE_WIRE', payload: { id, ...changes } })}
          onDeleteWire={(id) => { dispatch({ type: 'DELETE_WIRE', payload: id }); toast('🗑 Провод удалён'); }}
          onSelectWire={(id) => dispatch({ type: 'SELECT_WIRE', payload: id })}
        />
      </div>

      <footer className="ws-statusbar">
        <span>🔌 Фишек: {state.connectors.length}</span>
        <span>⚡ Проводов: {state.wires.length}</span>
        <span>🌿 Узлов: {state.harnessNodes.length}</span>
        <span>{statusText}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
          {connecting ? 'ESC — отменить' : harnessConnectingFrom ? 'ESC — отменить соединение' : 'Del — удалить · Ctrl+Z — отмена'}
        </span>
      </footer>

      {colorPickerPos && (
        <ColorPickerPopup
          position={colorPickerPos}
          selectedColor={selectedWireColor}
          onSelectColor={setSelectedWireColor}
          onConfirm={handleConfirmWire}
          onCancel={handleCancelColorPicker}
        />
      )}

      {/* ── Диалог ввода номера фишки ─────────────────────────── */}
      {pendingConn && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setPendingConn(null)}
        >
          <div className="ws-popup" style={{ width: 260 }} onClick={(e) => e.stopPropagation()}>
            <div className="ws-popup-title">Номер фишки в схеме</div>
            <div style={{ fontSize: 11, color: 'var(--ws-text-dim)', marginBottom: 10 }}>
              {(() => { try { return getConnDef(pendingConn.libId).name; } catch { return pendingConn.libId; } })()}
            </div>
            <input
              ref={numInputRef}
              className="ws-prop-input"
              type="number"
              min={1}
              placeholder="например: 108"
              value={pendingNum}
              onChange={(e) => setPendingNum(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAdd(); if (e.key === 'Escape') setPendingConn(null); }}
              style={{ width: '100%', marginBottom: 10, fontSize: 15, padding: '6px 10px' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="ws-btn-primary" onClick={handleConfirmAdd} style={{ flex: 1 }}>Добавить</button>
              <button className="ws-tbtn" onClick={() => setPendingConn(null)}>✕</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} onClear={() => setToastMsg(null)} />
    </div>
  );
}