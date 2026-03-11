import type { Connector, ConnSize, Point } from '../types';
import { LIBRARY, PIN_SCALE, PIN_OUTER_PAD } from '../constants';

// ── Library lookup ────────────────────────────────────────────────
export function getConnDef(libId: string) {
  const def = LIBRARY.find((l) => l.id === libId);
  if (!def) throw new Error(`Unknown libId: ${libId}`);
  return def;
}

// ── Connector bounding box size ───────────────────────────────────
export function connSize(c: Pick<Connector, 'libId' | 'rotation'>): ConnSize {
  const def = getConnDef(c.libId);
  const w = def.cols * PIN_SCALE + PIN_OUTER_PAD * 2;
  const h = def.rows * PIN_SCALE + PIN_OUTER_PAD * 2 + (def.lock ? 14 : 0);
  return { w, h, scale: PIN_SCALE, def };
}

// ── Rotate a local point around centre ───────────────────────────
export function rotatePoint(lx: number, ly: number, rotDeg: number, w: number, h: number): Point {
  const r = (rotDeg * Math.PI) / 180;
  const rx = lx * Math.cos(r) - ly * Math.sin(r);
  const ry = lx * Math.sin(r) + ly * Math.cos(r);
  return { x: rx + w / 2, y: ry + h / 2 };
}

// ── Pin centre in connector-local coordinates ─────────────────────
export function getPinLocalPos(c: Connector, pinIdx: number): Point {
  const { w, h } = connSize(c);
  const def = getConnDef(c.libId);
  const row = Math.floor(pinIdx / def.cols);
  const col = pinIdx % def.cols;
  const px = PIN_OUTER_PAD + col * PIN_SCALE + PIN_SCALE / 2;
  const py = PIN_OUTER_PAD + row * PIN_SCALE + PIN_SCALE / 2;
  return rotatePoint(px - w / 2, py - h / 2, c.rotation, w, h);
}

// ── Pin centre in world (canvas) coordinates ─────────────────────
export function getAbsolutePin(connector: Connector, pinIdx: number): Point {
  const { w, h } = connSize(connector);
  const lp = getPinLocalPos(connector, pinIdx);
  return {
    x: connector.x + lp.x - w / 2,
    y: connector.y + lp.y - h / 2,
  };
}

// ── Point on a cubic Bezier curve at parameter t ─────────────────
export function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return (
    Math.pow(1 - t, 3) * p0 +
    3 * Math.pow(1 - t, 2) * t * p1 +
    3 * (1 - t) * t * t * p2 +
    Math.pow(t, 3) * p3
  );
}

// ── Build SVG cubic Bezier path string between two points ─────────
export function buildWirePath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const cx1 = from.x + dx * 0.4;
  const cy1 = from.y;
  const cx2 = to.x - dx * 0.4;
  const cy2 = to.y;
  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
}

// ── Control points for Bezier (used for label position) ──────────
export function getWireControlPoints(from: Point, to: Point) {
  const dx = to.x - from.x;
  return {
    cx1: from.x + dx * 0.4,
    cy1: from.y,
    cx2: to.x - dx * 0.4,
    cy2: to.y,
  };
}

// ── Hit-test a connector body ─────────────────────────────────────
export function hitTestConnector(wx: number, wy: number, connectors: Connector[]): Connector | null {
  for (let i = connectors.length - 1; i >= 0; i--) {
    const c = connectors[i];
    const { w, h } = connSize(c);
    const dx = wx - c.x;
    const dy = wy - c.y;
    // Approximate (un-rotate the hit point for rotated connectors)
    const angle = -(c.rotation * Math.PI) / 180;
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
    if (rx >= -w / 2 && rx <= w / 2 && ry >= -h / 2 && ry <= h / 2) {
      return c;
    }
  }
  return null;
}

export interface PinHit {
  connId: string;
  pinIdx: number;
}

// ── Hit-test individual pins ──────────────────────────────────────
export function hitTestPin(wx: number, wy: number, connectors: Connector[]): PinHit | null {
  const radius = PIN_SCALE * 0.34;
  for (const c of connectors) {
    const def = getConnDef(c.libId);
    for (let i = 0; i < def.rows * def.cols; i++) {
      const abs = getAbsolutePin(c, i);
      if (Math.hypot(wx - abs.x, wy - abs.y) < radius) {
        return { connId: c.id, pinIdx: i };
      }
    }
  }
  return null;
}

// ── Generate unique IDs ───────────────────────────────────────────
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Snap a value to a grid ────────────────────────────────────────
export function snapToGrid(v: number, grid = 8): number {
  return Math.round(v / grid) * grid;
}
