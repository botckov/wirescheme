import React, { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { appReducer, initialState } from './hooks/useAppReducer';
import type { ConnectingState, Connector, Wire } from './types';
import { getConnDef, uid } from './utils/geometry';
import { connSize } from './utils/geometry';
import { LIBRARY, WIRE_SECTIONS } from './constants';

import Toolbar from './components/Toolbar';
import LibraryPanel from './components/LibraryPanel';
import PropertiesPanel from './components/PropertiesPanel';
import Canvas from './components/Canvas';
import ColorPickerPopup from './components/ColorPickerPopup';
import Toast from './components/Toast';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [pendingTarget, setPendingTarget] = useState<{ connId: string; pinIdx: number } | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedWireColor, setSelectedWireColor] = useState('#e63030');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
        resetPinStates();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) {
        if (state.selectedConnId) {
          dispatch({ type: 'DELETE_CONNECTOR', payload: state.selectedConnId });
          toast('🗑 Фишка удалена');
        } else if (state.selectedWireId) {
          dispatch({ type: 'DELETE_WIRE', payload: state.selectedWireId });
          toast('🗑 Провод удалён');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedConnId, state.selectedWireId]); // eslint-disable-line

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
        // Starting a connection
        if (pin.state === 'occupied') {
          toast('⚠ Пин уже занят');
          return;
        }
        // Mark this pin as active
        dispatch({ type: 'UPDATE_PIN_STATE', payload: { connId, pinIdx, state: 'active' } });
        setAllAvailable(connId);
        setConnecting({ connId, pinIdx });
        toast('Выберите второй пин для соединения');
      } else {
        // Completing a connection
        if (connId === connecting.connId) {
          // Same connector — cancel
          resetPinStates();
          setConnecting(null);
          toast('⚠ Нельзя соединить пины одного компонента');
          return;
        }
        if (pin.state === 'occupied') {
          toast('⚠ Пин уже занят');
          return;
        }
        // Show color picker
        setPendingTarget({ connId, pinIdx });
        setColorPickerPos({ x: 400, y: 300 });
      }
    },
    [connecting, state.connectors] // eslint-disable-line
  );

  // ── Confirm wire creation ─────────────────────────────────────
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
    };

    dispatch({ type: 'ADD_WIRE', payload: wire });
    setConnecting(null);
    setPendingTarget(null);
    setColorPickerPos(null);
    toast(`⚡ Соединение создано`);
  }, [connecting, pendingTarget, selectedWireColor]);

  const handleCancelColorPicker = useCallback(() => {
    setConnecting(null);
    setPendingTarget(null);
    setColorPickerPos(null);
    resetPinStates();
  }, []); // eslint-disable-line

  // ── Add connector ─────────────────────────────────────────────
  const handleAddConnector = useCallback(
    (libId: string, worldX?: number, worldY?: number) => {
      const def = getConnDef(libId);
      const { w, h } = connSize({ libId, rotation: 0 });
      const num = state.connectorCounter + 1;
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
      toast(`Добавлен Ф${num}: ${def.name}`);
    },
    [state.connectorCounter, state.viewport]
  );

  // ── Zoom to fit ───────────────────────────────────────────────
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
    const ch = window.innerHeight - 74;
    const pad = 60;
    const scaleX = (cw - pad * 2) / (maxX - minX || 1);
    const scaleY = (ch - pad * 2) / (maxY - minY || 1);
    const scale = Math.max(0.15, Math.min(2, Math.min(scaleX, scaleY)));
    dispatch({
      type: 'SET_VIEWPORT',
      payload: {
        scale,
        x: cw / 2 - ((minX + maxX) / 2) * scale,
        y: ch / 2 - ((minY + maxY) / 2) * scale,
      },
    });
  }, [state.connectors]);

  // ── Zoom in/out ───────────────────────────────────────────────
  const applyZoom = (factor: number) => {
    const { scale, x, y } = state.viewport;
    const newScale = Math.max(0.15, Math.min(4, scale * factor));
    const cw = window.innerWidth - 460;
    const ch = window.innerHeight - 74;
    dispatch({
      type: 'SET_VIEWPORT',
      payload: {
        scale: newScale,
        x: cw / 2 - (cw / 2 - x) * (newScale / scale),
        y: ch / 2 - (ch / 2 - y) * (newScale / scale),
      },
    });
  };

  // ── Export / Import ───────────────────────────────────────────
  const handleExport = useCallback(() => {
    const data = {
      version: '2.0',
      meta: { name: 'WireScheme проект', created: new Date().toISOString() },
      connectors: state.connectors,
      connections: state.wires,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'project.wsch';
    a.click();
    toast('💾 Экспортировано в project.wsch');
  }, [state.connectors, state.wires]);

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
              pins:
                c.pins ??
                Array.from({ length: def.rows * def.cols }, (_, i) => ({
                  id: i,
                  state: 'free',
                  wireId: null,
                })),
            };
          });
          const wires: Wire[] = data.connections ?? [];
          // Restore pin states from wire data
          wires.forEach((w) => {
            const fc = connectors.find((c) => c.id === w.fromConn);
            const tc = connectors.find((c) => c.id === w.toConn);
            if (fc) { fc.pins[w.fromPin].state = 'occupied'; fc.pins[w.fromPin].wireId = w.id; }
            if (tc) { tc.pins[w.toPin].state  = 'occupied'; tc.pins[w.toPin].wireId  = w.id; }
          });
          dispatch({ type: 'LOAD_PROJECT', payload: { connectors, wires } });
          setTimeout(handleZoomFit, 50);
          toast('📂 Проект загружен');
        } catch (err) {
          toast('❌ Ошибка загрузки');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [handleZoomFit]);

  // ── Clear all ─────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    if (state.connectors.length === 0) return;
    if (!window.confirm('Очистить холст? Все фишки и соединения будут удалены.')) return;
    dispatch({ type: 'CLEAR_ALL' });
    toast('🗑 Холст очищен');
  }, [state.connectors.length]);

  // ── Derived status ────────────────────────────────────────────
  const statusText = state.selectedConnId
    ? `Выбрана Ф${state.connectors.find((c) => c.id === state.selectedConnId)?.num ?? ''}`
    : state.selectedWireId
    ? 'Выбран провод'
    : connecting
    ? '⚡ Выберите второй пин'
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

      <div className="ws-body">
        <LibraryPanel onAddConnector={handleAddConnector} />

        <div className="ws-canvas-wrap" id="canvasWrap">
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
            onSelectConnector={(id) => dispatch({ type: 'SELECT_CONNECTOR', payload: id })}
            onSelectWire={(id) => dispatch({ type: 'SELECT_WIRE', payload: id })}
            onPinClick={handlePinClick}
            onDrop={handleAddConnector}
          />

          {/* Empty canvas hint */}
          {state.connectors.length === 0 && (
            <div className="ws-hint-overlay">
              Перетащите компонент с панели или дважды кликните по нему
            </div>
          )}
        </div>

        <PropertiesPanel
          connectors={state.connectors}
          wires={state.wires}
          selectedConnId={state.selectedConnId}
          selectedWireId={state.selectedWireId}
          onUpdateConnector={(id, changes) =>
            dispatch({ type: 'UPDATE_CONNECTOR', payload: { id, ...changes } })
          }
          onDeleteConnector={(id) => {
            dispatch({ type: 'DELETE_CONNECTOR', payload: id });
            toast('🗑 Фишка удалена');
          }}
          onRotateConnector={(id) => dispatch({ type: 'ROTATE_CONNECTOR', payload: id })}
          onDuplicateConnector={(id) => {
            dispatch({ type: 'DUPLICATE_CONNECTOR', payload: id });
            toast('⧉ Скопировано');
          }}
          onUpdateWire={(id, changes) =>
            dispatch({ type: 'UPDATE_WIRE', payload: { id, ...changes } })
          }
          onDeleteWire={(id) => {
            dispatch({ type: 'DELETE_WIRE', payload: id });
            toast('🗑 Провод удалён');
          }}
          onSelectWire={(id) => dispatch({ type: 'SELECT_WIRE', payload: id })}
        />
      </div>

      {/* Status bar */}
      <footer className="ws-statusbar">
        <span>🔌 Фишек: {state.connectors.length}</span>
        <span>⚡ Проводов: {state.wires.length}</span>
        <span>{statusText}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
          {connecting ? 'ESC — отменить соединение' : 'Del — удалить выбранное · Ctrl+Z — отмена'}
        </span>
      </footer>

      {/* Color picker popup */}
      {colorPickerPos && (
        <ColorPickerPopup
          position={colorPickerPos}
          selectedColor={selectedWireColor}
          onSelectColor={setSelectedWireColor}
          onConfirm={handleConfirmWire}
          onCancel={handleCancelColorPicker}
        />
      )}

      <Toast message={toastMsg} onClear={() => setToastMsg(null)} />
    </div>
  );
}
