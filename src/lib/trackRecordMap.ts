// Geometry of the track record map, computed at build time.
// Today (the hub) sits in the centre; the SOPHiA roles lie on a circle around it,
// one lane per line; earlier roles are placed by hand in the outskirts and joined
// by 45° connectors, like a metro map. No time axis.
import data from '../data/track-record.json';

export type Anchor = 'start' | 'middle' | 'end';
export interface Line { id: string; name: string; short: string; color: string; fast?: boolean }
export interface Station {
  title: string; co: string; years: string; proof: string;
  ring?: number;                        // angle on the circle, degrees clockwise from east
  x?: number; y?: number;               // position off the circle
  lab?: [number, number, string];       // label offset and anchor
  order?: string;                       // top-to-bottom order of the lines at this station
  fan?: string;                         // order of the lines leaving the circle here
  on: string[];                         // lines that stop here (derived from the routes)
}
interface Route { stops: string[]; end: [number, number, string] }

export const W = 1180, H = 830;
const CX = 540, CY = 380, R = 125, LANE_GAP = 10, SLOT = 10, FAN = 5, EXIT = 62;
export const HUB = { x: CX, y: CY, r: 34 };
export const RING = { x: CX, y: CY, r: R, width: LANE_GAP * 5 + 8 };

export const lines: Line[] = data.lines;
const lanes: string[] = data.lanes;
const routes = data.routes as Record<string, Route>;
export const stations = data.stations as unknown as Record<string, Station>;
for (const s of Object.values(stations)) s.on = [];
for (const [id, r] of Object.entries(routes)) for (const sid of r.stops) stations[sid].on.push(id);

const rad = (a: number) => a * Math.PI / 180;
const order = (id: string) => lines.findIndex(l => l.id === id);
const laneR = (id: string) => R + (lanes.indexOf(id) - (lanes.length - 1) / 2) * LANE_GAP;
const onRing = (a: number, r: number): [number, number] => [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))];
const isRing = (sid: string) => stations[sid].ring !== undefined;

// off the circle, each line at a station gets its own slot, side by side
function slot(sid: string, id: string): [number, number] {
  const s = stations[sid];
  const on = s.order ? [...s.order] : [...s.on].sort((a, b) => order(a) - order(b));
  return [s.x!, s.y! + (on.indexOf(id) - (on.length - 1) / 2) * SLOT];
}

// lines entering from the hub, or leaving outwards, at the same station fan out by a few degrees
function fan(sid: string, id: string, kind: 'in' | 'out'): number {
  const fanOrder = stations[sid].fan;
  const group = Object.keys(routes).filter(l => {
    const rings = routes[l].stops.filter(isRing);
    return kind === 'in' ? rings[0] === sid : rings[rings.length - 1] === sid;
  }).sort((a, b) => kind === 'out' && fanOrder ? fanOrder.indexOf(a) - fanOrder.indexOf(b) : order(a) - order(b));
  const k = group.indexOf(id);
  return kind === 'in' ? -FAN * (group.length - k) : FAN * (k + 1);
}

// 45° connector: straight, diagonal, straight
function oct([x1, y1]: number[], [x2, y2]: number[]): string {
  const dx = x2 - x1, dy = y2 - y1, ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax >= ay) { const e = (ax - ay) / 2 * Math.sign(dx); return ` L${x1 + e},${y1} L${x2 - e},${y2} L${x2},${y2}`; }
  const e = (ay - ax) / 2 * Math.sign(dy); return ` L${x1},${y1 + e} L${x2},${y2 - e} L${x2},${y2}`;
}

export function linePath(id: string): string {
  const { stops, end } = routes[id];
  let d = '', prev: number[] = [CX, CY], lastRing: number | null = null;
  stops.forEach((sid, k) => {
    if (sid === 'hub') { d = `M${CX},${CY}`; return; }
    const s = stations[sid];
    if (s.ring !== undefined) {
      const isLast = !stops.slice(k + 1).some(isRing);
      if (lastRing === null) {                                     // spoke from the hub
        const p0 = onRing(s.ring + fan(sid, id, 'in'), laneR(id));
        d += ` L${p0[0]},${p0[1]}`;
      }
      const a = isLast ? s.ring + fan(sid, id, 'out') : s.ring;
      const p = onRing(a, laneR(id));
      d += ` A${laneR(id)},${laneR(id)} 0 0 1 ${p[0]},${p[1]}`;    // along the circle, clockwise
      lastRing = a; prev = p; return;
    }
    if (lastRing !== null) {                                       // leave the circle outwards
      const out = onRing(lastRing, R + EXIT);
      d += ` L${out[0]},${out[1]}`; prev = out; lastRing = null;
    }
    const p = slot(sid, id);
    d += oct(prev, p); prev = p;
  });
  if (lastRing !== null) { const out = onRing(lastRing, R + EXIT); d += ` L${out[0]},${out[1]}`; prev = out; }
  return d + oct(prev, end);
}

export interface Terminus { x: number; y: number; tx: number; ty: number; anchor: Anchor }
export function terminus(id: string): Terminus {
  const [x, y, a] = routes[id].end;
  const below = a === 'end-below', above = a === 'above';
  return {
    x, y,
    tx: below ? x : above ? x - 10 : x + (a === 'end' ? -18 : 18),
    ty: below ? y + 32 : above ? y - 34 : y + 5,
    anchor: below ? 'end' : above ? 'start' : a as Anchor,
  };
}

// a station's mark: a ring for one line, a capsule across the lines of an interchange
export interface Mark { x1: number; y1: number; x2: number; y2: number; single: boolean }
export function mark(sid: string): Mark {
  const s = stations[sid];
  if (s.ring !== undefined) {
    const rs = s.on.map(laneR);
    const [x1, y1] = onRing(s.ring, Math.min(...rs)), [x2, y2] = onRing(s.ring, Math.max(...rs));
    return { x1, y1, x2, y2, single: false };
  }
  const ys = s.on.map(id => slot(sid, id)[1]);
  return { x1: s.x!, y1: Math.min(...ys), x2: s.x!, y2: Math.max(...ys), single: ys.length === 1 };
}

export function label(sid: string): { x: number; y: number; anchor: Anchor } {
  const s = stations[sid];
  if (s.ring === undefined) return { x: s.x! + s.lab![0], y: s.y! + s.lab![1], anchor: s.lab![2] as Anchor };
  const [lx, ly] = onRing(s.ring, R + 44), c = Math.cos(rad(s.ring)), sn = Math.sin(rad(s.ring));
  if (s.lab) return { x: lx + s.lab[0], y: ly + s.lab[1], anchor: s.lab[2] as Anchor };
  return { x: lx, y: ly + (sn < -0.5 ? -8 : sn > 0.5 ? 14 : 0), anchor: c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle' };
}

export const routeStops = (id: string) => routes[id].stops.map(sid => stations[sid]);
