// ═══════════════════════════════════════════════════════════════
// WIRESCHEME — Core TypeScript Types
// ═══════════════════════════════════════════════════════════════

export type PinShape = 'square' | 'rect' | 'circle';
export type LockPosition = 'top' | 'bottom' | null;
export type AppMode = 'select' | 'pan';
export type PinState = 'free' | 'active' | 'available' | 'occupied' | 'pair' | 'error';

// ── Library Definition (static, from LIBRARY constant) ──────────
export interface ConnectorDef {
  id: string;
  name: string;
  alias: string;
  color: string;
  rows: number;
  cols: number;
  pin_shape: PinShape;
  lock: LockPosition;
}

// ── Runtime Pin state on a placed connector ──────────────────────
export interface Pin {
  id: number;
  state: PinState;
  wireId: string | null;
}

// ── Placed connector instance on the canvas ─────────────────────
export interface Connector {
  id: string;
  libId: string;
  x: number;
  y: number;
  rotation: number;
  num: number;
  label: string;
  pins: Pin[];
}

// ── Wire connecting two pins ─────────────────────────────────────
export interface Wire {
  id: string;
  fromConn: string;
  fromPin: number;
  toConn: string;
  toPin: number;
  color: string;
  mark: string;
  section: string;
  signal: string;
}

// ── Geometry helpers ─────────────────────────────────────────────
export interface Point {
  x: number;
  y: number;
}

export interface ConnSize {
  w: number;
  h: number;
  scale: number;
  def: ConnectorDef;
}

// ── Wire color palette entry ─────────────────────────────────────
export interface WireColor {
  hex: string;
  name: string;
}

// ── Connection selection state ───────────────────────────────────
export interface ConnectingState {
  connId: string;
  pinIdx: number;
}

// ── Dragging state ───────────────────────────────────────────────
export interface DragState {
  connId: string;
  offX: number;
  offY: number;
}

// ── Viewport transform ───────────────────────────────────────────
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// ═══════════════════════════════════════════════════════════════
// HARNESS (нижняя схема жгута)
// ═══════════════════════════════════════════════════════════════

export type HarnessNodeType = 'connector' | 'junction';

// Узел дерева жгута
export interface HarnessNode {
  id: string;
  type: HarnessNodeType;
  label: string;          // номер фишки (напр. "568") или буква развилки ("Т")
  connectorId?: string;   // ссылка на Connector из верхней части (только для type='connector')
  x: number;
  y: number;
}

// Ребро (сегмент жгута) между двумя узлами
export interface HarnessEdge {
  id: string;
  fromId: string;
  toId: string;
  conduitType: string;    // тип гофры: "УС25", "УС22", "" — нет гофры
  length: number;         // длина в см
}

// ── App state shape (for useReducer) ────────────────────────────
export interface AppState {
  connectors: Connector[];
  wires: Wire[];
  selectedConnId: string | null;
  selectedWireId: string | null;
  mode: AppMode;
  viewport: Viewport;
  wiresVisible: boolean;
  history: Array<{ connectors: Connector[]; wires: Wire[]; harnessNodes: HarnessNode[]; harnessEdges: HarnessEdge[] }>;
  connectorCounter: number;
  wireCounter: number;
  // Harness
  harnessNodes: HarnessNode[];
  harnessEdges: HarnessEdge[];
  selectedHarnessNodeId: string | null;
  selectedHarnessEdgeId: string | null;
  harnessViewport: Viewport;
  highlightedConnectorId: string | null; // подсветка верх ↔ низ
}

// ── Action types for useReducer ──────────────────────────────────
export type AppAction =
  | { type: 'ADD_CONNECTOR'; payload: Connector }
  | { type: 'MOVE_CONNECTOR'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_CONNECTOR'; payload: Partial<Connector> & { id: string } }
  | { type: 'DELETE_CONNECTOR'; payload: string }
  | { type: 'ROTATE_CONNECTOR'; payload: string }
  | { type: 'DUPLICATE_CONNECTOR'; payload: string }
  | { type: 'ADD_WIRE'; payload: Wire }
  | { type: 'UPDATE_WIRE'; payload: Partial<Wire> & { id: string } }
  | { type: 'DELETE_WIRE'; payload: string }
  | { type: 'SELECT_CONNECTOR'; payload: string | null }
  | { type: 'SELECT_WIRE'; payload: string | null }
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SET_VIEWPORT'; payload: Partial<Viewport> }
  | { type: 'TOGGLE_WIRES' }
  | { type: 'UNDO' }
  | { type: 'SAVE_HISTORY' }
  | { type: 'CLEAR_ALL' }
  | { type: 'LOAD_PROJECT'; payload: { connectors: Connector[]; wires: Wire[]; harnessNodes?: HarnessNode[]; harnessEdges?: HarnessEdge[] } }
  | { type: 'UPDATE_PIN_STATE'; payload: { connId: string; pinIdx: number; state: PinState; wireId?: string | null } }
  // Harness actions
  | { type: 'ADD_HARNESS_NODE'; payload: HarnessNode }
  | { type: 'MOVE_HARNESS_NODE'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_HARNESS_NODE'; payload: Partial<HarnessNode> & { id: string } }
  | { type: 'DELETE_HARNESS_NODE'; payload: string }
  | { type: 'ADD_HARNESS_EDGE'; payload: HarnessEdge }
  | { type: 'UPDATE_HARNESS_EDGE'; payload: Partial<HarnessEdge> & { id: string } }
  | { type: 'DELETE_HARNESS_EDGE'; payload: string }
  | { type: 'SELECT_HARNESS_NODE'; payload: string | null }
  | { type: 'SELECT_HARNESS_EDGE'; payload: string | null }
  | { type: 'SET_HARNESS_VIEWPORT'; payload: Partial<Viewport> }
  | { type: 'SET_HIGHLIGHTED_CONNECTOR'; payload: string | null };
