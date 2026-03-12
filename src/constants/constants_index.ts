import type { ConnectorDef, WireColor } from '../types';

// ── Connector Library ────────────────────────────────────────────
export const LIBRARY: ConnectorDef[] = [
  // ── Оригинальные ────────────────────────────────────────────────
  { id: 'grey20',   name: 'Серый 20-пин',              alias: 'GREY-20',       color: '#334455', rows: 5, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'violet20', name: 'Фиолетовый 20-пин',         alias: 'VIOLET-20',     color: '#774488', rows: 4, cols: 5, pin_shape: 'rect',   lock: null },
  { id: 'blue20',   name: 'Голубой 20-пин №22',        alias: 'BLUE-20-22',    color: '#226688', rows: 5, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey20s',  name: 'Серый герм. №23',            alias: 'GREY-20-SEAL',  color: '#556677', rows: 5, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'yellow6',  name: 'Жёлтый 6-пин №9',           alias: 'YELLOW-6',      color: '#888800', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },

  // ── Клеммы (кольца) ─────────────────────────────────────────────
  { id: 'terminal', name: 'Клемма (кольцо)',            alias: 'TERMINAL',      color: '#1a1a1a', rows: 1, cols: 1, pin_shape: 'circle', lock: null },

  // ── Малые (2–6 пинов) ───────────────────────────────────────────
  { id: 'black2',   name: 'Чёрный 2-пин',               alias: 'BLACK-2',       color: '#2a2a2a', rows: 1, cols: 2, pin_shape: 'square', lock: null },
  { id: 'black3',   name: 'Чёрный 3-пин',               alias: 'BLACK-3',       color: '#2a2a2a', rows: 1, cols: 3, pin_shape: 'square', lock: null },
  { id: 'black4',   name: 'Чёрный 4-пин',               alias: 'BLACK-4',       color: '#2a2a2a', rows: 1, cols: 4, pin_shape: 'square', lock: null },
  { id: 'white2',   name: 'Белый 2-пин',                 alias: 'WHITE-2',       color: '#556677', rows: 1, cols: 2, pin_shape: 'rect',   lock: 'bottom' },
  { id: 'white4',   name: 'Белый 4-пин',                 alias: 'WHITE-4',       color: '#556677', rows: 1, cols: 4, pin_shape: 'rect',   lock: 'bottom' },

  // ── Средние (7–12 пинов) ────────────────────────────────────────
  { id: 'black7c',  name: 'Чёрный 7-пин (7C)',          alias: 'BLACK-7C',      color: '#1e2a35', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'white8c',  name: 'Белый 8-пин (8C)',            alias: 'WHITE-8C',      color: '#4a5a6a', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'black10',  name: 'Чёрный 10-пин',               alias: 'BLACK-10',      color: '#1e2a35', rows: 2, cols: 5, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey12',   name: 'Серый 12-пин',                alias: 'GREY-12',       color: '#3a4a5a', rows: 3, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── Силовые ─────────────────────────────────────────────────────
  { id: 'red16',    name: 'Красный 16-пин силовой',      alias: 'RED-16',        color: '#5a1a1a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'black16',  name: 'Чёрный 16-пин',               alias: 'BLACK-16',      color: '#1a1a1a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey16',   name: 'Серый 16-пин',                 alias: 'GREY-16',       color: '#3a4a5a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── Специальные ─────────────────────────────────────────────────
  { id: 'orange6',  name: 'Оранжевый 6-пин',             alias: 'ORANGE-6',      color: '#7a4400', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },
  { id: 'green6',   name: 'Зелёный 6-пин',                alias: 'GREEN-6',       color: '#1a4a2a', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },
  { id: 'blue6',    name: 'Синий 6-пин',                  alias: 'BLUE-6',        color: '#1a2a5a', rows: 2, cols: 3, pin_shape: 'rect',   lock: 'top' },

  // ── Крупные многопиновые ─────────────────────────────────────────
  { id: 'pink36',   name: 'Розовый 36-пин (4x9)',        alias: 'PINK-36',       color: '#8a3560', rows: 4, cols: 9, pin_shape: 'square', lock: 'bottom' },
  { id: 'green36',  name: 'Зелёный 36-пин (4x9)',        alias: 'GREEN-36',      color: '#1a5a2a', rows: 4, cols: 9, pin_shape: 'square', lock: 'bottom' },
  { id: 'yellow18', name: 'Жёлтый 18-пин (3x6)',         alias: 'YELLOW-18',     color: '#7a6a00', rows: 3, cols: 6, pin_shape: 'square', lock: 'bottom' },

  // ── 6-пин разные цвета ───────────────────────────────────────────
  { id: 'black6',   name: 'Чёрный 6-пин',                alias: 'BLACK-6',       color: '#2a2a2a', rows: 2, cols: 3, pin_shape: 'square', lock: null },
  { id: 'white6',   name: 'Белый 6-пин',                  alias: 'WHITE-6',       color: '#4a5a6a', rows: 2, cols: 3, pin_shape: 'square', lock: null },
  { id: 'white10',  name: 'Белый 10-пин (2x5)',           alias: 'WHITE-10',      color: '#4a5a6a', rows: 2, cols: 5, pin_shape: 'square', lock: 'bottom' },

  // ── 14-пин ───────────────────────────────────────────────────────
  { id: 'black14',  name: 'Чёрный 14-пин (2x7)',         alias: 'BLACK-14',      color: '#1e2a35', rows: 2, cols: 7, pin_shape: 'square', lock: 'bottom' },

  // ── 8-пин разные цвета ───────────────────────────────────────────
  { id: 'black8',   name: 'Чёрный 8-пин (2x4)',          alias: 'BLACK-8',       color: '#2a2a2a', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'white8',   name: 'Белый 8-пин (2x4)',            alias: 'WHITE-8',       color: '#4a5a6a', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey8',    name: 'Серый 8-пин (2x4)',            alias: 'GREY-8',        color: '#3a4a5a', rows: 2, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── 16-пин разные цвета ──────────────────────────────────────────
  { id: 'white16',  name: 'Белый 16-пин (4x4)',           alias: 'WHITE-16',      color: '#4a5a6a', rows: 4, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── 2-пин разные цвета ───────────────────────────────────────────
  { id: 'grey2',    name: 'Серый 2-пин',                  alias: 'GREY-2',        color: '#3a4a5a', rows: 1, cols: 2, pin_shape: 'square', lock: null },
  { id: 'white2s',  name: 'Белый 2-пин (с замком)',       alias: 'WHITE-2S',      color: '#4a5a6a', rows: 1, cols: 2, pin_shape: 'square', lock: 'bottom' },

  // ── 3-пин ────────────────────────────────────────────────────────
  { id: 'grey3',    name: 'Серый 3-пин',                   alias: 'GREY-3',        color: '#3a4a5a', rows: 1, cols: 3, pin_shape: 'square', lock: null },

  // ── 4-пин ────────────────────────────────────────────────────────
  { id: 'grey4',    name: 'Серый 4-пин',                   alias: 'GREY-4',        color: '#3a4a5a', rows: 1, cols: 4, pin_shape: 'square', lock: null },
  { id: 'white4s',  name: 'Белый 4-пин (с замком)',        alias: 'WHITE-4S',      color: '#4a5a6a', rows: 1, cols: 4, pin_shape: 'square', lock: 'bottom' },

  // ── Чёрно-жёлтые ─────────────────────────────────────────────────
  { id: 'bkyw1',    name: 'Чёрно-жёлтый 1-пин',           alias: 'BKYW-1',        color: '#3a3300', rows: 1, cols: 1, pin_shape: 'square', lock: null },
  { id: 'bkyw2',    name: 'Чёрно-жёлтый 2-пин',           alias: 'BKYW-2',        color: '#3a3300', rows: 1, cols: 2, pin_shape: 'square', lock: null },
  { id: 'bkyw3',    name: 'Чёрно-жёлтый 3-пин',           alias: 'BKYW-3',        color: '#3a3300', rows: 1, cols: 3, pin_shape: 'square', lock: null },

  // ── Прочие ───────────────────────────────────────────────────────
  { id: 'grey36',   name: 'Серый 36-пин (6x6)',            alias: 'GREY-36',       color: '#3a4a5a', rows: 6, cols: 6, pin_shape: 'square', lock: 'bottom' },
  { id: 'white21',  name: 'Белый 21-пин (3x7)',            alias: 'WHITE-21',      color: '#4a5a6a', rows: 3, cols: 7, pin_shape: 'square', lock: 'bottom' },
  { id: 'grey5',    name: 'Серый 5-пин (1x5)',             alias: 'GREY-5',        color: '#3a4a5a', rows: 1, cols: 5, pin_shape: 'square', lock: null },
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
export const PIN_SCALE = 56;
export const PIN_OUTER_PAD = 12;

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
