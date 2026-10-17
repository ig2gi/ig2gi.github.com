import { scalePoint } from 'd3-scale';
import type { ProcessedEvent, Track } from './timelineData';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SVG_HEIGHT   = 500;
export const PAD_LEFT     = 80;
export const PAD_RIGHT    = 60;
export const PAD_TOP      = 40;
export const PAD_BOTTOM   = 60;
export const STATION_GAP  = 80; // min px between stations

export const TRACK_LABELS: Record<Track, string> = {
  leadership:  'LEADERSHIP',
  product:     'PRODUCT',
  dataviz:     'DATA VIZ',
  engineering: 'ENGINEERING',
  education:   'EDUCATION',
};

// Y positions (top → bottom = leadership → education)
const TRACK_ORDER: Track[] = ['leadership', 'product', 'dataviz', 'engineering', 'education'];

const TRACK_Y_NORM: Record<Track, number> = {
  leadership:  0.08,
  product:     0.26,
  dataviz:     0.46,
  engineering: 0.66,
  education:   0.86,
};

// Station radii by variant
export const STATION_RADIUS: Record<string, number> = {
  vp:     14,
  head:   10,
  ic:      6,
  degree:  6,
  cert:    5,
  mooc:    4,
};

// ─── Computed layout ──────────────────────────────────────────────────────────

export interface StationLayout {
  event: ProcessedEvent;
  x: number;
  y: number;
  r: number;
}

export interface ConnectionLayout {
  from: StationLayout;
  to: StationLayout;
  path: string;
  color: string;
  isTransition: boolean; // track change = dashed/curved
}

export function computeLayout(events: ProcessedEvent[]): {
  stations: StationLayout[];
  connections: ConnectionLayout[];
  educationDots: StationLayout[];
  svgWidth: number;
  trackY: (track: Track) => number;
} {
  const mainEvents = events.filter(e => e.track !== 'education');
  const eduEvents  = events.filter(e => e.track === 'education');

  // X scale — equal spacing over experience events
  const svgWidth = Math.max(
    PAD_LEFT + PAD_RIGHT + mainEvents.length * STATION_GAP,
    900,
  );

  const xScale = scalePoint<number>()
    .domain(mainEvents.map(e => e.id))
    .range([PAD_LEFT, svgWidth - PAD_RIGHT])
    .padding(0.5);

  const trackY = (track: Track) =>
    PAD_TOP + TRACK_Y_NORM[track] * (SVG_HEIGHT - PAD_TOP - PAD_BOTTOM);

  // Main stations
  const stations: StationLayout[] = mainEvents.map(ev => ({
    event: ev,
    x: xScale(ev.id) ?? 0,
    y: trackY(ev.track),
    r: STATION_RADIUS[ev.variant] ?? 6,
  }));

  // Education dots — placed at x of nearest main event by date
  const educationDots: StationLayout[] = eduEvents.map(ev => {
    // find closest main event by start date
    const closest = mainEvents.reduce((best, cur) =>
      Math.abs(cur.startDate.getTime() - ev.startDate.getTime()) <
      Math.abs(best.startDate.getTime() - ev.startDate.getTime())
        ? cur : best
    );
    return {
      event: ev,
      x: (xScale(closest.id) ?? 0) + (Math.random() * 20 - 10), // slight jitter to avoid overlap
      y: trackY('education'),
      r: STATION_RADIUS[ev.variant] ?? 4,
    };
  });

  // Connections — pairs of consecutive main events
  const connections: ConnectionLayout[] = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const from = stations[i];
    const to   = stations[i + 1];
    const isTransition = from.event.track !== to.event.track;
    connections.push({
      from,
      to,
      path: buildPath(from.x, from.y, to.x, to.y, isTransition),
      color: from.event.color,
      isTransition,
    });
  }

  return { stations, connections, educationDots, svgWidth, trackY };
}

// ─── Path builder ─────────────────────────────────────────────────────────────

function buildPath(x1: number, y1: number, x2: number, y2: number, curve: boolean): string {
  if (!curve || Math.abs(y1 - y2) < 2) {
    // straight horizontal
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  // Cubic bezier: control points pull horizontally then curve to destination
  const cx1 = x1 + (x2 - x1) * 0.5;
  const cx2 = x1 + (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;
}
