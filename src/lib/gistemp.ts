// NASA GISTEMP v4, read at build time from the four CSVs in src/data/gistemp/
// (downloaded as is from https://data.giss.nasa.gov/gistemp/tabledata_v4/). To update the page,
// download them again, replace them, change ACCESSED and rebuild.
import { csvParse, geoEqualEarth, geoPath } from 'd3';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import zonalCsv from '../data/gistemp/ZonAnn.Ts+dSST.csv?raw';
import globalCsv from '../data/gistemp/GLB.Ts+dSST.csv?raw';
import northCsv from '../data/gistemp/NH.Ts+dSST.csv?raw';
import southCsv from '../data/gistemp/SH.Ts+dSST.csv?raw';

export const ACCESSED = '2026-10-31';

/** The 8 latitude bands, north to south, with their edges in degrees. */
const BANDS = [
  { key: '64N-90N', label: '64–90°N', south: 64, north: 90 },
  { key: '44N-64N', label: '44–64°N', south: 44, north: 64 },
  { key: '24N-44N', label: '24–44°N', south: 24, north: 44 },
  { key: 'EQU-24N', label: '0–24°N', south: 0, north: 24 },
  { key: '24S-EQU', label: '0–24°S', south: -24, north: 0 },
  { key: '44S-24S', label: '24–44°S', south: -44, north: -24 },
  { key: '64S-44S', label: '44–64°S', south: -64, north: -44 },
  { key: '90S-64S', label: '64–90°S', south: -90, north: -64 },
];

/**
 * Each band's share of the chart height: half an equal share, half its share of the
 * Earth's surface (sin north − sin south, over 2). Pure surface makes the poles 4 times
 * thinner than the tropics; this keeps the order but only about 2 times.
 */
export const AREA_WEIGHT = 0.5;
const rad = (d: number) => (d * Math.PI) / 180;
export const ZONES = BANDS.map(b => ({
  ...b,
  share: (1 - AREA_WEIGHT) / BANDS.length + AREA_WEIGHT * (Math.sin(rad(b.north)) - Math.sin(rad(b.south))) / 2,
}));

/**
 * A world map for the readout, projected at build time (Equal Earth: true areas, straight
 * parallels, so each latitude band is a horizontal strip). Paths fit a 1000-wide box.
 */
export const MAP_WIDTH = 1000;
function worldMap() {
  const sphere = { type: 'Sphere' } as const;
  const projection = geoEqualEarth().fitWidth(MAP_WIDTH, sphere);
  const path = geoPath(projection);
  const round = (d: string | null) => (d ?? '').replace(/(\d+\.\d)\d+/g, '$1');
  const [[, y0], [, y1]] = path.bounds(sphere);
  // a band is the strip between two parallels, drawn densely so it follows the curved edge
  const band = (south: number, north: number) => {
    const ring: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 2) ring.push([lon, south]);
    for (let lon = 180; lon >= -180; lon -= 2) ring.push([lon, north]);
    ring.push(ring[0]);
    return { type: 'Polygon', coordinates: [ring.reverse()] } as any;
  };
  const land = feature(land110 as any, (land110 as any).objects.land);
  return {
    height: Math.ceil(y1 - y0),
    sphere: round(path(sphere)),
    land: round(path(land as any)),
    bands: Object.fromEntries(BANDS.map(b => [b.key, round(path(band(b.south, b.north)))])),
  };
}

export const GLOBALS = ['Glob', 'NHem', 'SHem'];

export interface ClimateData {
  years: number[];                          // one entry per complete year
  series: Record<string, number[]>;        // annual anomalies (°C vs 1951–1980), aligned on years
  monthly: { start: number; values: (number | null)[]; hem: Record<'NHem' | 'SHem', (number | null)[]> }; // global and hemispheres, from January of `start`
  zones: typeof ZONES;
  map: ReturnType<typeof worldMap>;         // world map paths, 1000 wide (Equal Earth)
  accessed: string;
}

/** '***' marks a month NASA has not published yet. */
const num = (s: string | undefined): number | null => {
  if (s == null) return null;
  const t = s.trim();
  if (t === '' || t.startsWith('*')) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
};

function load(): ClimateData {
  const zonal = csvParse(zonalCsv.trim());
  const years = zonal.map(r => Number(r.Year));
  const series: Record<string, number[]> = {};
  for (const key of [...GLOBALS, ...ZONES.map(z => z.key)]) {
    series[key] = zonal.map(r => num(r[key]) as number);
  }

  // the monthly tables have a title line before the header; all three start in January 1880
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyOf = (csv: string) => {
    const rows = csvParse(csv.trim().split('\n').slice(1).join('\n'));
    return { start: Number(rows[0].Year), values: rows.flatMap(r => MONTHS.map(m => num(r[m]))) };
  };
  const glb = monthlyOf(globalCsv);
  const values = glb.values;
  while (values.length && values[values.length - 1] == null) values.pop();
  const hem = {
    NHem: monthlyOf(northCsv).values.slice(0, values.length),
    SHem: monthlyOf(southCsv).values.slice(0, values.length),
  };

  return { years, series, monthly: { start: glb.start, values, hem }, zones: ZONES, map: worldMap(), accessed: ACCESSED };
}

export const climate = load();

/** A few facts for the page text, so the words follow the data when it is updated. */
export function facts(d: ClimateData = climate) {
  const { years, series } = d;
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const between = (k: string, a: number, b: number) => series[k].filter((_, i) => years[i] >= a && years[i] <= b);

  const last = years.length - 1;
  const lastYear = years[last];
  const glob = series.Glob;
  const warmest = glob.indexOf(Math.max(...glob));

  // since when every year has been above the 1951–1980 mean
  let streak = last;
  while (streak > 0 && glob[streak - 1] > 0) streak--;

  const decade = [lastYear - 9, lastYear] as const;
  const arcticRatio = mean(between('64N-90N', ...decade)) / mean(between('Glob', ...decade));
  const preIndustrial = mean(between('Glob', 1880, 1900));

  const n = d.monthly.values.length - 1;
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    firstYear: years[0],
    lastYear,
    lastGlobal: glob[last],
    lastArctic: series['64N-90N'][last],
    warmestYear: years[warmest],
    warmestValue: glob[warmest],
    warmestVsPre: glob[warmest] - preIndustrial,
    aboveSince: years[streak],
    decade,
    arcticRatio,
    lastMonth: `${MONTH_NAMES[n % 12]} ${d.monthly.start + Math.floor(n / 12)}`,
  };
}
