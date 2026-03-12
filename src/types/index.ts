import type { ConnectorDef, WireColor } from '../types';

// ── Connector Library ────────────────────────────────────────────
export const LIBRARY: ConnectorDef[] = [
  // ── Оригинальные ────────────────────────────────────────────────
  { id: 'grey20',   name: 'Серый 20-пин',         alias: 'GREY-20',       color: '#334455', rows: 5, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'violet20', name: 'Фиолетовый 20-пин',    alias: 'VIOLET-20',     color: '#774488', rows: 4, cols: 5, pin_shape: 'rect',   lock: null },
  { id: 'blue20',   name: 'Голубой 20-пин №22',   alias: 'BLUE-20-22',    color: '#226688', rows: 5, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey20s',  name: 'Серый герм. №23',       alias: 'GREY-20-SEAL',  color: '#556677', rows: 5, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'yellow6',  name: 'Жёлтый 6-пин №9',      alias: 'YELLOW-6',      color: '#888800', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },

  // ── Малые (2–6 пинов) ───────────────────────────────────────────
  { id: 'black2',   name: 'Чёрный 2-пин',          alias: 'BLACK-2',       color: '#2a2a2a', rows: 1, cols: 2, pin_shape: 'square', lock: null },
  { id: 'black3',   name: 'Чёрный 3-пин',          alias: 'BLACK-3',       color: '#2a2a2a', rows: 1, cols: 3, pin_shape: 'square', lock: null },
  { id: 'black4',   name: 'Чёрный 4-пин',          alias: 'BLACK-4',       color: '#2a2a2a', rows: 1, cols: 4, pin_shape: 'square', lock: null },
  { id: 'white2',   name: 'Белый 2-пин',            alias: 'WHITE-2',       color: '#556677', rows: 1, cols: 2, pin_shape: 'rect',   lock: 'bottom' },
  { id: 'white4',   name: 'Белый 4-пин',            alias: 'WHITE-4',       color: '#556677', rows: 1, cols: 4, pin_shape: 'rect',   lock: 'bottom' },

  // ── Средние (7–12 пинов) ────────────────────────────────────────
  { id: 'black7c',  name: 'Чёрный 7-пин (7C)',     alias: 'BLACK-7C',      color: '#1e2a35', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'white8c',  name: 'Белый 8-пин (8C)',       alias: 'WHITE-8C',      color: '#4a5a6a', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'black10',  name: 'Чёрный 10-пин',          alias: 'BLACK-10',      color: '#1e2a35', rows: 2, cols: 5, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey12',   name: 'Серый 12-пин',           alias: 'GREY-12',       color: '#3a4a5a', rows: 3, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── Силовые (16-пин и крупные) ───────────────────────────────────
  { id: 'red16',    name: 'Красный 16-пин силовой', alias: 'RED-16',        color: '#5a1a1a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'black16',  name: 'Чёрный 16-пин',          alias: 'BLACK-16',      color: '#1a1a1a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey16',   name: 'Серый 16-пин',            alias: 'GREY-16',       color: '#3a4a5a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── Специальные ─────────────────────────────────────────────────
  { id: 'orange6',  name: 'Оранжевый 6-пин',        alias: 'ORANGE-6',      color: '#7a4400', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },
  { id: 'green6',   name: 'Зелёный 6-пин',           alias: 'GREEN-6',       color: '#1a4a2a', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },
  { id: 'blue6',    name: 'Синий 6-пин',             alias: 'BLUE-6',        color: '#1a2a5a', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },
];

// ── Wire Color Palette ───────────────────────────────────────────
export const WIRE_COLORS: WireColor[] = [
  { hex: '#e63030', name: 'Красный' },
  { hex: '#e67530', name: 'Оранжевый' },
  { hex: '#e6c830', name: 'Жёлтый' },
  { hex: '#3ddc84', name: 'Зелёный' },
  { hex: '#3eb8ff', name: 'Голубой' },
  { hex: '#2255cc', name: 'Синий' },
  { hex: '#b06aff', name: 'Фиолетовый' },
  { hex: '#ff55aa', name: 'Розовый' },
  { hex: '#ffffff', name: 'Белый' },
  { hex: '#c8c8c8', name: 'Серый' },
  { hex: '#444444', name: 'Тёмно-серый' },
  { hex: '#000000', name: 'Чёрный' },
  { hex: '#8B4513', name: 'Коричневый' },
  { hex: '#006644', name: 'Тёмно-зелёный' },
  { hex: '#004488', name: 'Тёмно-синий' },
  { hex: '#cc2277', name: 'Малиновый' },
  { hex: '#ffaa00', name: 'Янтарный' },
  { hex: '#00ccaa', name: 'Бирюзовый' },
];

// ── Connector geometry constants ─────────────────────────────────
export const PIN_SCALE = 56;       // px per pin cell (world units)
export const PIN_OUTER_PAD = 12;   // padding around pin grid

// ── CSS Design Tokens ────────────────────────────────────────────
export const COLORS = {
  bg:        '#0a0c10',
  surface:   '#111318',
  surface2:  '#181c24',
  surface3:  '#1f2535',
  border:    '#252d3d',
  border2:   '#303a50',
  accent:    '#f0c040',
  accent2:   '#3eb8ff',
  accent3:   '#b06aff',
  green:     '#3ddc84',
  orange:    '#ff8c42',
  red:       '#ff4d4d',
  yellow:    '#ffe066',
  text:      '#c8d4f0',
  textDim:   '#5a6880',
  textMid:   '#8090b0',
  pinFree:   '#3a4560',
};

export const WIRE_SECTIONS = [
  '0.35 мм²', '0.5 мм²', '0.75 мм²', '1.0 мм²', '1.5 мм²', '2.5 мм²',
  '4 мм²', '6 мм²', '10 мм²', '16 мм²', '25 мм²',
];
