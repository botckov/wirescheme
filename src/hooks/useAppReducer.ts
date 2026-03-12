import type { AppState, AppAction, Connector, Wire, HarnessNode, HarnessEdge } from '../types';
import { getConnDef } from '../utils/geometry';
import { uid } from '../utils/geometry';

const MAX_HISTORY = 20;

function cloneState(state: AppState) {
  return {
    connectors: JSON.parse(JSON.stringify(state.connectors)),
    wires: JSON.parse(JSON.stringify(state.wires)),
    harnessNodes: JSON.parse(JSON.stringify(state.harnessNodes)),
    harnessEdges: JSON.parse(JSON.stringify(state.harnessEdges)),
  };
}

export const initialState: AppState = {
  connectors: [],
  wires: [],
  selectedConnId: null,
  selectedWireId: null,
  mode: 'select',
  viewport: { x: 0, y: 0, scale: 1 },
  wiresVisible: true,
  history: [],
  connectorCounter: 0,
  wireCounter: 0,
  harnessNodes: [],
  harnessEdges: [],
  selectedHarnessNodeId: null,
  selectedHarnessEdgeId: null,
  harnessViewport: { x: 40, y: 40, scale: 1 },
  highlightedConnectorId: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    // ── Connectors ─────────────────────────────────────────────────
    case 'ADD_CONNECTOR': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return {
        ...state,
        history,
        connectors: [...state.connectors, action.payload],
        connectorCounter: state.connectorCounter + 1,
        selectedConnId: action.payload.id,
        selectedWireId: null,
      };
    }

    case 'MOVE_CONNECTOR': {
      return {
        ...state,
        connectors: state.connectors.map((c) =>
          c.id === action.payload.id
            ? { ...c, x: action.payload.x, y: action.payload.y }
            : c
        ),
      };
    }

    case 'UPDATE_CONNECTOR': {
      return {
        ...state,
        connectors: state.connectors.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    }

    case 'ROTATE_CONNECTOR': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return {
        ...state,
        history,
        connectors: state.connectors.map((c) =>
          c.id === action.payload ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 } : c
        ),
      };
    }

    case 'DUPLICATE_CONNECTOR': {
      const original = state.connectors.find((c) => c.id === action.payload);
      if (!original) return state;
      const def = getConnDef(original.libId);
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      const nc: Connector = {
        ...original,
        id: uid('c'),
        x: original.x + 80,
        y: original.y + 80,
        label: original.label + ' (копия)',
        num: state.connectorCounter + 1,
        pins: Array.from({ length: def.rows * def.cols }, (_, i) => ({
          id: i,
          state: 'free',
          wireId: null,
        })),
      };
      return {
        ...state,
        history,
        connectors: [...state.connectors, nc],
        connectorCounter: state.connectorCounter + 1,
        selectedConnId: nc.id,
      };
    }

    case 'DELETE_CONNECTOR': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      const affectedWires = state.wires
        .filter((w) => w.fromConn === action.payload || w.toConn === action.payload)
        .map((w) => w.id);

      let updatedConnectors = state.connectors.filter((c) => c.id !== action.payload);
      affectedWires.forEach((wid) => {
        const wire = state.wires.find((w) => w.id === wid);
        if (!wire) return;
        const otherId = wire.fromConn === action.payload ? wire.toConn : wire.fromConn;
        const otherPin = wire.fromConn === action.payload ? wire.toPin : wire.fromPin;
        updatedConnectors = updatedConnectors.map((c) => {
          if (c.id !== otherId) return c;
          return {
            ...c,
            pins: c.pins.map((p) =>
              p.id === otherPin ? { ...p, state: 'free', wireId: null } : p
            ),
          };
        });
      });

      // Также обновляем узлы жгута — убираем ссылку на удалённый коннектор
      const updatedHarnessNodes = state.harnessNodes.map((n) =>
        n.connectorId === action.payload ? { ...n, connectorId: undefined } : n
      );

      return {
        ...state,
        history,
        connectors: updatedConnectors,
        wires: state.wires.filter((w) => !affectedWires.includes(w.id)),
        harnessNodes: updatedHarnessNodes,
        selectedConnId: state.selectedConnId === action.payload ? null : state.selectedConnId,
        selectedWireId: affectedWires.includes(state.selectedWireId ?? '') ? null : state.selectedWireId,
      };
    }

    // ── Wires ──────────────────────────────────────────────────────
    case 'ADD_WIRE': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      const wire = action.payload;

      const connectors = state.connectors.map((c) => {
        if (c.id === wire.fromConn) {
          return {
            ...c,
            pins: c.pins.map((p) =>
              p.id === wire.fromPin ? { ...p, state: 'occupied' as const, wireId: wire.id } : p
            ),
          };
        }
        if (c.id === wire.toConn) {
          return {
            ...c,
            pins: c.pins.map((p) =>
              p.id === wire.toPin ? { ...p, state: 'occupied' as const, wireId: wire.id } : p
            ),
          };
        }
        return c;
      });

      return {
        ...state,
        history,
        wires: [...state.wires, wire],
        connectors,
        wireCounter: state.wireCounter + 1,
        selectedWireId: wire.id,
        selectedConnId: null,
      };
    }

    case 'UPDATE_WIRE': {
      return {
        ...state,
        wires: state.wires.map((w) =>
          w.id === action.payload.id ? { ...w, ...action.payload } : w
        ),
      };
    }

    case 'DELETE_WIRE': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      const wire = state.wires.find((w) => w.id === action.payload);
      if (!wire) return state;

      const connectors = state.connectors.map((c) => {
        if (c.id === wire.fromConn) {
          return {
            ...c,
            pins: c.pins.map((p) =>
              p.id === wire.fromPin ? { ...p, state: 'free' as const, wireId: null } : p
            ),
          };
        }
        if (c.id === wire.toConn) {
          return {
            ...c,
            pins: c.pins.map((p) =>
              p.id === wire.toPin ? { ...p, state: 'free' as const, wireId: null } : p
            ),
          };
        }
        return c;
      });

      return {
        ...state,
        history,
        wires: state.wires.filter((w) => w.id !== action.payload),
        connectors,
        selectedWireId: state.selectedWireId === action.payload ? null : state.selectedWireId,
      };
    }

    // ── Selection ──────────────────────────────────────────────────
    case 'SELECT_CONNECTOR':
      return { ...state, selectedConnId: action.payload, selectedWireId: null };

    case 'SELECT_WIRE':
      return { ...state, selectedWireId: action.payload, selectedConnId: null };

    // ── Mode & Viewport ────────────────────────────────────────────
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SET_VIEWPORT':
      return { ...state, viewport: { ...state.viewport, ...action.payload } };

    case 'TOGGLE_WIRES':
      return { ...state, wiresVisible: !state.wiresVisible };

    // ── History ────────────────────────────────────────────────────
    case 'SAVE_HISTORY': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return { ...state, history };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        ...prev,
        history: state.history.slice(0, -1),
        selectedConnId: null,
        selectedWireId: null,
        selectedHarnessNodeId: null,
        selectedHarnessEdgeId: null,
      };
    }

    case 'CLEAR_ALL': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return {
        ...state,
        history,
        connectors: [],
        wires: [],
        harnessNodes: [],
        harnessEdges: [],
        selectedConnId: null,
        selectedWireId: null,
        selectedHarnessNodeId: null,
        selectedHarnessEdgeId: null,
      };
    }

    case 'LOAD_PROJECT': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      const maxNum = Math.max(...action.payload.connectors.map((c) => c.num ?? 0), 0);
      return {
        ...state,
        history,
        connectors: action.payload.connectors,
        wires: action.payload.wires,
        harnessNodes: action.payload.harnessNodes ?? [],
        harnessEdges: action.payload.harnessEdges ?? [],
        connectorCounter: maxNum,
        selectedConnId: null,
        selectedWireId: null,
        selectedHarnessNodeId: null,
        selectedHarnessEdgeId: null,
      };
    }

    case 'UPDATE_PIN_STATE': {
      return {
        ...state,
        connectors: state.connectors.map((c) => {
          if (c.id !== action.payload.connId) return c;
          return {
            ...c,
            pins: c.pins.map((p) =>
              p.id === action.payload.pinIdx
                ? {
                    ...p,
                    state: action.payload.state,
                    wireId:
                      action.payload.wireId !== undefined ? action.payload.wireId : p.wireId,
                  }
                : p
            ),
          };
        }),
      };
    }

    // ══════════════════════════════════════════════════════════════
    // HARNESS ACTIONS
    // ══════════════════════════════════════════════════════════════

    case 'ADD_HARNESS_NODE': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return {
        ...state,
        history,
        harnessNodes: [...state.harnessNodes, action.payload],
        selectedHarnessNodeId: action.payload.id,
        selectedHarnessEdgeId: null,
        selectedConnId: null,
        selectedWireId: null,
      };
    }

    case 'MOVE_HARNESS_NODE': {
      return {
        ...state,
        harnessNodes: state.harnessNodes.map((n) =>
          n.id === action.payload.id
            ? { ...n, x: action.payload.x, y: action.payload.y }
            : n
        ),
      };
    }

    case 'UPDATE_HARNESS_NODE': {
      return {
        ...state,
        harnessNodes: state.harnessNodes.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload } : n
        ),
      };
    }

    case 'DELETE_HARNESS_NODE': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      // Удаляем все рёбра связанные с этим узлом
      const affectedEdges = state.harnessEdges
        .filter((e) => e.fromId === action.payload || e.toId === action.payload)
        .map((e) => e.id);
      return {
        ...state,
        history,
        harnessNodes: state.harnessNodes.filter((n) => n.id !== action.payload),
        harnessEdges: state.harnessEdges.filter((e) => !affectedEdges.includes(e.id)),
        selectedHarnessNodeId:
          state.selectedHarnessNodeId === action.payload ? null : state.selectedHarnessNodeId,
        selectedHarnessEdgeId: affectedEdges.includes(state.selectedHarnessEdgeId ?? '')
          ? null
          : state.selectedHarnessEdgeId,
      };
    }

    case 'ADD_HARNESS_EDGE': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return {
        ...state,
        history,
        harnessEdges: [...state.harnessEdges, action.payload],
        selectedHarnessEdgeId: action.payload.id,
        selectedHarnessNodeId: null,
      };
    }

    case 'UPDATE_HARNESS_EDGE': {
      return {
        ...state,
        harnessEdges: state.harnessEdges.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload } : e
        ),
      };
    }

    case 'DELETE_HARNESS_EDGE': {
      const history = [...state.history, cloneState(state)].slice(-MAX_HISTORY);
      return {
        ...state,
        history,
        harnessEdges: state.harnessEdges.filter((e) => e.id !== action.payload),
        selectedHarnessEdgeId:
          state.selectedHarnessEdgeId === action.payload ? null : state.selectedHarnessEdgeId,
      };
    }

    case 'SELECT_HARNESS_NODE':
      return {
        ...state,
        selectedHarnessNodeId: action.payload,
        selectedHarnessEdgeId: null,
        selectedConnId: null,
        selectedWireId: null,
      };

    case 'SELECT_HARNESS_EDGE':
      return {
        ...state,
        selectedHarnessEdgeId: action.payload,
        selectedHarnessNodeId: null,
        selectedConnId: null,
        selectedWireId: null,
      };

    case 'SET_HARNESS_VIEWPORT':
      return {
        ...state,
        harnessViewport: { ...state.harnessViewport, ...action.payload },
      };

    case 'SET_HIGHLIGHTED_CONNECTOR':
      return { ...state, highlightedConnectorId: action.payload };

    default:
      return state;
  }
}
